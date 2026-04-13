"""
Trend-following labels with regime filter.
Only label bars where there is a clear trend context.
"""
import pandas as pd
import numpy as np


def make_trade_labels(
    df: pd.DataFrame,
    tp_pips: int = 20,
    sl_pips: int = 10,
    horizon: int = 24,
    pip_size: float = 0.0001,
) -> pd.DataFrame:
    df = df.copy()
    closes = df["close"].values
    highs  = df["high"].values
    lows   = df["low"].values
    n      = len(df)

    tp_delta = tp_pips * pip_size
    sl_delta = sl_pips * pip_size

    label_long  = np.zeros(n, dtype=int)
    label_short = np.zeros(n, dtype=int)

    for i in range(n - horizon):
        entry = closes[i]

        # Long
        for j in range(i + 1, min(i + horizon + 1, n)):
            if highs[j] >= entry + tp_delta:
                label_long[i] = 1
                break
            elif lows[j] <= entry - sl_delta:
                break

        # Short
        for j in range(i + 1, min(i + horizon + 1, n)):
            if lows[j] <= entry - tp_delta:
                label_short[i] = 1
                break
            elif highs[j] >= entry + sl_delta:
                break

    df["label_long"]  = label_long
    df["label_short"] = label_short
    df["label"]       = np.where(label_long == 1, 1,
                         np.where(label_short == 1, -1, 0))
    df["label_binary"] = label_long
    return df
