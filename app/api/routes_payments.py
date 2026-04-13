import os
import stripe
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select
from datetime import datetime, timedelta

from app.db.session import AsyncSessionLocal
from app.api.routes_auth import User, SubscriptionTier
from app.core.config import settings
from app.core.logger import logger

router = APIRouter(prefix="/payments", tags=["payments"])

PRICE_TO_TIER = {
    "price_pro_monthly":  ("pro",  30),
    "price_vip_monthly":  ("vip",  30),
    "price_pro_annual":   ("pro",  365),
    "price_vip_annual":   ("vip",  365),
    "price_1TJt9W4wcBC96UexPS4MjvS9": ("pro", 30),
    "price_1TJt9H4wcBC96UexFn3taUAi": ("vip", 30),
}


@router.post("/create-checkout")
async def create_checkout(
    price_id: str,
    user_email: str,
    success_url: str = "https://alphaforexai.com/dashboard?upgraded=1",
    cancel_url: str = "https://alphaforexai.com/pricing",
):
    secret = os.getenv("STRIPE_SECRET_KEY") or settings.STRIPE_SECRET_KEY
    if not secret:
        raise HTTPException(500, "STRIPE_SECRET_KEY not configured")

    stripe.api_key = secret

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=user_email,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return {"checkout_url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(500, str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    secret = os.getenv("STRIPE_WEBHOOK_SECRET") or getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

    if not secret or secret == "whsec_test_placeholder":
        # During testing, skip signature verification
        try:
            import json
            event = json.loads(payload)
        except Exception:
            raise HTTPException(400, "Invalid payload")
    else:
        try:
            stripe.api_key = os.getenv("STRIPE_SECRET_KEY") or settings.STRIPE_SECRET_KEY
            event = stripe.Webhook.construct_event(payload, sig_header, secret)
        except stripe.error.SignatureVerificationError:
            raise HTTPException(400, "Invalid Stripe signature")

    event_type = event["type"]
    logger.info(f"Stripe event: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        customer_email = session.get("customer_email") or session.get("customer_details", {}).get("email")
        line_items = session.get("line_items", {}).get("data", [])
        price_id = line_items[0]["price"]["id"] if line_items else None

        if customer_email and price_id:
            tier, days = PRICE_TO_TIER.get(price_id, ("pro", 30))
            await _upgrade_user(customer_email, tier, days)

    elif event_type in ("customer.subscription.deleted", "invoice.payment_failed"):
        obj = event["data"]["object"]
        customer_id = obj.get("customer")
        if customer_id:
            stripe.api_key = os.getenv("STRIPE_SECRET_KEY") or settings.STRIPE_SECRET_KEY
            email = await _get_email_from_customer(customer_id)
            if email:
                await _downgrade_user(email)

    return {"received": True}


async def _upgrade_user(email: str, tier: str, days: int):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.tier = tier
            user.tier_expires = datetime.utcnow() + timedelta(days=days)
            await db.commit()
            logger.info(f"Upgraded {email} to {tier} for {days}d")
        else:
            logger.warning(f"User not found: {email}")


async def _downgrade_user(email: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.tier = SubscriptionTier.FREE
            user.tier_expires = None
            await db.commit()
            logger.info(f"Downgraded {email} to free")


async def _get_email_from_customer(customer_id: str):
    try:
        customer = stripe.Customer.retrieve(customer_id)
        return customer.get("email")
    except Exception as e:
        logger.error(f"Stripe customer lookup failed: {e}")
        return None
