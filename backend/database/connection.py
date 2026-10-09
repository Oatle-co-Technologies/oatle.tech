import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")


# Serverless instances must not retain idle sessions in Supabase's session pooler.
database_url = make_url(DATABASE_URL)
engine_options = {"pool_pre_ping": True, "poolclass": NullPool}
if os.getenv("VERCEL") and (database_url.host or "").endswith(".pooler.supabase.com"):
    database_url = database_url.set(port=6543)
    if database_url.drivername == "postgresql+psycopg":
        engine_options["connect_args"] = {"prepare_threshold": None}

engine = create_engine(database_url, **engine_options)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()