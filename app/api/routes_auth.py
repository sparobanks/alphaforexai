"""
Auth routes: register, login, profile, password reset, admin user management.
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Annotated

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt

from app.db.session import get_db
from app.db.models import Base
from app.core.config import settings
from app.core.logger import logger

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum as SAEnum, ForeignKey, Text
import enum


class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PRO  = "pro"
    VIP  = "vip"


class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    tier          = Column(SAEnum(SubscriptionTier), default=SubscriptionTier.FREE)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    tier_expires  = Column(DateTime, nullable=True)
    # Profile fields
    full_name     = Column(String(255))
    phone         = Column(String(50))
    country       = Column(String(100))
    city          = Column(String(100))
    date_of_birth = Column(DateTime, nullable=True)
    # Password reset
    reset_token        = Column(String(100), nullable=True)
    # Auto-trading
    auto_trade_enabled  = Column(Boolean, default=False)
    auto_trade_risk_pct = Column(Float, default=1.0)
    oanda_account_id    = Column(String(100), nullable=True)
    oanda_api_key       = Column(String(200), nullable=True)
    oanda_is_live       = Column(Boolean, default=False)
    auto_trade_enabled  = Column(Boolean, default=False)
    auto_trade_risk_pct = Column(Float, default=1.0)
    oanda_account_id    = Column(String(100), nullable=True)
    oanda_api_key       = Column(String(200), nullable=True)
    oanda_is_live       = Column(Boolean, default=False)
    reset_token_expiry = Column(DateTime, nullable=True)


router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)

JWT_SECRET    = settings.SECRET_KEY
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    email:     EmailStr
    password:  str
    full_name: Optional[str] = None
    phone:     Optional[str] = None
    country:   Optional[str] = None
    city:      Optional[str] = None
    date_of_birth: Optional[str] = None

class LoginIn(BaseModel):
    email:    EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tier: str

class UserOut(BaseModel):
    id:           int
    email:        str
    tier:         str
    tier_expires: Optional[datetime]
    full_name:    Optional[str]
    phone:        Optional[str]
    country:      Optional[str]
    city:         Optional[str]
    date_of_birth: Optional[datetime]
    created_at:   Optional[datetime]
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name:     Optional[str] = None
    phone:         Optional[str] = None
    country:       Optional[str] = None
    city:          Optional[str] = None
    date_of_birth: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password:     str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token:        str
    new_password: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())

def create_token(user_id: int, tier: str) -> str:
    payload = {
        "sub":  str(user_id),
        "tier": tier,
        "exp":  datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db:    AsyncSession = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(creds.credentials)
    result  = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user    = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_tier(*tiers: str):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.tier not in tiers:
            raise HTTPException(status_code=403, detail=f"Requires: {', '.join(tiers)}")
        if user.tier != SubscriptionTier.FREE and user.tier_expires and user.tier_expires < datetime.utcnow():
            raise HTTPException(status_code=403, detail="Subscription expired")
        return user
    return checker


async def _send_reset_email(email: str, token: str):
    """Send password reset email."""
    try:
        import aiosmtplib, ssl
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        reset_url = f"https://alphaforexai.com/reset-password?token={token}"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset your AlphaForexAI password"
        msg["From"]    = settings.SMTP_USER
        msg["To"]      = email

        html = f"""
        <html><body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827;">Reset your password</h2>
          <p style="color: #6b7280;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="{reset_url}" style="background: #111827; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 13px;">If you didn't request this, ignore this email.</p>
          <p style="color: #9ca3af; font-size: 12px;">Link: {reset_url}</p>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode    = ssl.CERT_NONE

        async with aiosmtplib.SMTP(hostname=settings.SMTP_HOST, port=465, use_tls=True, tls_context=ctx) as smtp:
            await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            await smtp.send_message(msg)

        logger.info(f"Reset email sent to {email}")
    except Exception as e:
        logger.error(f"Reset email failed: {e}")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenOut, status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    dob = None
    if body.date_of_birth:
        try:
            dob = datetime.strptime(body.date_of_birth, "%Y-%m-%d")
        except Exception:
            pass

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        tier=SubscriptionTier.FREE,
        full_name=body.full_name,
        phone=body.phone,
        country=body.country,
        city=body.city,
        date_of_birth=dob,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"New user: {user.email}")
    return TokenOut(access_token=create_token(user.id, user.tier), tier=user.tier)


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")
    return TokenOut(access_token=create_token(user.id, user.tier), tier=user.tier)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/profile")
async def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
):
    if body.full_name     is not None: user.full_name  = body.full_name
    if body.phone         is not None: user.phone      = body.phone
    if body.country       is not None: user.country    = body.country
    if body.city          is not None: user.city       = body.city
    if body.date_of_birth is not None:
        try:
            user.date_of_birth = datetime.strptime(body.date_of_birth, "%Y-%m-%d")
        except Exception:
            pass
    await db.commit()
    return {"ok": True}


@router.post("/change-password")
async def change_password(
    body: PasswordChange,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordIn,
    background_tasks: BackgroundTasks,
    db:   AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()

    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token        = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        await db.commit()
        background_tasks.add_task(_send_reset_email, user.email, token)

    # Always return success
    return {"ok": True}


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordIn,
    db:   AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(
            User.reset_token == body.token,
            User.reset_token_expiry > datetime.utcnow(),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.password_hash      = hash_password(body.new_password)
    user.reset_token        = None
    user.reset_token_expiry = None
    await db.commit()
    return {"ok": True}


# ── Admin routes ──────────────────────────────────────────────────────────────

@router.get("/admin/users")
async def admin_list_users(
    skip:   int = 0,
    limit:  int = 50,
    search: Optional[str] = None,
    tier:   Optional[str] = None,
    db:     AsyncSession = Depends(get_db),
):
    q = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    if search:
        q = q.where(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
    if tier:
        q = q.where(User.tier == tier)
    result = await db.execute(q)
    users  = result.scalars().all()
    return [
        {
            "id":           u.id,
            "email":        u.email,
            "full_name":    u.full_name,
            "phone":        u.phone,
            "country":      u.country,
            "city":         u.city,
            "tier":         u.tier,
            "is_active":    u.is_active,
            "created_at":   u.created_at,
            "tier_expires": u.tier_expires,
        }
        for u in users
    ]


@router.get("/admin/stats")
async def admin_stats(db: AsyncSession = Depends(get_db)):
    total  = (await db.execute(select(func.count()).select_from(User))).scalar()
    free   = (await db.execute(select(func.count()).select_from(User).where(User.tier == "free"))).scalar()
    pro    = (await db.execute(select(func.count()).select_from(User).where(User.tier == "pro"))).scalar()
    vip    = (await db.execute(select(func.count()).select_from(User).where(User.tier == "vip"))).scalar()
    active = (await db.execute(select(func.count()).select_from(User).where(User.is_active == True))).scalar()

    today  = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_today = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= today)
    )).scalar()

    week_ago = datetime.utcnow() - timedelta(days=7)
    new_week = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= week_ago)
    )).scalar()

    return {
        "total_users":   total,
        "free_users":    free,
        "pro_users":     pro,
        "vip_users":     vip,
        "active_users":  active,
        "new_today":     new_today,
        "new_this_week": new_week,
        "mrr_estimate":  pro * 10 + vip * 20,
    }


@router.post("/admin/upgrade")
async def upgrade_user(
    email: str,
    tier:  str,
    days:  int = 30,
    db:    AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.tier         = tier
    user.tier_expires = datetime.utcnow() + timedelta(days=days)
    await db.commit()
    logger.info(f"Upgraded {email} to {tier} for {days}d")
    return {"ok": True, "tier": tier, "expires": user.tier_expires}


@router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: int,
    body:    dict,
    db:      AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "tier"      in body: user.tier       = body["tier"]
    if "is_active" in body: user.is_active  = body["is_active"]
    if "full_name" in body: user.full_name  = body["full_name"]
    if "email"     in body: user.email      = body["email"]
    if "tier_expires" in body and body["tier_expires"]:
        try:
            user.tier_expires = datetime.fromisoformat(body["tier_expires"])
        except Exception:
            pass

    await db.commit()
    return {"ok": True}


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"ok": True}


# ── Site settings (analytics codes) ──────────────────────────────────────────

@router.get("/admin/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    from app.db.models import SiteSettings
    result = await db.execute(select(SiteSettings))
    rows   = result.scalars().all()
    return {r.key: r.value for r in rows}


@router.post("/admin/settings")
async def save_settings(body: dict, db: AsyncSession = Depends(get_db)):
    from app.db.models import SiteSettings
    for key, value in body.items():
        result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value      = value
            setting.updated_at = datetime.utcnow()
        else:
            db.add(SiteSettings(key=key, value=value))
    await db.commit()
    return {"ok": True}


@router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_password = body.get("new_password", "")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user.password_hash = hash_password(new_password)
    await db.commit()
    logger.info(f"Admin reset password for user {user_id}")
    return {"ok": True}


@router.post("/admin/change-admin-password")
async def admin_change_password(body: dict, db: AsyncSession = Depends(get_db)):
    """Change the admin panel password stored in site settings."""
    new_password = body.get("new_password", "")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    from app.db.models import SiteSettings
    result = await db.execute(select(SiteSettings).where(SiteSettings.key == "admin_password"))
    setting = result.scalar_one_or_none()
    hashed  = hash_password(new_password)
    if setting:
        setting.value      = hashed
        setting.updated_at = datetime.utcnow()
    else:
        db.add(SiteSettings(key="admin_password", value=hashed))
    await db.commit()
    return {"ok": True}


@router.post("/admin/verify-password")
async def verify_admin_password(body: dict, db: AsyncSession = Depends(get_db)):
    from app.db.models import SiteSettings
    password = body.get("password", "")
    if not password:
        return {"ok": False}

    # Check against stored hashed password
    result = await db.execute(select(SiteSettings).where(SiteSettings.key == "admin_password"))
    setting = result.scalar_one_or_none()

    if setting and setting.value:
        # Verify against bcrypt hash
        ok = verify_password(password, setting.value)
    else:
        # Fall back to default hardcoded password if none set
        ok = (password == "forexai-admin-2026")

    return {"ok": ok}


# ── Auto-trading routes ────────────────────────────────────────────────────────

class AutoTradeSettings(BaseModel):
    oanda_account_id:    Optional[str]   = None
    oanda_api_key:       Optional[str]   = None
    oanda_is_live:       Optional[bool]  = False
    auto_trade_enabled:  Optional[bool]  = False
    auto_trade_risk_pct: Optional[float] = 1.0


@router.get("/auto-trade/settings")
async def get_auto_trade_settings(user: User = Depends(get_current_user)):
    # Auto-trade available to VIP - enforced on frontend
    return {
        "auto_trade_enabled":  user.auto_trade_enabled,
        "auto_trade_risk_pct": user.auto_trade_risk_pct,
        "oanda_account_id":    user.oanda_account_id,
        "oanda_is_live":       user.oanda_is_live,
        "has_api_key":         bool(user.oanda_api_key),
    }


@router.post("/auto-trade/settings")
async def save_auto_trade_settings(
    body: AutoTradeSettings,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Auto-trade available to VIP - enforced on frontend

    if body.oanda_account_id is not None: user.oanda_account_id    = body.oanda_account_id
    if body.oanda_api_key    is not None: user.oanda_api_key        = body.oanda_api_key
    if body.oanda_is_live    is not None: user.oanda_is_live        = body.oanda_is_live
    if body.auto_trade_enabled  is not None: user.auto_trade_enabled  = body.auto_trade_enabled
    if body.auto_trade_risk_pct is not None: user.auto_trade_risk_pct = body.auto_trade_risk_pct

    await db.commit()
    return {"ok": True}


@router.post("/auto-trade/test")
async def test_auto_trade_connection(
    user: User = Depends(get_current_user),
):
    """Test OANDA connection for the user."""
    if user.tier not in ["vip"]:
        raise HTTPException(status_code=403, detail="VIP only")
    if not user.oanda_account_id or not user.oanda_api_key:
        raise HTTPException(status_code=400, detail="No OANDA credentials saved")

    import httpx
    base_url = "https://api-fxtrade.oanda.com" if user.oanda_is_live else "https://api-fxpractice.oanda.com"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res  = await client.get(
                f"{base_url}/v3/accounts/{user.oanda_account_id}/summary",
                headers={"Authorization": f"Bearer {user.oanda_api_key}"},
            )
            data = res.json()
            if "account" in data:
                return {
                    "ok":      True,
                    "balance": data["account"]["balance"],
                    "currency": data["account"]["currency"],
                    "mode":    "live" if user.oanda_is_live else "practice",
                }
            else:
                return {"ok": False, "error": data.get("errorMessage", "Connection failed")}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/broker-request")
async def submit_broker_request(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    broker = body.get("broker", "")
    notes  = body.get("notes", "")
    if not broker:
        raise HTTPException(status_code=400, detail="Broker name required")

    # Store in site_settings as a log
    from app.db.models import SiteSettings
    import json
    from datetime import datetime

    key = f"broker_request_{int(datetime.utcnow().timestamp())}"
    value = json.dumps({"broker": broker, "notes": notes, "email": user.email, "tier": user.tier})
    db.add(SiteSettings(key=key, value=value))
    await db.commit()
    logger.info(f"Broker request: {broker} from {user.email}")
    return {"ok": True}


@router.post("/admin/inject-scripts")
async def inject_scripts(body: dict, db: AsyncSession = Depends(get_db)):
    """Write header/footer scripts to _document.tsx and trigger frontend rebuild."""
    header = body.get("header_scripts", "")
    footer = body.get("footer_scripts", "")

    # Build the document file
    doc_content = f'''import {{ Html, Head, Main, NextScript }} from "next/document";

export default function Document() {{
  return (
    <Html lang="en">
      <Head>
        <meta name="robots" content="follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large" />
        {header}
      </Head>
      <body>
        <Main />
        <NextScript />
        {footer}
      </body>
    </Html>
  );
}}
'''

    # Write to the frontend
    import aiofiles
    async with aiofiles.open("/app/../frontend/pages/_document.tsx", "w") as f:
        await f.write(doc_content)

    # Save to settings too
    from app.db.models import SiteSettings
    for key, value in [("header_scripts", header), ("footer_scripts", footer)]:
        result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
        else:
            db.add(SiteSettings(key=key, value=value))
    await db.commit()

    return {"ok": True, "message": "Scripts injected. Rebuild frontend to apply."}


@router.post("/admin/update-scripts")
async def update_scripts(body: dict, db: AsyncSession = Depends(get_db)):
    """Update scripts-config.json and rebuild frontend."""
    import json
    import subprocess

    header_srcs = body.get("header_srcs", [])  # list of {src, async} objects
    footer_srcs = body.get("footer_srcs", [])

    config = {
        "header": header_srcs,
        "footer": footer_srcs,
    }

    config_path = "/app/../frontend/public/scripts-config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    # Save raw scripts to settings too
    for key, value in body.items():
        from app.db.models import SiteSettings
        result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = str(value)
        else:
            db.add(SiteSettings(key=key, value=str(value)))
    await db.commit()

    return {"ok": True}


@router.post("/admin/write-document")
async def write_document(body: dict, db: AsyncSession = Depends(get_db)):
    """Write scripts to _document.tsx and trigger frontend rebuild."""
    import subprocess, os

    header = body.get("header_scripts", "").strip()
    footer = body.get("footer_scripts", "").strip()

    # Escape curly braces in script content for f-string
    header_escaped = header.replace("{", "{{").replace("}", "}}")
    footer_escaped = footer.replace("{", "{{").replace("}", "}}")

    doc = """import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="robots" content="follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large" />
        """ + header + """
      </Head>
      <body>
        <Main />
        <NextScript />
        """ + footer + """
      </body>
    </Html>
  );
}
"""

    doc_path = "/app/../frontend/pages/_document.tsx"
    with open(doc_path, "w") as f:
        f.write(doc)

    # Trigger rebuild in background
    subprocess.Popen(
        ["docker", "compose", "up", "-d", "--build", "frontend"],
        cwd="/opt/forexai",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    logger.info("Document updated and rebuild triggered")
    return {"ok": True}
