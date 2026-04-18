#!/usr/bin/env python3
"""
Train with session filtering — only London/NY overlap bars.
"""
import sys, os, argparse
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.data.ingest_oanda import fetch_history
from app.features.indicators import build_features
from app.features.labels import make_trade_labels
from app.models.train_xgb import train
from app.core.config import settings
from app.core.logger import logger


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pair",      default="EUR_USD")
    parser.add_argument("--timeframe", default="H1")
    parser.add_argument("--years",     type=int, default=3)
    parser.add_argument("--csv",       default=None)
    args = parser.parse_args()

    logger.info(f"Starting training: {args.pair} {args.timeframe} ({args.years}yr)")

    if args.csv:
        import pandas as pd
        df_raw = pd.read_csv(args.csv, parse_dates=["time"])
    else:
        df_raw = fetch_history(args.pair, args.timeframe, years=args.years)

    if df_raw.empty:
        logger.error("No data fetched")
        sys.exit(1)

    df = build_features(df_raw)
    logger.info(f"After feature engineering: {len(df)} rows")

    # KEY: Only train on active session bars
    # This removes weekend gaps, dead hours, and holiday noise
    active = (
        (df["sess_london"] == 1) |
        (df["sess_newyork"] == 1)
    )
    df_filtered = df[active].copy().reset_index(drop=True)
    logger.info(f"After session filter: {len(df_filtered)} rows ({len(df_filtered)/len(df)*100:.0f}% of data)")

    df_filtered = make_trade_labels(
        df_filtered,
        pair=args.pair,
        tp_pips=settings.TP_PIPS,
        sl_pips=settings.SL_PIPS,
        horizon=settings.SIGNAL_EXPIRY_BARS,
    )

    df_filtered = df_filtered[df_filtered["label_binary"].notna()].copy()
    df_filtered["label_binary"] = df_filtered["label_binary"].astype(int)
    label_dist = df_filtered["label_binary"].value_counts(normalize=True)
    logger.info(f"Label distribution:\n{label_dist}")

    meta = train(df_filtered, pair=args.pair, timeframe=args.timeframe)

    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info(f"Model: {meta['model_path']}")
    for k, v in meta["avg_metrics"].items():
        logger.info(f"  {k}: {v}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
