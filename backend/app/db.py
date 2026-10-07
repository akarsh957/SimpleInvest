import os
from supabase import create_client, Client
from pydantic_settings import BaseSettings

class DBSettings(BaseSettings):
    SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

db_settings = DBSettings()

def get_supabase_client() -> Client:
    if not db_settings.SUPABASE_URL or not db_settings.SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set")
    return create_client(db_settings.SUPABASE_URL, db_settings.SUPABASE_KEY)

supabase = get_supabase_client() if db_settings.SUPABASE_URL and db_settings.SUPABASE_KEY else None
