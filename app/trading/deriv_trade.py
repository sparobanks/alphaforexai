"""
Deriv auto-trading module.
Uses Deriv WebSocket API to place trades.
Supports: forex, synthetics, and other instruments.
"""
import json
import asyncio
import websockets
from app.core.logger import logger

DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3?app_id={app_id}"

PAIR_MAP = {
    "EUR/USD": "frxEURUSD",
    "GBP/USD": "frxGBPUSD",
    "USD/JPY": "frxUSDJPY",
    "XAU/USD": "frxXAUUSD",
}


async def deriv_request(app_id: str, api_token: str, payload: dict) -> dict:
    """Send a single request to Deriv WebSocket API."""
    url = DERIV_WS_URL.format(app_id=app_id)
    try:
        async with websockets.connect(url, ping_interval=None) as ws:
            # Authorize first
            auth_req = {"authorize": api_token}
            await ws.send(json.dumps(auth_req))
            auth_res = json.loads(await ws.recv())

            if auth_res.get("error"):
                return {"ok": False, "error": auth_res["error"]["message"]}

            # Send actual request
            await ws.send(json.dumps(payload))
            response = json.loads(await ws.recv())

            if response.get("error"):
                return {"ok": False, "error": response["error"]["message"]}

            return {"ok": True, "data": response}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def get_deriv_balance(app_id: str, api_token: str) -> dict:
    """Get account balance."""
    result = await deriv_request(app_id, api_token, {"balance": 1, "account": "current"})
    if result["ok"]:
        balance = result["data"].get("balance", {})
        return {
            "ok": True,
            "balance": float(balance.get("balance", 0)),
            "currency": balance.get("currency", "USD"),
        }
    return result


async def place_deriv_trade(
    app_id: str,
    api_token: str,
    symbol: str,
    direction: str,
    amount: float,
    duration: int = 5,
    duration_unit: str = "h",
) -> dict:
    """
    Place a trade on Deriv.
    direction: BUY or SELL
    duration: how long the contract runs
    duration_unit: t=ticks, s=seconds, m=minutes, h=hours, d=days
    """
    contract_type = "CALL" if direction == "BUY" else "PUT"

    payload = {
        "buy": 1,
        "price": amount,
        "parameters": {
            "contract_type": contract_type,
            "symbol": symbol,
            "duration": duration,
            "duration_unit": duration_unit,
            "basis": "stake",
            "currency": "USD",
        }
    }

    result = await deriv_request(app_id, api_token, payload)
    if result["ok"]:
        buy_data = result["data"].get("buy", {})
        return {
            "ok": True,
            "contract_id": buy_data.get("contract_id"),
            "buy_price":   float(buy_data.get("buy_price", 0)),
            "symbol":      symbol,
            "direction":   direction,
        }
    return result


async def test_deriv_connection(app_id: str, api_token: str) -> dict:
    """Test Deriv connection and return account info."""
    result = await deriv_request(app_id, api_token, {"get_account_status": 1})
    if result["ok"]:
        balance = await get_deriv_balance(app_id, api_token)
        return {
            "ok": True,
            "balance":  balance.get("balance", 0),
            "currency": balance.get("currency", "USD"),
            "mode":     "live",
        }
    return result


async def execute_deriv_signal(user, signal: dict) -> dict:
    """Execute a signal on Deriv for a user."""
    app_id    = getattr(user, "deriv_app_id", None)
    api_token = getattr(user, "deriv_api_token", None)

    if not app_id or not api_token:
        return {"ok": False, "error": "No Deriv credentials"}

    symbol = PAIR_MAP.get(signal.get("pair", ""), "")
    if not symbol:
        return {"ok": False, "error": f"Unsupported pair: {signal.get('pair')}"}

    direction = signal.get("direction", "BUY")
    risk_pct  = getattr(user, "auto_trade_risk_pct", 1.0) or 1.0

    # Get balance to calculate stake
    balance_data = await get_deriv_balance(app_id, api_token)
    if not balance_data["ok"]:
        return balance_data

    balance = balance_data["balance"]
    stake   = round(balance * (risk_pct / 100), 2)
    stake   = max(1.0, min(stake, 1000.0))  # min $1, max $1000

    result = await place_deriv_trade(
        app_id    = app_id,
        api_token = api_token,
        symbol    = symbol,
        direction = direction,
        amount    = stake,
        duration  = 5,
        duration_unit = "h",
    )

    logger.info(f"Deriv trade {user.email} ({signal['pair']} {direction} ${stake}): {result}")
    return result
