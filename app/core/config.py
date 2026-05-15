from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ForexAI Signals"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/forexai"
    DATABASE_URL_SYNC: str = "postgresql://user:pass@localhost:5432/forexai"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Broker — OANDA (free demo account)
    OANDA_API_KEY: Optional[str] = None
    OANDA_ACCOUNT_ID: Optional[str] = None
    OANDA_ENV: str = "practice"          # "practice" | "live"

    # MT5 (Windows only)
    MT5_LOGIN: Optional[int] = None
    MT5_PASSWORD: Optional[str] = None
    MT5_SERVER: Optional[str] = None

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHANNEL_ID: Optional[str] = None   # e.g. "@mychannel" or "-1001234567890"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Signal settings
    SIGNAL_CONFIDENCE_THRESHOLD: float = 0.55
    DEFAULT_RISK_PCT: float = 1.0          # % of account per trade
    TP_PIPS: int = 20
    SL_PIPS: int = 10
    SIGNAL_EXPIRY_BARS: int = 12           # bars before signal expires
    ACTIVE_PAIRS: list[str] = ["EUR_USD","XAU_USD"]
    ACTIVE_TIMEFRAME: str = "H1"

    # Model
    MODEL_DIR: str = "models/saved"
    RETRAIN_SCHEDULE: str = "0 0 * * 0"  # weekly, Sunday midnight

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
