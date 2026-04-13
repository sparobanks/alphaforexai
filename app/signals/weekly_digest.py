"""
Weekly email digest - sent every Monday at 8am UTC.
Summarises the past week's signal performance for all users.
"""
import ssl
import aiosmtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Signal, SignalStatus
from app.api.routes_auth import User, SubscriptionTier
from app.core.config import settings
from app.core.logger import logger


async def send_weekly_digest():
    logger.info("Sending weekly digest...")
    try:
        async with AsyncSessionLocal() as db:
            # Get last 7 days of closed signals
            cutoff = datetime.utcnow() - timedelta(days=7)
            result = await db.execute(
                select(Signal).where(
                    Signal.created_at >= cutoff,
                    Signal.status != SignalStatus.OPEN,
                )
            )
            signals = result.scalars().all()

            if not signals:
                logger.info("No signals to report this week")
                return

            total  = len(signals)
            wins   = sum(1 for s in signals if s.status == SignalStatus.TP_HIT)
            losses = sum(1 for s in signals if s.status == SignalStatus.SL_HIT)
            pnl    = sum(s.pnl_pips or 0 for s in signals)
            wr     = wins / total if total else 0

            # Build signal rows for email
            rows = ""
            for s in sorted(signals, key=lambda x: x.created_at, reverse=True)[:10]:
                status_color = "#22c55e" if s.status == SignalStatus.TP_HIT else "#ef4444"
                status_label = "✓ TP Hit" if s.status == SignalStatus.TP_HIT else "✗ SL Hit"
                pnl_str = f"+{s.pnl_pips}" if (s.pnl_pips or 0) > 0 else str(s.pnl_pips or 0)
                rows += f"""
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #222;color:#888">{s.created_at.strftime("%b %d")}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #222;color:#fff;font-weight:600">{s.pair}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #222;color:{'#22c55e' if s.direction == 'BUY' else '#ef4444'}">{s.direction}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #222;color:{status_color}">{status_label}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #222;color:{status_color};font-weight:600">{pnl_str} pips</td>
                </tr>"""

            html = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 20px">
  <div style="text-align:center;margin-bottom:28px">
    <h1 style="font-family:Georgia,serif;color:#f5f4f0;font-size:24px;margin:0 0 6px">
      Alpha<span style="color:#c9a84c">ForexAI</span>
    </h1>
    <p style="color:#888;font-size:13px;margin:0">Weekly Performance Report</p>
  </div>

  <div style="background:#161616;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:20px">
    <div style="font-size:11px;color:#c9a84c;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px">
      Week of {(datetime.utcnow() - timedelta(days=7)).strftime("%B %d")} – {datetime.utcnow().strftime("%B %d, %Y")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      <div style="text-align:center">
        <div style="font-size:22px;font-weight:700;color:#f5f4f0">{total}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">Signals</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:22px;font-weight:700;color:#22c55e">{wins}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">TP Hits</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:22px;font-weight:700;color:#f5f4f0">{wr:.0%}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">Win Rate</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:22px;font-weight:700;color:{'#22c55e' if pnl >= 0 else '#ef4444'}">{'+' if pnl > 0 else ''}{pnl:.0f}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">Pips P&L</div>
      </div>
    </div>
  </div>

  <div style="background:#161616;border:1px solid #222;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 16px;border-bottom:1px solid #222;font-size:12px;color:#c9a84c;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Recent Signals</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#555;font-weight:500;text-transform:uppercase">Date</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#555;font-weight:500;text-transform:uppercase">Pair</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#555;font-weight:500;text-transform:uppercase">Dir</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#555;font-weight:500;text-transform:uppercase">Result</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#555;font-weight:500;text-transform:uppercase">P&L</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>

  <div style="text-align:center;margin-bottom:24px">
    <a href="https://alphaforexai.com/dashboard" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#c9a84c,#e8c97e);color:#000;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">
      View Full Dashboard →
    </a>
  </div>

  <div style="border-top:1px solid #1e1e1e;padding-top:20px;text-align:center">
    <p style="font-size:12px;color:#555;margin:0 0 8px">AlphaForexAI · <a href="https://alphaforexai.com" style="color:#c9a84c;text-decoration:none">alphaforexai.com</a></p>
    <p style="font-size:11px;color:#444;margin:0">Trading forex involves significant risk. Past performance does not guarantee future results.</p>
  </div>
</div>
</body>
</html>"""

            # Get all active users
            users_result = await db.execute(
                select(User).where(User.is_active == True)
            )
            all_users = users_result.scalars().all()

            sent = 0
            failed = 0
            for user in all_users:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = f"📊 AlphaForexAI Weekly Report — {wr:.0%} win rate, {'+' if pnl > 0 else ''}{pnl:.0f} pips"
                    msg["From"]    = f"AlphaForexAI <{settings.SMTP_USER}>"
                    msg["To"]      = user.email
                    msg.attach(MIMEText(html, "html"))

                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode    = ssl.CERT_NONE

                    async with aiosmtplib.SMTP(hostname=settings.SMTP_HOST, port=465, use_tls=True, tls_context=ctx) as smtp:
                        await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        await smtp.send_message(msg)
                    sent += 1
                except Exception as e:
                    logger.error(f"Weekly digest failed for {user.email}: {e}")
                    failed += 1

            logger.info(f"Weekly digest sent: {sent} success, {failed} failed")

    except Exception as e:
        logger.error(f"Weekly digest error: {e}")
