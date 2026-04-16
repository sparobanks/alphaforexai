"""
Signal rules engine: wraps model output in real-world trading filters.
A high model probability is NOT a signal until it passes all these checks.
"""
import pandas as pd
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.logger import logger
from app.db.models import SignalDirection


# ── Filters ───────────────────────────────────────────────────────────────────

def is_active_session(dt: datetime) -> bool:
    """Only trade London and New York sessions (UTC)."""
    h = dt.hour
    return (7 <= h < 16) or (12 <= h < 21)  # London or NY


def is_news_window(dt: datetime, news_times: list[datetime] = None, buffer_mins: int = 30) -> bool:
    """
    Returns True if we're within buffer_mins of a high-impact news event.
    Pass in list of news event datetimes from your calendar.
    """
    if not news_times:
        return False
    for nt in news_times:
        if abs((dt - nt).total_seconds()) < buffer_mins * 60:
            return True
    return False


def spread_ok(current_spread_pips: float, max_spread: float = 2.0) -> bool:
    return current_spread_pips <= max_spread


def trend_aligned(row: pd.Series, direction: str) -> bool:
    """Require ADX trending AND EMA alignment."""
    adx = float(row.get("adx", 0))
    if adx < 20:
        return False
    if direction == "BUY":
        return bool(row.get("ema_aligned_up", row.get("trend_up", 1)))
    else:
        return bool(row.get("ema_aligned_dn", row.get("trend_down", 1)))


# ── Risk calculations ─────────────────────────────────────────────────────────

def compute_sl_tp(
    entry: float,
    direction: str,
    atr: float,
    tp_pips: int = None,
    sl_pips: int = None,
    pip_size: float = 0.0001,
    use_atr: bool = False,
) -> tuple[float, float]:
    """
    Returns (sl_price, tp_price).
    Option to use ATR-based SL/TP instead of fixed pips.
    """
    tp_pips = tp_pips or settings.TP_PIPS
    sl_pips = sl_pips or settings.SL_PIPS

    if use_atr:
        sl_delta = atr * 1.5
        tp_delta = atr * 2.0
    else:
        sl_delta = sl_pips * pip_size
        tp_delta = tp_pips * pip_size

    if direction == "BUY":
        # Round to correct decimal places based on pip size
        decimals = 2 if pip_size >= 0.1 else (3 if pip_size >= 0.01 else 5)
        sl = round(entry - sl_delta, decimals)
        tp = round(entry + tp_delta, decimals)
    else:
        decimals = 2 if pip_size >= 0.1 else (3 if pip_size >= 0.01 else 5)
        sl = round(entry + sl_delta, decimals)
        tp = round(entry - tp_delta, decimals)

    return sl, tp


def position_size_units(account_balance: float, risk_pct: float, sl_pips: float, pip_value: float = 10.0) -> float:
    """
    Standard forex position sizing.
    pip_value: value of 1 pip per standard lot (EUR/USD ≈ $10)
    Returns units (1 standard lot = 100,000 units).
    """
    risk_amount = account_balance * (risk_pct / 100)
    lots = risk_amount / (sl_pips * pip_value)
    return round(lots, 2)


# ── Signal generator ──────────────────────────────────────────────────────────

def generate_signal(
    row: pd.Series,
    predictor,
    current_dt: datetime = None,
    news_times: list[datetime] = None,
    current_spread_pips: float = 0.5,
    pair: str = "EUR_USD",
) -> dict | None:
    """
    Full signal pipeline for a single bar.
    Returns signal dict or None if filters reject.
    """
    current_dt = current_dt or datetime.utcnow()

    # ── Filters
    if not is_active_session(current_dt):
        logger.debug("Rejected: outside active session")
        return None

    if is_news_window(current_dt, news_times):
        logger.debug("Rejected: near news event")
        return None

    if not spread_ok(current_spread_pips):
        logger.debug(f"Rejected: spread too wide ({current_spread_pips} pips)")
        return None

    # ── Model prediction
    try:
        proba = predictor.predict(row)
    except Exception as e:
        logger.error(f"Predictor failed: {e}")
        return None

    threshold = settings.SIGNAL_CONFIDENCE_THRESHOLD

    if proba >= threshold:
        direction = "BUY"
        confidence = proba
    elif (1 - proba) >= threshold:
        direction = "SELL"
        confidence = 1 - proba
    else:
        return None   # no signal

    # ── Trend filter
    if not trend_aligned(row, direction):
        logger.debug(f"Rejected: trend not aligned for {direction}")
        return None

    # ── Risk layer
    entry = float(row["close"])
    atr   = float(row.get("atr_14", 0.0010))

    # Determine pip size from pair
    pair_upper = pair.upper()
    if "XAU" in pair_upper:
        pip_size = 0.1
    elif "JPY" in pair_upper:
        pip_size = 0.01
    else:
        pip_size = 0.0001

    sl, tp = compute_sl_tp(entry, direction, atr, pip_size=pip_size)

    rr = abs(tp - entry) / max(abs(sl - entry), 1e-9)
    if rr < 1.5:
        logger.debug(f"Rejected: R:R too low ({rr:.2f})")
        return None

    # ── Build reason text
    rsi = float(row.get("rsi_14", 50))
    trend = "uptrend" if row.get("trend_up", 0) else "downtrend"
    session_name = _session_name(current_dt)
    reason = (
        f"{direction} signal in {session_name} session. "
        f"Price in {trend}. RSI {rsi:.0f}. "
        f"Confidence {confidence:.0%}. R:R {rr:.1f}:1."
    )

    return {
        "pair":       settings.ACTIVE_PAIRS[0],
        "timeframe":  settings.ACTIVE_TIMEFRAME,
        "direction":  direction,
        "entry":      entry,
        "sl":         sl,
        "tp":         tp,
        "rr_ratio":   round(rr, 2),
        "confidence": round(confidence, 4),
        "risk_pct":   settings.DEFAULT_RISK_PCT,
        "reason":     reason,
        "expires_at": current_dt + timedelta(hours=12),
    }


def _session_name(dt: datetime) -> str:
    h = dt.hour
    if 12 <= h < 16:
        return "London/NY overlap"
    if 7 <= h < 16:
        return "London"
    if 12 <= h < 21:
        return "New York"
    return "off-hours"
