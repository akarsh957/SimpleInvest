import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic_settings import BaseSettings

load_dotenv()

class DBSettings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

db_settings = DBSettings()

def get_supabase_client() -> Client:
    if not db_settings.SUPABASE_URL or not db_settings.SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set")
    return create_client(db_settings.SUPABASE_URL, db_settings.SUPABASE_KEY)

def get_authenticated_supabase_client(access_token: str) -> Client:
    client = get_supabase_client()
    client.postgrest.auth(access_token)
    return client

supabase = get_supabase_client() if db_settings.SUPABASE_URL and db_settings.SUPABASE_KEY else None
