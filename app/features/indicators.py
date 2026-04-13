"""
Trend-focused feature engineering.
Key insight: forex has edge in trending regimes only.
We detect regime, trend direction, and entry timing.
"""
import pandas as pd
import numpy as np
from app.core.logger import logger


def _ema(s, p): return s.ewm(span=p, adjust=False).mean()
def _sma(s, p): return s.rolling(p).mean()

def _rsi(s, p=14):
    d = s.diff()
    u = d.clip(lower=0).rolling(p).mean()
    dn = (-d.clip(upper=0)).rolling(p).mean()
    return 100 - 100 / (1 + u / dn.replace(0, np.nan))

def _atr(h, l, c, p=14):
    tr = pd.concat([(h-l), (h-c.shift()).abs(), (l-c.shift()).abs()], axis=1).max(axis=1)
    return tr.rolling(p).mean()

def _adx(h, l, c, p=14):
    """Average Directional Index — measures trend strength"""
    up   = h.diff()
    down = -l.diff()
    plus_dm  = np.where((up > down) & (up > 0), up, 0.0)
    minus_dm = np.where((down > up) & (down > 0), down, 0.0)
    atr = _atr(h, l, c, p)
    plus_di  = 100 * pd.Series(plus_dm,  index=c.index).rolling(p).mean() / atr
    minus_di = 100 * pd.Series(minus_dm, index=c.index).rolling(p).mean() / atr
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx = dx.rolling(p).mean()
    return adx, plus_di, minus_di

def _macd(c, fast=12, slow=26, sig=9):
    m = _ema(c, fast) - _ema(c, slow)
    s = _ema(m, sig)
    return m, s, m - s

def _bbands(c, p=20, mult=2.0):
    mid = _sma(c, p)
    std = c.rolling(p).std()
    return mid + mult*std, mid, mid - mult*std

def _session_flags(time):
    h = time.dt.hour
    return pd.DataFrame({
        "sess_london":  ((h >= 7)  & (h < 16)).astype(int),
        "sess_newyork": ((h >= 12) & (h < 21)).astype(int),
        "sess_overlap": ((h >= 12) & (h < 16)).astype(int),
        "sess_asia":    ((h >= 0)  & (h < 8)).astype(int),
        "sess_dead":    ((h >= 21) | (h < 7)).astype(int),
    })


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy().sort_values("time").reset_index(drop=True)
    c, h, l, o = df["close"], df["high"], df["low"], df["open"]

    # ── Trend detection (most important)
    for p in [20, 50, 100, 200]:
        ema = _ema(c, p)
        df[f"ema_{p}"]      = ema
        df[f"dist_ema{p}"]  = (c - ema) / ema * 100  # in %

    # EMA alignment (trend strength signal)
    df["ema_20_50_diff"]  = (df["ema_20"] - df["ema_50"]) / df["ema_50"] * 100
    df["ema_50_100_diff"] = (df["ema_50"] - df["ema_100"]) / df["ema_100"] * 100
    df["ema_aligned_up"]  = ((df["ema_20"] > df["ema_50"]) &
                              (df["ema_50"] > df["ema_100"]) &
                              (df["ema_100"] > df["ema_200"])).astype(int)
    df["ema_aligned_dn"]  = ((df["ema_20"] < df["ema_50"]) &
                              (df["ema_50"] < df["ema_100"]) &
                              (df["ema_100"] < df["ema_200"])).astype(int)

    # ── ADX — regime detection (trending vs ranging)
    df["adx"], df["plus_di"], df["minus_di"] = _adx(h, l, c, 14)
    df["adx_trending"]  = (df["adx"] > 25).astype(int)
    df["adx_strong"]    = (df["adx"] > 35).astype(int)
    df["di_bull"]       = (df["plus_di"] > df["minus_di"]).astype(int)
    df["di_diff"]       = df["plus_di"] - df["minus_di"]

    # ── RSI
    df["rsi_14"]        = _rsi(c, 14)
    df["rsi_7"]         = _rsi(c, 7)
    df["rsi_21"]        = _rsi(c, 21)
    df["rsi_oversold"]  = (df["rsi_14"] < 35).astype(int)
    df["rsi_overbought"]= (df["rsi_14"] > 65).astype(int)
    df["rsi_mid_bull"]  = ((df["rsi_14"] > 45) & (df["rsi_14"] < 65)).astype(int)
    df["rsi_mid_bear"]  = ((df["rsi_14"] > 35) & (df["rsi_14"] < 55)).astype(int)
    df["rsi_slope"]     = df["rsi_14"].diff(3)

    # ── ATR / volatility
    df["atr_14"]        = _atr(h, l, c, 14)
    df["atr_norm"]      = df["atr_14"] / c * 100
    df["atr_ratio"]     = df["atr_14"] / df["atr_14"].rolling(50).mean()
    df["vol_expanding"] = (df["atr_14"] > df["atr_14"].shift(5)).astype(int)

    # ── MACD
    df["macd"], df["macd_sig"], df["macd_hist"] = _macd(c)
    df["macd_bull"]     = (df["macd_hist"] > 0).astype(int)
    df["macd_growing"]  = (df["macd_hist"] > df["macd_hist"].shift(1)).astype(int)
    df["macd_cross_up"] = ((df["macd_hist"] > 0) & (df["macd_hist"].shift(1) <= 0)).astype(int)
    df["macd_cross_dn"] = ((df["macd_hist"] < 0) & (df["macd_hist"].shift(1) >= 0)).astype(int)

    # ── Bollinger Bands
    bb_u, bb_m, bb_l   = _bbands(c)
    df["bb_pct"]        = (c - bb_l) / (bb_u - bb_l).replace(0, np.nan)
    df["bb_width"]      = (bb_u - bb_l) / bb_m * 100
    df["bb_squeeze"]    = (df["bb_width"] < df["bb_width"].rolling(50).quantile(0.2)).astype(int)
    df["bb_expansion"]  = (df["bb_width"] > df["bb_width"].rolling(50).quantile(0.8)).astype(int)

    # ── Price returns
    for p in [1, 3, 5, 10, 20]:
        df[f"ret_{p}"]  = c.pct_change(p) * 100

    # ── Momentum
    df["mom_10"]        = (c / c.shift(10) - 1) * 100
    df["mom_20"]        = (c / c.shift(20) - 1) * 100
    df["mom_slope"]     = df["mom_10"] - df["mom_10"].shift(5)

    # ── Volume
    df["vol_norm"]      = df["volume"] / df["volume"].rolling(20).mean()
    df["vol_trend"]     = (df["volume"].rolling(5).mean() >
                           df["volume"].rolling(20).mean()).astype(int)

    # ── Candle structure
    body                = (c - o).abs()
    rng                 = (h - l).replace(0, np.nan)
    df["body_pct"]      = body / rng
    df["is_bull_candle"]= (c > o).astype(int)
    df["upper_wick"]    = (h - pd.concat([o,c],axis=1).max(axis=1)) / rng
    df["lower_wick"]    = (pd.concat([o,c],axis=1).min(axis=1) - l) / rng

    # ── Session
    sess = _session_flags(df["time"])
    df   = pd.concat([df, sess], axis=1)

    # ── Higher timeframe proxies
    df["weekly_trend"]  = (c > c.rolling(120).mean()).astype(int)  # ~1 week on H1
    df["monthly_trend"] = (c > c.rolling(480).mean()).astype(int)  # ~1 month on H1

    # ── Price position
    high_20 = h.rolling(20).max()
    low_20  = l.rolling(20).min()
    df["price_pos_20"]  = (c - low_20) / (high_20 - low_20).replace(0, np.nan)
    high_50 = h.rolling(50).max()
    low_50  = l.rolling(50).min()
    df["price_pos_50"]  = (c - low_50) / (high_50 - low_50).replace(0, np.nan)

    df = df.replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
    logger.info(f"Features built: {len(df)} rows, {len(df.columns)} columns")
    return df


FEATURE_COLS = [
    # EMA trend
    "dist_ema20", "dist_ema50", "dist_ema100", "dist_ema200",
    "ema_20_50_diff", "ema_50_100_diff",
    "ema_aligned_up", "ema_aligned_dn",
    # ADX regime
    "adx", "plus_di", "minus_di",
    "adx_trending", "adx_strong",
    "di_bull", "di_diff",
    # RSI
    "rsi_14", "rsi_7", "rsi_21",
    "rsi_oversold", "rsi_overbought",
    "rsi_mid_bull", "rsi_mid_bear", "rsi_slope",
    # ATR
    "atr_norm", "atr_ratio", "vol_expanding",
    # MACD
    "macd_bull", "macd_growing",
    "macd_cross_up", "macd_cross_dn",
    # Bollinger
    "bb_pct", "bb_width", "bb_squeeze", "bb_expansion",
    # Returns
    "ret_1", "ret_3", "ret_5", "ret_10", "ret_20",
    # Momentum
    "mom_10", "mom_20", "mom_slope",
    # Volume
    "vol_norm", "vol_trend",
    # Candle
    "body_pct", "is_bull_candle", "upper_wick", "lower_wick",
    # Session
    "sess_london", "sess_newyork", "sess_overlap", "sess_asia",
    # Higher TF
    "weekly_trend", "monthly_trend",
    # Price position
    "price_pos_20", "price_pos_50",
]
