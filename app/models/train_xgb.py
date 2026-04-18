"""
XGBoost model trainer with walk-forward validation.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from xgboost import XGBClassifier
from sklearn.metrics import roc_auc_score
from app.features.indicators import FEATURE_COLS
from app.core.config import settings
from app.core.logger import logger


def compute_trading_metrics(y_true, y_pred_proba, threshold=0.55, tp_pips=None, sl_pips=None):
    tp_pips = tp_pips or settings.TP_PIPS
    sl_pips = sl_pips or settings.SL_PIPS
    y_pred = (y_pred_proba >= threshold).astype(int)
    mask = y_pred == 1
    if mask.sum() == 0:
        return {"error": "No signals generated at this threshold"}

    win_rate   = float(y_true[mask].mean())
    n_trades   = int(mask.sum())
    wins       = int(y_true[mask].sum())
    losses     = n_trades - wins
    expectancy = win_rate * tp_pips - (1 - win_rate) * sl_pips
    profit_factor = (wins * tp_pips) / max(losses * sl_pips, 1)

    pnl = np.where(y_true[mask] == 1, tp_pips, -sl_pips).cumsum()
    peak = np.maximum.accumulate(pnl)
    max_dd = float((peak - pnl).max())

    per_trade = np.where(y_true[mask] == 1, tp_pips, -sl_pips)
    sharpe = float(per_trade.mean() / (per_trade.std() + 1e-9))

    try:
        auc = float(roc_auc_score(y_true, y_pred_proba))
    except Exception:
        auc = float("nan")

    return {
        "n_trades":      n_trades,
        "win_rate":      round(win_rate, 4),
        "expectancy":    round(expectancy, 2),
        "profit_factor": round(profit_factor, 3),
        "max_drawdown":  round(max_dd, 1),
        "sharpe":        round(sharpe, 3),
        "auc":           round(auc, 4),
    }


def walk_forward_validate(df, n_splits=5, train_pct=0.60, threshold=None):
    threshold = threshold or settings.SIGNAL_CONFIDENCE_THRESHOLD
    results = []
    chunk = len(df) // n_splits

    for i in range(n_splits):
        fold_start = i * chunk
        fold_end   = fold_start + chunk if i < n_splits - 1 else len(df)
        fold_df    = df.iloc[fold_start:fold_end].copy()

        split_at = int(len(fold_df) * train_pct)
        train    = fold_df.iloc[:split_at]
        test     = fold_df.iloc[split_at:]

        if len(train) < 200 or len(test) < 50:
            continue

        train = train[train["label_binary"].notna()].copy()
        test  = test[test["label_binary"].notna()].copy()
        train["label_binary"] = train["label_binary"].astype(int)
        test["label_binary"]  = test["label_binary"].astype(int)
        X_train = train[FEATURE_COLS].values.astype(float)
        y_train = train["label_binary"].values.astype(int)
        X_test  = test[FEATURE_COLS].values.astype(float)
        y_test  = test["label_binary"].values.astype(int)

        model = _build_model()
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

        proba   = model.predict_proba(X_test)[:, 1]
        metrics = compute_trading_metrics(y_test, proba, threshold)
        metrics["fold"] = i + 1
        results.append(metrics)
        logger.info(f"Fold {i+1}: {metrics}")

    return results


def _build_model():
    return XGBClassifier(
        n_estimators=500,
        max_depth=3,
        learning_rate=0.02,
        subsample=0.75,
        colsample_bytree=0.75,
        min_child_weight=30,
        scale_pos_weight=1.0,  # Labels are balanced 50/50
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        eval_metric="aucpr",
        early_stopping_rounds=50,
        random_state=42,
        n_jobs=-1,
    )


def train(df, pair="EUR_USD", timeframe="H1", save_dir=None):
    save_dir = save_dir or settings.MODEL_DIR
    os.makedirs(save_dir, exist_ok=True)

    df = df.copy().sort_values("time").reset_index(drop=True)

    wf_results = walk_forward_validate(df)
    valid = [r for r in wf_results if "error" not in r]

    if valid:
        avg_metrics = {
            k: round(np.mean([r[k] for r in valid if k in r]), 4)
            for k in ["win_rate", "expectancy", "profit_factor", "max_drawdown", "sharpe"]
        }
    else:
        avg_metrics = {"win_rate": float("nan"), "expectancy": float("nan"),
                       "profit_factor": float("nan"), "max_drawdown": float("nan"), "sharpe": float("nan")}

    logger.info(f"Walk-forward avg: {avg_metrics}")

    split   = int(len(df) * 0.8)
    train_df = df.iloc[:split]
    val_df   = df.iloc[split:]

    X_train = train_df[FEATURE_COLS].values
    y_train = train_df["label_binary"].values
    X_val   = val_df[FEATURE_COLS].values
    y_val   = val_df["label_binary"].values

    model = _build_model()
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=50)

    importance    = dict(zip(FEATURE_COLS, model.feature_importances_.tolist()))
    top_features  = sorted(importance.items(), key=lambda x: -x[1])[:10]
    logger.info(f"Top features: {top_features}")

    timestamp  = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    model_path = os.path.join(save_dir, f"{pair}_{timeframe}_{timestamp}.joblib")
    meta_path  = model_path.replace(".joblib", "_meta.json")

    joblib.dump({"model": model, "features": FEATURE_COLS}, model_path)

    meta = {
        "pair": pair,
        "timeframe": timeframe,
        "trained_at": datetime.utcnow().isoformat(),
        "train_rows": len(df),
        "model_path": model_path,
        "walk_forward": wf_results,
        "avg_metrics": avg_metrics,
        "top_features": top_features,
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    logger.info(f"Model saved: {model_path}")
    return meta


class SignalPredictor:
    def __init__(self, model_path):
        bundle = joblib.load(model_path)
        self.model    = bundle["model"]
        self.features = bundle["features"]

    def predict(self, feature_row):
        X = feature_row[self.features].values.reshape(1, -1)
        return float(self.model.predict_proba(X)[0, 1])

    def predict_both(self, feature_row):
        long_proba = self.predict(feature_row)
        return {"long_proba": round(long_proba, 4), "short_proba": round(1 - long_proba, 4)}
