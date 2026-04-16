from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.db.models import Signal, SignalStatus, Performance
from app.api.routes_auth import get_current_user, User, SubscriptionTier
from app.core.logger import logger

router = APIRouter(prefix="/signals", tags=["signals"])


class SignalOut(BaseModel):
    id: int
    pair: str
    timeframe: str
    direction: str
    status: str
    entry_price: Optional[float] = None
    sl_price: Optional[float] = None
    tp_price: Optional[float] = None
    rr_ratio: Optional[float] = None
    confidence: Optional[float] = None
    reason: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    pnl_pips: Optional[float] = None
    # Tier info
    is_delayed: bool = False
    requires_upgrade: bool = False

    class Config:
        from_attributes = True


class PerformanceOut(BaseModel):
    date: datetime
    pair: str
    signals_issued: int
    tp_count: int
    sl_count: int
    pnl_pips: float
    win_rate: Optional[float]

    class Config:
        from_attributes = True


def _apply_tier(signal: Signal, user: User) -> dict:
    """
    FREE  + EUR/USD:    direction + entry, SL/TP blurred, delayed 1hr
    FREE  + multi-pair: direction only, entry+SL/TP blurred
    PRO   + EUR/USD:    full (direction + entry + SL + TP)
    PRO   + multi-pair: direction + entry, SL/TP blurred
    VIP   + any:        full (direction + entry + SL + TP)
    """
    is_free = user.tier == SubscriptionTier.FREE
    is_pro  = user.tier == SubscriptionTier.PRO
    is_vip  = user.tier == SubscriptionTier.VIP

    now     = datetime.utcnow()
    created = signal.created_at.replace(tzinfo=None) if signal.created_at.tzinfo else signal.created_at
    age_hrs = (now - created).total_seconds() / 3600

    is_eur   = "EUR" in (signal.pair or "")
    is_multi = not is_eur

    # Free EUR/USD: delayed 1hr
    is_delayed = is_free and is_eur and age_hrs < 1.0

    # What to show per tier
    if is_vip:
        show_entry = True
        show_sl_tp = True
        hidden     = False
    elif is_pro:
        show_entry = True        # Pro sees entry on ALL pairs
        show_sl_tp = is_eur      # Pro sees SL/TP only on EUR/USD
        hidden     = False
    else:
        # Free
        hidden     = is_eur and is_delayed   # Hide everything during delay
        show_entry = is_eur and not hidden   # Entry on EUR/USD after delay
        show_sl_tp = False                   # Never for free

    return {
        "id":          signal.id,
        "pair":        signal.pair,
        "timeframe":   signal.timeframe,
        "status":      signal.status,
        "created_at":  signal.created_at,
        "expires_at":  signal.expires_at,
        "closed_at":   signal.closed_at,
        "is_delayed":  is_delayed,
        "is_multi":    is_multi,
        "hidden":      hidden,
        "needs_pro":   is_free and not hidden,
        "needs_vip":   (is_free or is_pro) and is_multi,
        "blur_entry":  not show_entry and not hidden,
        "blur_sl_tp":  not show_sl_tp,
        # Visible fields
        "direction":   None if hidden else signal.direction,
        "pnl_pips":    None if hidden else signal.pnl_pips,
        "confidence":  None if hidden else (round(signal.confidence, 2) if signal.confidence else None),
        "entry_price": signal.entry_price if show_entry else None,
        "sl_price":    signal.sl_price    if show_sl_tp  else None,
        "tp_price":    signal.tp_price    if show_sl_tp  else None,
        "rr_ratio":    signal.rr_ratio    if show_sl_tp  else None,
        "reason":      signal.reason      if show_sl_tp  else None,
    }

@router.get("/latest")
async def get_latest_signals(
    pair: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Signal).where(
        Signal.status == SignalStatus.OPEN
    ).order_by(desc(Signal.created_at)).limit(10)
    if pair:
        q = q.where(Signal.pair == pair)
    result = await db.execute(q)
    signals = result.scalars().all()

    # All users see all pairs - details locked by tier
    return [_apply_tier(s, user) for s in signals]


@router.get("/history")
async def get_signal_history(
    pair: Optional[str] = None,
    days: int = Query(default=30, le=365),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Free users: only last 7 days
    if user.tier == SubscriptionTier.FREE:
        days = min(days, 7)

    cutoff = datetime.utcnow() - timedelta(days=days)
    q = select(Signal).where(
        Signal.created_at >= cutoff
    ).order_by(desc(Signal.created_at)).offset(skip).limit(limit)

    if pair:
        q = q.where(Signal.pair == pair)
    if status:
        q = q.where(Signal.status == status)

    result = await db.execute(q)
    signals = result.scalars().all()

    # All users see all signals - details locked by tier
    return [_apply_tier(s, user) for s in signals]


@router.get("/performance")
async def get_performance(
    pair: Optional[str] = None,
    days: int = Query(default=90, le=365),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Free users: only last 30 days of performance
    if user.tier == SubscriptionTier.FREE:
        days = min(days, 30)

    cutoff = datetime.utcnow() - timedelta(days=days)
    q = select(Performance).where(Performance.date >= cutoff).order_by(Performance.date)
    if pair:
        q = q.where(Performance.pair == pair)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/stats/summary")
async def get_stats_summary(
    pair: Optional[str] = None,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.tier == SubscriptionTier.FREE:
        days = min(days, 7)

    cutoff = datetime.utcnow() - timedelta(days=days)
    base = select(Signal).where(
        Signal.created_at >= cutoff,
        Signal.status != SignalStatus.OPEN,
    )
    if pair:
        base = base.where(Signal.pair == pair)

    result = await db.execute(base)
    signals = result.scalars().all()

    if not signals:
        return {"total": 0, "win_rate": 0, "pnl_pips": 0, "open_count": 0, "tier": user.tier}

    tp    = sum(1 for s in signals if s.status == SignalStatus.TP_HIT)
    total = len(signals)
    pnl   = sum(s.pnl_pips or 0 for s in signals)

    open_result = await db.execute(
        select(func.count()).where(Signal.status == SignalStatus.OPEN)
    )
    open_count = open_result.scalar()

    return {
        "total":       total,
        "win_rate":    round(tp / total, 4) if total else 0,
        "pnl_pips":    round(pnl, 1),
        "open_count":  open_count,
        "period_days": days,
        "tier":        user.tier,
    }


@router.get("/{signal_id}")
async def get_signal(
    signal_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Signal).where(Signal.id == signal_id))
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return _apply_tier(signal, user)


@router.get("/public/recent")
async def get_public_recent_signals(db: AsyncSession = Depends(get_db)):
    """Public endpoint - shows last 10 closed signals with full details for transparency."""
    result = await db.execute(
        select(Signal)
        .where(Signal.status != SignalStatus.OPEN)
        .order_by(desc(Signal.closed_at))
        .limit(10)
    )
    signals = result.scalars().all()
    return [
        {
            "id":          s.id,
            "pair":        s.pair,
            "direction":   s.direction,
            "entry_price": s.entry_price,
            "sl_price":    s.sl_price,
            "tp_price":    s.tp_price,
            "pnl_pips":    s.pnl_pips,
            "status":      s.status,
            "closed_at":   s.closed_at,
        }
        for s in signals
    ]


@router.get("/public/live")
async def get_public_live_signals(db: AsyncSession = Depends(get_db)):
    """Public endpoint - shows current open signals with limited details (direction + entry, SL/TP hidden)."""
    result = await db.execute(
        select(Signal)
        .where(Signal.status == SignalStatus.OPEN)
        .order_by(desc(Signal.created_at))
        .limit(2)
    )
    signals = result.scalars().all()
    return [
        {
            "id":          s.id,
            "pair":        s.pair,
            "direction":   s.direction,
            "entry_price": s.entry_price,
            "sl_price":    None,  # Hidden for public
            "tp_price":    None,  # Hidden for public
            "confidence":  round(s.confidence, 2) if s.confidence else None,
            "status":      s.status,
            "created_at":  s.created_at,
            "is_live":     True,
        }
        for s in signals
    ]


@router.get("/stats/pairs")
async def get_pairs_stats(db: AsyncSession = Depends(get_db)):
    """Per-pair signal statistics for admin."""
    from sqlalchemy import func, case
    result = await db.execute(
        select(
            Signal.pair,
            func.count(Signal.id).label("total"),
            func.sum(case((Signal.status == SignalStatus.TP_HIT, 1), else_=0)).label("wins"),
            func.sum(case((Signal.status == SignalStatus.SL_HIT, 1), else_=0)).label("losses"),
            func.sum(case((Signal.status == SignalStatus.EXPIRED, 1), else_=0)).label("expired"),
            func.sum(case((Signal.status == SignalStatus.OPEN, 1), else_=0)).label("open"),
            func.sum(Signal.pnl_pips).label("total_pips"),
            func.avg(Signal.confidence).label("avg_confidence"),
        )
        .group_by(Signal.pair)
        .order_by(func.count(Signal.id).desc())
    )
    rows = result.fetchall()
    stats = []
    for r in rows:
        closed = (r.wins or 0) + (r.losses or 0)
        win_rate = round((r.wins or 0) / closed * 100, 1) if closed > 0 else 0
        stats.append({
            "pair":           r.pair,
            "total":          r.total,
            "wins":           r.wins or 0,
            "losses":         r.losses or 0,
            "expired":        r.expired or 0,
            "open":           r.open or 0,
            "closed":         closed,
            "win_rate":       win_rate,
            "total_pips":     round(r.total_pips or 0, 1),
            "avg_confidence": round((r.avg_confidence or 0) * 100, 1),
        })
    return stats
