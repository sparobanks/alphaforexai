"""
Signal publisher: sends alerts to Telegram and email.
Full details are always inside the dashboard — alerts contain only partial info
to drive users back to the platform.
"""
import asyncio
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
from app.core.logger import logger


# ── Telegram ──────────────────────────────────────────────────────────────────

async def send_telegram(signal: dict) -> bool:
    """
    Sends partial signal info to Telegram channel.
    Direction + pair only — full details locked inside dashboard.
    """
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHANNEL_ID:
        logger.warning("Telegram not configured — skipping")
        return False

    try:
        import telegram
        bot = telegram.Bot(token=settings.TELEGRAM_BOT_TOKEN)

        direction_emoji = "🟢" if signal["direction"] == "BUY" else "🔴"
        confidence_stars = "⭐" * round(signal["confidence"] * 5)

        # Partial info only — no SL/TP in the alert
        text = (
            f"{direction_emoji} *New Signal: {signal['pair']}*\n\n"
            f"Direction: *{signal['direction']}*\n"
            f"Confidence: {confidence_stars} ({signal['confidence']:.0%})\n"
            f"Timeframe: {signal['timeframe']}\n\n"
            f"⚠️ Entry, SL, and TP available inside the dashboard.\n"
            f"👉 [View full signal](https://alphaforexai.com/dashboard)"
        )

        await bot.send_message(
            chat_id=settings.TELEGRAM_CHANNEL_ID,
            text=text,
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        logger.info(f"Telegram alert sent for {signal['pair']} {signal['direction']}")
        return True

    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False


# ── Email ─────────────────────────────────────────────────────────────────────

async def send_email_alert(signal: dict, recipient: str) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("Email not configured — skipping")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"ForexAI Signal: {signal['direction']} {signal['pair']}"
        msg["From"]    = settings.SMTP_USER
        msg["To"]      = recipient

        direction_color = "#22c55e" if signal["direction"] == "BUY" else "#ef4444"
        confidence_pct  = f"{signal['confidence']:.0%}"

        html = f"""
        <html><body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="border-left: 4px solid {direction_color}; padding-left: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: {direction_color};">{signal['direction']} Signal</h2>
            <p style="margin: 4px 0; color: #666;">{signal['pair']} · {signal['timeframe']}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #666;">Confidence</td>
                <td style="padding: 8px 0; font-weight: bold;">{confidence_pct}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Direction</td>
                <td style="padding: 8px 0; font-weight: bold;">{signal['direction']}</td></tr>
          </table>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #666;">
              Full signal details (entry, SL, TP) are available inside your dashboard.
            </p>
          </div>
          <a href="https://alphaforexai.com/dashboard"
             style="background: {direction_color}; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; display: inline-block;">
            View Full Signal →
          </a>
        </body></html>
        """

        msg.attach(MIMEText(html, "html"))

        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        async with aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=465,
            use_tls=True,
            tls_context=ctx,
        ) as smtp:
            await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            await smtp.send_message(msg)

        logger.info(f"Email alert sent to {recipient}")
        return True

    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


# ── Publish to all channels ────────────────────────────────────────────────────

async def get_vip_emails() -> list[str]:
    """Get emails of VIP users only (for multi-pair signals)."""
    try:
        from app.db.session import AsyncSessionLocal
        from app.api.routes_auth import User, SubscriptionTier
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User.email).where(
                    User.tier == SubscriptionTier.VIP,
                    User.is_active == True,
                )
            )
            return [row[0] for row in result.fetchall()]
    except Exception as e:
        logger.error(f"Failed to get VIP emails: {e}")
        return []


async def get_pro_vip_emails() -> list[str]:
    """Get emails of all active Pro and VIP users."""
    try:
        from app.db.session import AsyncSessionLocal
        from app.api.routes_auth import User, SubscriptionTier
        from sqlalchemy import select
        from datetime import datetime
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User.email).where(
                    User.tier.in_([SubscriptionTier.PRO, SubscriptionTier.VIP]),
                    User.is_active == True,
                )
            )
            emails = [row[0] for row in result.fetchall()]
            return emails
    except Exception as e:
        logger.error(f"Failed to get pro/vip emails: {e}")
        return []


async def publish_signal(signal: dict, email_recipients: list[str] = None) -> dict:
    results = {}

    results["telegram"] = await send_telegram(signal)

    if email_recipients:
        email_tasks = [send_email_alert(signal, r) for r in email_recipients]
        email_results = await asyncio.gather(*email_tasks, return_exceptions=True)
        results["email"] = all(r is True for r in email_results)

    return results


async def send_close_alert(signal: dict):
    """Send Telegram alert when a signal closes (TP or SL hit)."""
    try:
        import os
        import telegram
        token   = os.getenv("TELEGRAM_BOT_TOKEN")
        channel = os.getenv("TELEGRAM_CHANNEL_ID")
        if not token or not channel:
            return

        status   = signal.get("status", "")
        pair     = signal.get("pair", "")
        direction = signal.get("direction", "")
        pnl      = signal.get("pnl_pips", 0)
        conf     = signal.get("confidence")

        if status == "TP_HIT":
            emoji = "✅"
            result = f"+{pnl} pips 🎯 TP Hit"
        else:
            emoji = "❌"
            result = f"{pnl} pips 🛑 SL Hit"

        conf_str = f" | {round(conf * 100)}% conf" if conf else ""
        text = (
            f"{emoji} *Signal Closed*\n\n"
            f"*{pair}* {direction}{conf_str}\n"
            f"Result: {result}\n\n"
            f"📊 Full details: alphaforexai.com/dashboard"
        )

        bot = telegram.Bot(token=token)
        await bot.send_message(chat_id=channel, text=text, parse_mode="Markdown")
        logger.info(f"Close alert sent: {pair} {status} {pnl}p")
    except Exception as e:
        logger.error(f"Close alert failed: {e}")
