"""
Auto-trading module - executes signals on connected OANDA accounts.
Supports Admin and VIP users only.
"""
import httpx
from datetime import datetime
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.api.routes_auth import User, SubscriptionTier
from app.core.logger import logger


# OANDA pair mapping
PAIR_MAP = {
    "EUR/USD": "EUR_USD",
    "USD/JPY": "USD_JPY",
    "GBP/USD": "GBP_USD",
    "USD/CHF": "USD_CHF",
    "AUD/USD": "AUD_USD",
    "USD/CAD": "USD_CAD",
    "NZD/USD": "NZD_USD",
}

PIP_SIZES = {
    "EUR_USD": 0.0001,
    "USD_JPY": 0.01,
    "GBP_USD": 0.0001,
    "USD_CHF": 0.0001,
    "AUD_USD": 0.0001,
    "USD_CAD": 0.0001,
    "NZD_USD": 0.0001,
}


async def get_auto_trade_users():
    """Get all VIP users with auto-trading enabled."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                User.tier == SubscriptionTier.VIP,
                User.is_active == True,
                User.auto_trade_enabled == True,
            )
        )
        return result.scalars().all()


async def place_oanda_order(
    account_id: str,
    api_key: str,
    instrument: str,
    units: int,
    sl_price: float,
    tp_price: float,
    is_live: bool = False,
) -> dict:
    """Place a market order on OANDA with SL and TP."""
    base_url = "https://api-fxtrade.oanda.com" if is_live else "https://api-fxpractice.oanda.com"
    url = f"{base_url}/v3/accounts/{account_id}/orders"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "order": {
            "type": "MARKET",
            "instrument": instrument,
            "units": str(units),
            "stopLossOnFill": {
                "price": str(round(sl_price, 5)),
                "timeInForce": "GTC",
            },
            "takeProfitOnFill": {
                "price": str(round(tp_price, 5)),
                "timeInForce": "GTC",
            },
            "timeInForce": "FOK",
        }
    }

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(url, json=body, headers=headers)
        data = res.json()
        if res.status_code in (200, 201) and "orderFillTransaction" in data:
            fill = data["orderFillTransaction"]
            return {
                "ok":           True,
                "trade_id":     fill.get("tradeOpened", {}).get("tradeID"),
                "fill_price":   float(fill.get("price", 0)),
                "units":        units,
                "instrument":   instrument,
            }
        else:
            return {"ok": False, "error": data.get("errorMessage", str(data))}


async def calculate_units(
    account_id: str,
    api_key: str,
    instrument: str,
    risk_pct: float,
    sl_pips: float,
    is_live: bool = False,
) -> int:
    """Calculate position size based on account balance and risk %."""
    try:
        base_url = "https://api-fxtrade.oanda.com" if is_live else "https://api-fxpractice.oanda.com"
        url = f"{base_url}/v3/accounts/{account_id}/summary"
        headers = {"Authorization": f"Bearer {api_key}"}

        async with httpx.AsyncClient(timeout=10) as client:
            res  = await client.get(url, headers=headers)
            data = res.json()
            balance = float(data["account"]["balance"])

        risk_amount = balance * (risk_pct / 100)
        pip_size    = PIP_SIZES.get(instrument, 0.0001)
        pip_value   = pip_size * 1  # approx for USD pairs
        units       = int(risk_amount / (sl_pips * pip_value))
        units       = max(1000, min(units, 100000))  # between 1k and 100k
        return units
    except Exception as e:
        logger.error(f"Unit calc error: {e}")
        return 1000  # default fallback


async def execute_signal_for_user(user: User, signal: dict) -> dict:
    """Execute a signal trade for a specific user."""
    if not user.oanda_account_id or not user.oanda_api_key:
        return {"ok": False, "error": "No OANDA credentials"}

    instrument = PAIR_MAP.get(signal.get("pair", ""), "")
    if not instrument:
        return {"ok": False, "error": f"Unknown pair: {signal.get('pair')}"}

    direction  = signal.get("direction", "BUY")
    entry      = signal.get("entry")
    sl_price   = signal.get("sl")
    tp_price   = signal.get("tp")
    risk_pct   = getattr(user, "auto_trade_risk_pct", 1.0) or 1.0
    is_live    = getattr(user, "oanda_is_live", False) or False

    if not all([entry, sl_price, tp_price]):
        return {"ok": False, "error": "Missing entry/SL/TP"}

    sl_pips = abs(entry - sl_price) / PIP_SIZES.get(instrument, 0.0001)

    units = await calculate_units(
        user.oanda_account_id, user.oanda_api_key,
        instrument, risk_pct, sl_pips, is_live
    )

    if direction == "SELL":
        units = -units

    result = await place_oanda_order(
        account_id  = user.oanda_account_id,
        api_key     = user.oanda_api_key,
        instrument  = instrument,
        units       = units,
        sl_price    = sl_price,
        tp_price    = tp_price,
        is_live     = is_live,
    )

    logger.info(f"Auto-trade for {user.email} ({signal['pair']} {direction}): {result}")
    return result


async def run_auto_trading(signal: dict):
    """Run auto-trading for all eligible users when a signal fires."""
    try:
        users = await get_auto_trade_users()
        if not users:
            return

        logger.info(f"Auto-trading signal for {len(users)} VIP users: {signal.get('pair')} {signal.get('direction')}")

        for user in users:
            try:
                result = await execute_signal_for_user(user, signal)
                if result.get("ok"):
                    logger.info(f"✓ Auto-trade placed for {user.email}: trade_id={result.get('trade_id')}")
                else:
                    logger.warning(f"✗ Auto-trade failed for {user.email}: {result.get('error')}")
            except Exception as e:
                logger.error(f"Auto-trade error for {user.email}: {e}")

    except Exception as e:
        logger.error(f"Auto-trading run error: {e}")
