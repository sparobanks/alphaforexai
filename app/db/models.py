from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, Text, Enum, ForeignKey, Index
)
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


class Base(DeclarativeBase):
    pass


class SignalDirection(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class SignalStatus(str, enum.Enum):
    OPEN = "OPEN"
    TP_HIT = "TP_HIT"
    SL_HIT = "SL_HIT"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class Candle(Base):
    __tablename__ = "candles"

    id = Column(Integer, primary_key=True)
    pair = Column(String(10), nullable=False)
    timeframe = Column(String(5), nullable=False)
    time = Column(DateTime(timezone=True), nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)

    __table_args__ = (
        Index("ix_candles_pair_tf_time", "pair", "timeframe", "time", unique=True),
    )


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True)
    pair = Column(String(10), nullable=False)
    timeframe = Column(String(5), nullable=False)
    direction = Column(Enum(SignalDirection), nullable=False)
    status = Column(Enum(SignalStatus), default=SignalStatus.OPEN)

    entry_price = Column(Float, nullable=False)
    sl_price = Column(Float, nullable=False)
    tp_price = Column(Float, nullable=False)
    risk_pct = Column(Float, nullable=False)
    rr_ratio = Column(Float)               # reward/risk

    confidence = Column(Float, nullable=False)  # model probability 0–1
    reason = Column(Text)                       # human-readable explanation

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))

    pnl_pips = Column(Float)               # filled when closed
    published_telegram = Column(Boolean, default=False)
    published_email = Column(Boolean, default=False)

    __table_args__ = (
        Index("ix_signals_pair_status", "pair", "status"),
        Index("ix_signals_created_at", "created_at"),
    )


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True)
    pair = Column(String(10), nullable=False)
    timeframe = Column(String(5), nullable=False)
    trained_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    train_start = Column(DateTime(timezone=True))
    train_end = Column(DateTime(timezone=True))

    # Walk-forward test metrics
    win_rate = Column(Float)
    expectancy = Column(Float)         # avg win*win% - avg loss*loss%
    total_trades = Column(Integer)
    max_drawdown = Column(Float)
    sharpe = Column(Float)
    profit_factor = Column(Float)

    model_path = Column(String(255))
    is_active = Column(Boolean, default=False)
    notes = Column(Text)


class Performance(Base):
    __tablename__ = "performance"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime(timezone=True), nullable=False)
    pair = Column(String(10), nullable=False)
    signals_issued = Column(Integer, default=0)
    tp_count = Column(Integer, default=0)
    sl_count = Column(Integer, default=0)
    expired_count = Column(Integer, default=0)
    pnl_pips = Column(Float, default=0.0)
    win_rate = Column(Float)

    __table_args__ = (
        Index("ix_performance_date_pair", "date", "pair", unique=True),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name  = Column(String(255))
    phone      = Column(String(50))
    country    = Column(String(100))
    city       = Column(String(100))
    date_of_birth = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id         = Column(Integer, primary_key=True)
    key        = Column(String(100), unique=True, nullable=False)
    value      = Column(String(5000))
    updated_at = Column(DateTime, default=datetime.utcnow)
