"""
Blog system - models, routes, full SEO support.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from pydantic import BaseModel
import re
import json

from app.db.session import get_db
from app.db.models import Base
from app.core.logger import logger


# ── Models ────────────────────────────────────────────────────────────────────

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id          = Column(Integer, primary_key=True)
    title       = Column(String(500), nullable=False)
    slug        = Column(String(500), unique=True, nullable=False)
    excerpt     = Column(Text)
    content     = Column(Text)
    cover_image = Column(Text)
    author      = Column(String(200), default="AlphaForexAI Team")
    category    = Column(String(100))
    tags        = Column(String(500))  # comma-separated
    status      = Column(String(20), default="draft")  # draft, published
    featured    = Column(Boolean, default=False)
    # SEO
    seo_title       = Column(String(500))
    seo_description = Column(String(500))
    # Stats
    views       = Column(Integer, default=0)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    title:           str
    slug:            Optional[str] = None
    excerpt:         Optional[str] = None
    content:         Optional[str] = None
    cover_image:     Optional[str] = None
    author:          Optional[str] = "AlphaForexAI Team"
    category:        Optional[str] = None
    tags:            Optional[str] = None
    status:          Optional[str] = "draft"
    featured:        Optional[bool] = False
    seo_title:       Optional[str] = None
    seo_description: Optional[str] = None


class PostUpdate(PostCreate):
    pass


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')


def post_to_dict(p: BlogPost, full: bool = False) -> dict:
    d = {
        "id":           p.id,
        "title":        p.title,
        "slug":         p.slug,
        "excerpt":      p.excerpt,
        "cover_image":  p.cover_image,
        "author":       p.author,
        "category":     p.category,
        "tags":         p.tags.split(",") if p.tags else [],
        "status":       p.status,
        "featured":     p.featured,
        "views":        p.views,
        "created_at":   p.created_at.isoformat() if p.created_at else None,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "seo_title":       p.seo_title or p.title,
        "seo_description": p.seo_description or p.excerpt,
    }
    if full:
        d["content"] = p.content
    return d


# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/blog", tags=["blog"])


@router.get("/posts")
async def list_posts(
    page:     int = Query(default=1, ge=1),
    limit:    int = Query(default=12, le=50),
    category: Optional[str] = None,
    tag:      Optional[str] = None,
    search:   Optional[str] = None,
    featured: Optional[bool] = None,
    db:       AsyncSession = Depends(get_db),
):
    q = select(BlogPost).where(BlogPost.status == "published").order_by(desc(BlogPost.published_at))

    if category:
        q = q.where(BlogPost.category == category)
    if tag:
        q = q.where(BlogPost.tags.contains(tag))
    if search:
        q = q.where(or_(BlogPost.title.ilike(f"%{search}%"), BlogPost.excerpt.ilike(f"%{search}%")))
    if featured is not None:
        q = q.where(BlogPost.featured == featured)

    # Count
    count_q = select(func.count()).select_from(q.subquery())
    total   = (await db.execute(count_q)).scalar()

    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    posts  = result.scalars().all()

    return {
        "posts": [post_to_dict(p) for p in posts],
        "total": total,
        "page":  page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/posts/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BlogPost.category, func.count(BlogPost.id).label("count"))
        .where(BlogPost.status == "published", BlogPost.category.isnot(None))
        .group_by(BlogPost.category)
        .order_by(desc("count"))
    )
    return [{"name": row[0], "count": row[1]} for row in result.fetchall()]


@router.get("/posts/tags")
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BlogPost.tags).where(BlogPost.status == "published", BlogPost.tags.isnot(None))
    )
    tag_counts: dict = {}
    for row in result.fetchall():
        for tag in (row[0] or "").split(","):
            tag = tag.strip()
            if tag:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    return [{"name": k, "count": v} for k, v in sorted(tag_counts.items(), key=lambda x: -x[1])]


@router.get("/posts/{slug}")
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug, BlogPost.status == "published"))
    post   = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # Increment views
    post.views = (post.views or 0) + 1
    await db.commit()
    return post_to_dict(post, full=True)


# ── Admin routes ──────────────────────────────────────────────────────────────

@router.get("/admin/posts")
async def admin_list_posts(
    page:   int = Query(default=1, ge=1),
    limit:  int = Query(default=20, le=100),
    status: Optional[str] = None,
    db:     AsyncSession = Depends(get_db),
):
    q = select(BlogPost).order_by(desc(BlogPost.created_at))
    if status:
        q = q.where(BlogPost.status == status)
    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    posts  = result.scalars().all()
    return {"posts": [post_to_dict(p, full=True) for p in posts], "total": total}


@router.post("/admin/posts", status_code=201)
async def create_post(body: PostCreate, db: AsyncSession = Depends(get_db)):
    slug = body.slug or slugify(body.title)
    # Ensure unique slug
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    post = BlogPost(
        title=body.title, slug=slug, excerpt=body.excerpt,
        content=body.content, cover_image=body.cover_image,
        author=body.author, category=body.category,
        tags=body.tags, status=body.status, featured=body.featured,
        seo_title=body.seo_title, seo_description=body.seo_description,
        published_at=datetime.utcnow() if body.status == "published" else None,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    logger.info(f"Blog post created: {post.slug}")
    return post_to_dict(post, full=True)


@router.put("/admin/posts/{post_id}")
async def update_post(post_id: int, body: PostUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post   = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    for field in ["title", "excerpt", "content", "cover_image", "author", "category", "tags", "status", "featured", "seo_title", "seo_description"]:
        val = getattr(body, field, None)
        if val is not None:
            setattr(post, field, val)

    if body.slug:
        post.slug = body.slug
    if body.status == "published" and not post.published_at:
        post.published_at = datetime.utcnow()

    post.updated_at = datetime.utcnow()
    await db.commit()
    return post_to_dict(post, full=True)


@router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post   = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()
    return {"ok": True}


# ── Media library ─────────────────────────────────────────────────────────────

from sqlalchemy import Column as SaColumn, Integer as SaInteger, Text as SaText, String as SaString, DateTime as SaDateTime
from datetime import datetime as dt

class MediaLibrary(Base):
    __tablename__ = "media_library"
    id         = SaColumn(SaInteger, primary_key=True)
    filename   = SaColumn(SaString(500))
    data       = SaColumn(SaText, nullable=False)
    mime_type  = SaColumn(SaString(100))
    size_bytes = SaColumn(SaInteger)
    created_at = SaColumn(SaDateTime, default=dt.utcnow)


@router.get("/media")
async def list_media(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MediaLibrary).order_by(MediaLibrary.created_at.desc()).limit(50)
    )
    items = result.scalars().all()
    return [{"id": m.id, "filename": m.filename, "data": m.data, "mime_type": m.mime_type, "size_bytes": m.size_bytes, "created_at": m.created_at} for m in items]


@router.post("/media", status_code=201)
async def upload_media(body: dict, db: AsyncSession = Depends(get_db)):
    item = MediaLibrary(
        filename=body.get("filename", "image"),
        data=body.get("data", ""),
        mime_type=body.get("mime_type", "image/jpeg"),
        size_bytes=len(body.get("data", "")),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"id": item.id, "data": item.data}


@router.delete("/media/{media_id}")
async def delete_media(media_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaLibrary).where(MediaLibrary.id == media_id))
    item   = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    # Delete file from disk if it is a local upload
    if item.data and item.data.startswith("https://alphaforexai.com/uploads/"):
        filename = item.data.split("/uploads/")[-1]
        filepath = f"/frontend/public/uploads/{filename}"
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            pass  # Don't fail if file missing

    await db.delete(item)
    await db.commit()
    return {"ok": True}


import os, uuid, base64

UPLOAD_DIR = "/app/../frontend/public/uploads"

@router.post("/media/upload")
async def upload_media_file(body: dict, db: AsyncSession = Depends(get_db)):
    """Save base64 image to disk and return public URL."""
    data     = body.get("data", "")
    filename = body.get("filename", "image.jpg")
    
    if not data:
        raise HTTPException(status_code=400, detail="No image data")

    # Extract base64 content
    if "," in data:
        header, b64 = data.split(",", 1)
        ext = header.split("/")[1].split(";")[0] if "/" in header else "jpg"
    else:
        b64  = data
        ext  = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"

    # Keep original filename exactly
    clean_name = filename.rsplit(".", 1)[0].replace(" ", "-").lower()
    clean_name = "".join(c for c in clean_name if c.isalnum() or c == "-")
    unique_name = f"{clean_name}.{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filepath = os.path.join(UPLOAD_DIR, unique_name)

    # Save file
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(b64))

    public_url = f"https://alphaforexai.com/uploads/{unique_name}"

    # Also save to media library
    item = MediaLibrary(
        filename=filename,
        data=public_url,  # Store URL not base64
        mime_type=f"image/{ext}",
        size_bytes=os.path.getsize(filepath),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return {"url": public_url, "id": item.id}


# ── Analytics tracking ────────────────────────────────────────────────────────
import hashlib
from datetime import datetime, timedelta
from sqlalchemy import func, case

class PageVisit(Base):
    __tablename__ = "page_visits"
    id         = SaColumn(SaInteger, primary_key=True)
    path       = SaColumn(SaString(500))
    referrer   = SaColumn(SaString(500))
    user_agent = SaColumn(SaText)
    country    = SaColumn(SaString(100))
    device     = SaColumn(SaString(50))
    browser    = SaColumn(SaString(100))
    os         = SaColumn(SaString(100))
    ip_hash    = SaColumn(SaString(64))
    created_at = SaColumn(SaDateTime(timezone=True), default=datetime.utcnow)


def parse_user_agent(ua: str) -> dict:
    ua = ua.lower()
    # Device
    if any(x in ua for x in ["mobile", "android", "iphone", "ipod"]):
        device = "Mobile"
    elif any(x in ua for x in ["tablet", "ipad"]):
        device = "Tablet"
    else:
        device = "Desktop"
    # Browser
    if "edg" in ua:       browser = "Edge"
    elif "chrome" in ua:  browser = "Chrome"
    elif "firefox" in ua: browser = "Firefox"
    elif "safari" in ua:  browser = "Safari"
    elif "opera" in ua:   browser = "Opera"
    else:                 browser = "Other"
    # OS
    if "windows" in ua:   os = "Windows"
    elif "android" in ua: os = "Android"
    elif "iphone" in ua or "ipad" in ua: os = "iOS"
    elif "mac" in ua:     os = "macOS"
    elif "linux" in ua:   os = "Linux"
    else:                 os = "Other"
    return {"device": device, "browser": browser, "os": os}


@router.post("/track")
async def track_visit(request: Request, body: dict, db: AsyncSession = Depends(get_db)):
    """Track a page visit."""
    try:
        ua      = request.headers.get("user-agent", "")
        ip      = request.headers.get("x-forwarded-for", request.client.host or "")
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16]
        parsed  = parse_user_agent(ua)

        visit = PageVisit(
            path       = body.get("path", "/")[:500],
            referrer   = body.get("referrer", "")[:500],
            user_agent = ua[:500],
            device     = parsed["device"],
            browser    = parsed["browser"],
            os         = parsed["os"],
            ip_hash    = ip_hash,
        )
        db.add(visit)

        # Also increment blog post views
        if body.get("post_id"):
            await db.execute(
                text("UPDATE blog_posts SET views = COALESCE(views, 0) + 1 WHERE id = :id"),
                {"id": body["post_id"]}
            )

        await db.commit()
        return {"ok": True}
    except Exception as e:
        return {"ok": False}


@router.get("/analytics")
async def get_analytics(days: int = 30, db: AsyncSession = Depends(get_db), 
    from_date: str = None, to_date: str = None):
    """Get traffic analytics for admin."""
    if from_date and to_date:
        try:
            cutoff   = datetime.strptime(from_date, "%Y-%m-%d")
            end_date = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        except:
            cutoff   = datetime.utcnow() - timedelta(days=days)
            end_date = datetime.utcnow() + timedelta(days=1)
    else:
        cutoff   = datetime.utcnow() - timedelta(days=days)
        end_date = datetime.utcnow() + timedelta(days=1)

    # Total visits
    total = await db.execute(
        select(func.count(PageVisit.id)).where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
    )
    total_visits = total.scalar() or 0

    # Unique visitors (by ip_hash)
    unique = await db.execute(
        select(func.count(func.distinct(PageVisit.ip_hash))).where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
    )
    unique_visitors = unique.scalar() or 0

    # Top pages
    pages = await db.execute(
        select(PageVisit.path, func.count(PageVisit.id).label("count"))
        .where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
        .group_by(PageVisit.path)
        .order_by(func.count(PageVisit.id).desc())
        .limit(10)
    )
    top_pages = [{"path": r.path, "count": r.count} for r in pages]

    # Referrers
    refs = await db.execute(
        select(PageVisit.referrer, func.count(PageVisit.id).label("count"))
        .where(PageVisit.created_at >= cutoff, PageVisit.referrer != "")
        .group_by(PageVisit.referrer)
        .order_by(func.count(PageVisit.id).desc())
        .limit(10)
    )
    referrers = [{"referrer": r.referrer or "Direct", "count": r.count} for r in refs]

    # Devices
    devices = await db.execute(
        select(PageVisit.device, func.count(PageVisit.id).label("count"))
        .where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
        .group_by(PageVisit.device)
        .order_by(func.count(PageVisit.id).desc())
    )
    device_stats = [{"device": r.device, "count": r.count} for r in devices]

    # Browsers
    browsers = await db.execute(
        select(PageVisit.browser, func.count(PageVisit.id).label("count"))
        .where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
        .group_by(PageVisit.browser)
        .order_by(func.count(PageVisit.id).desc())
    )
    browser_stats = [{"browser": r.browser, "count": r.count} for r in browsers]

    # OS
    os_stats_q = await db.execute(
        select(PageVisit.os, func.count(PageVisit.id).label("count"))
        .where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
        .group_by(PageVisit.os)
        .order_by(func.count(PageVisit.id).desc())
    )
    os_stats = [{"os": r.os, "count": r.count} for r in os_stats_q]

    # Daily visits (last 30 days)
    from sqlalchemy import literal_column
    daily = await db.execute(
        select(
            func.date_trunc(literal_column("'day'"), PageVisit.created_at).label("day"),
            func.count(PageVisit.id).label("count")
        )
        .where(PageVisit.created_at >= cutoff, PageVisit.created_at <= end_date)
        .group_by(func.date_trunc(literal_column("'day'"), PageVisit.created_at))
        .order_by(func.date_trunc(literal_column("'day'"), PageVisit.created_at))
    )
    daily_visits = [{"day": str(r.day)[:10], "count": r.count} for r in daily]

    # Top blog posts
    top_posts = await db.execute(
        select(BlogPost.id, BlogPost.title, BlogPost.views, BlogPost.slug)
        .where(BlogPost.status == "published")
        .order_by(BlogPost.views.desc())
        .limit(10)
    )
    posts_stats = [{"id": r.id, "title": r.title, "views": r.views or 0, "slug": r.slug} for r in top_posts]

    return {
        "total_visits":    total_visits,
        "unique_visitors": unique_visitors,
        "top_pages":       top_pages,
        "referrers":       referrers,
        "devices":         device_stats,
        "browsers":        browser_stats,
        "os":              os_stats,
        "daily":           daily_visits,
        "top_posts":       posts_stats,
    }


@router.delete("/analytics/reset")
async def reset_analytics(db: AsyncSession = Depends(get_db)):
    """Reset all traffic analytics data."""
    await db.execute(text("DELETE FROM page_visits"))
    await db.commit()
    return {"ok": True, "message": "Analytics data cleared"}
