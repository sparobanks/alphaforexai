#!/usr/bin/env python3
"""
scripts/backtest.py — Run a full backtest on saved model vs historical data.
Prints a detailed report and saves an equity curve image.

Usage:
    python scripts/backtest.py
    python scripts/backtest.py --pair EUR_USD --days 365 --threshold 0.65
"""
import sys, os, argparse
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import numpy as np

from app.data.ingest_oanda     import fetch_history
from app.features.indicators   import build_features
from app.features.labels       import make_trade_labels
from app.models.train_xgb      import SignalPredictor
from app.backtest.engine        import run_backtest
from app.core.config            import settings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pair",      default="EUR_USD")
    parser.add_argument("--days",      type=int,   default=365)
    parser.add_argument("--threshold", type=float, default=settings.SIGNAL_CONFIDENCE_THRESHOLD)
    parser.add_argument("--tp",        type=int,   default=settings.TP_PIPS)
    parser.add_argument("--sl",        type=int,   default=settings.SL_PIPS)
    parser.add_argument("--model",     default=None, help="Path to .joblib model (optional)")
    args = parser.parse_args()

    # ── Load model ──────────────────────────────────────────────────────────
    model_path = args.model
    if not model_path:
        model_dir = settings.MODEL_DIR
        if not os.path.exists(model_dir):
            print("ERROR: No model found. Run scripts/train.py first.")
            sys.exit(1)
        files = sorted([f for f in os.listdir(model_dir) if f.endswith(".joblib")])
        if not files:
            print("ERROR: No .joblib file in", model_dir)
            sys.exit(1)
        model_path = os.path.join(model_dir, files[-1])

    print(f"Loading model: {model_path}")
    predictor = SignalPredictor(model_path)

    # ── Load data ────────────────────────────────────────────────────────────
    print(f"Fetching {args.days} days of {args.pair} data...")
    from datetime import datetime, timedelta
    from app.data.ingest_oanda import fetch_candles
    df_raw = fetch_history(args.pair, settings.ACTIVE_TIMEFRAME, years=max(1, args.days // 365 + 1))
    cutoff = pd.Timestamp.utcnow().tz_localize(None) - pd.Timedelta(days=args.days)
    df_raw = df_raw[df_raw["time"] >= cutoff]

    print(f"Building features on {len(df_raw)} candles...")
    df = build_features(df_raw)

    # ── Run backtest ─────────────────────────────────────────────────────────
    print(f"Running backtest (threshold={args.threshold}, TP={args.tp}, SL={args.sl})...")
    result = run_backtest(
        df, predictor,
        threshold=args.threshold,
        tp_pips=args.tp,
        sl_pips=args.sl,
        session_only=True,
    )

    m = result.metrics
    if "error" in m:
        print("No trades generated. Try lowering --threshold.")
        return

    # ── Print report ─────────────────────────────────────────────────────────
    print("\n" + "=" * 52)
    print(f"  BACKTEST REPORT — {args.pair} {settings.ACTIVE_TIMEFRAME}")
    print(f"  Period: last {args.days} days  |  Threshold: {args.threshold:.0%}")
    print("=" * 52)
    print(f"  Total trades      : {m['total_trades']}")
    print(f"  Win rate          : {m['win_rate']:.1%}")
    print(f"  Expectancy        : {m['expectancy']:+.1f} pips/trade")
    print(f"  Profit factor     : {m['profit_factor']:.2f}x")
    print(f"  Total P&L         : {m['total_pnl_pips']:+.0f} pips")
    print(f"  Max drawdown      : {m['max_drawdown']:.0f} pips")
    print(f"  Sharpe (per trade): {m['sharpe']:.3f}")
    print(f"  Avg confidence    : {m['avg_conf']:.0%}")
    print("=" * 52)

    # Outcome breakdown
    from collections import Counter
    outcomes = Counter(t.outcome for t in result.closed)
    print(f"\n  Outcomes: TP={outcomes['TP']}  SL={outcomes['SL']}  Expired={outcomes['EXPIRED']}")

    # Verdict
    print("\n  VERDICT: ", end="")
    if m["expectancy"] > 8 and m["win_rate"] > 0.52 and m["profit_factor"] > 1.3:
        print("🟢 STRONG — ready to go live")
    elif m["expectancy"] > 3 and m["win_rate"] > 0.48:
        print("🟡 MARGINAL — worth testing on demo first")
    else:
        print("🔴 WEAK — do not trade live. Retrain or adjust parameters.")

    # ── Equity curve plot ────────────────────────────────────────────────────
    if result.equity_curve:
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 7), gridspec_kw={"height_ratios": [3, 1]})
        fig.suptitle(f"Backtest — {args.pair} {settings.ACTIVE_TIMEFRAME} ({args.days}d)", fontweight="bold")

        equity = result.equity_curve
        peak = np.maximum.accumulate(equity)
        drawdown = np.array(peak) - np.array(equity)

        ax1.plot(equity, color="#2563eb", linewidth=1.5, label="Equity (pips)")
        ax1.fill_between(range(len(equity)), equity, alpha=0.1, color="#2563eb")
        ax1.axhline(0, color="#9ca3af", linewidth=0.5, linestyle="--")
        ax1.set_ylabel("Cumulative P&L (pips)")
        ax1.legend(loc="upper left")
        ax1.grid(alpha=0.3)

        ax2.fill_between(range(len(drawdown)), -drawdown, 0, color="#ef4444", alpha=0.6, label="Drawdown")
        ax2.set_ylabel("Drawdown (pips)")
        ax2.set_xlabel("Trade #")
        ax2.legend(loc="lower left")
        ax2.grid(alpha=0.3)

        plt.tight_layout()
        out_path = f"backtest_{args.pair}_{args.days}d.png"
        plt.savefig(out_path, dpi=150, bbox_inches="tight")
        print(f"\n  Equity curve saved: {out_path}")
        plt.close()


if __name__ == "__main__":
    main()
