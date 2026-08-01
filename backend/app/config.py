from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX: str
    GOOGLE_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
