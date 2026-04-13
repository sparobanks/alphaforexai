"""
Backtesting engine: simulates live signal generation on historical data.
Reports per-trade P&L, equity curve, and aggregate metrics.
"""
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import Optional
from app.features.indicators import FEATURE_COLS, build_features
from app.features.labels import make_trade_labels
from app.core.config import settings
from app.core.logger import logger


@dataclass
class Trade:
    bar_index: int
    direction: str          # "BUY" | "SELL"
    entry: float
    tp: float
    sl: float
    confidence: float
    entry_time: pd.Timestamp
    exit_time: Optional[pd.Timestamp] = None
    outcome: str = "OPEN"   # "TP" | "SL" | "EXPIRED"
    pnl_pips: float = 0.0


@dataclass
class BacktestResult:
    trades: list[Trade] = field(default_factory=list)
    equity_curve: list[float] = field(default_factory=list)

    @property
    def closed(self) -> list[Trade]:
        return [t for t in self.trades if t.outcome != "OPEN"]

    @property
    def metrics(self) -> dict:
        c = self.closed
        if not c:
            return {"error": "No closed trades"}

        pnl  = [t.pnl_pips for t in c]
        wins = [p for p in pnl if p > 0]
        losses = [p for p in pnl if p <= 0]

        equity = np.cumsum(pnl)
        peak = np.maximum.accumulate(equity)
        dd = peak - equity
        max_dd = float(dd.max())

        per_trade = np.array(pnl)
        sharpe = float(per_trade.mean() / (per_trade.std() + 1e-9))

        win_rate = len(wins) / len(c)
        profit_factor = abs(sum(wins)) / (abs(sum(losses)) + 1e-9)
        expectancy = sum(pnl) / len(c)

        return {
            "total_trades":  len(c),
            "win_rate":      round(win_rate, 4),
            "expectancy":    round(expectancy, 2),
            "profit_factor": round(profit_factor, 3),
            "max_drawdown":  round(max_dd, 1),
            "total_pnl_pips": round(sum(pnl), 1),
            "sharpe":        round(sharpe, 3),
            "avg_conf":      round(np.mean([t.confidence for t in c]), 3),
        }


def run_backtest(
    df: pd.DataFrame,                   # feature + OHLCV dataframe
    predictor,                          # SignalPredictor instance
    threshold: float = None,
    tp_pips: int = None,
    sl_pips: int = None,
    horizon: int = None,
    pip_size: float = 0.0001,
    session_only: bool = True,          # trade only London/NY overlap
) -> BacktestResult:
    """
    Walk through df bar-by-bar, generate signals using predictor,
    simulate trade outcomes, return BacktestResult.
    """
    threshold = threshold or settings.SIGNAL_CONFIDENCE_THRESHOLD
    tp_pips   = tp_pips   or settings.TP_PIPS
    sl_pips   = sl_pips   or settings.SL_PIPS
    horizon   = horizon   or settings.SIGNAL_EXPIRY_BARS

    result = BacktestResult()
    equity = 0.0
    open_trade: Optional[Trade] = None

    for i, row in df.iterrows():
        if i < 100:   # need indicator warmup
            continue

        # ── Manage open trade ──────────────────────────────────────────────
        if open_trade:
            h = row["high"]
            l = row["low"]

            if open_trade.direction == "BUY":
                if h >= open_trade.tp:
                    open_trade.outcome = "TP"
                    open_trade.pnl_pips = tp_pips
                    open_trade.exit_time = row["time"]
                    equity += tp_pips
                elif l <= open_trade.sl:
                    open_trade.outcome = "SL"
                    open_trade.pnl_pips = -sl_pips
                    open_trade.exit_time = row["time"]
                    equity -= sl_pips
                elif i - open_trade.bar_index >= horizon:
                    open_trade.outcome = "EXPIRED"
                    open_trade.exit_time = row["time"]
            else:  # SELL
                if l <= open_trade.tp:
                    open_trade.outcome = "TP"
                    open_trade.pnl_pips = tp_pips
                    open_trade.exit_time = row["time"]
                    equity += tp_pips
                elif h >= open_trade.sl:
                    open_trade.outcome = "SL"
                    open_trade.pnl_pips = -sl_pips
                    open_trade.exit_time = row["time"]
                    equity -= sl_pips
                elif i - open_trade.bar_index >= horizon:
                    open_trade.outcome = "EXPIRED"
                    open_trade.exit_time = row["time"]

            if open_trade.outcome != "OPEN":
                result.equity_curve.append(equity)
                open_trade = None   # ready for next trade

            continue  # one trade at a time

        # ── Generate new signal ────────────────────────────────────────────
        if session_only and not row.get("sess_overlap", row.get("sess_london", 1)):
            continue

        try:
            proba = predictor.predict(row)
        except Exception as e:
            logger.debug(f"Predict error at bar {i}: {e}")
            continue

        entry = row["close"]

        if proba >= threshold:
            trade = Trade(
                bar_index=i,
                direction="BUY",
                entry=entry,
                tp=entry + tp_pips * pip_size,
                sl=entry - sl_pips * pip_size,
                confidence=proba,
                entry_time=row["time"],
            )
            result.trades.append(trade)
            open_trade = trade

        elif (1 - proba) >= threshold:
            trade = Trade(
                bar_index=i,
                direction="SELL",
                entry=entry,
                tp=entry - tp_pips * pip_size,
                sl=entry + sl_pips * pip_size,
                confidence=1 - proba,
                entry_time=row["time"],
            )
            result.trades.append(trade)
            open_trade = trade

    return result
