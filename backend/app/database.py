from supabase import create_client, Client
from app.config import settings

# Client for admin operations (bypasses RLS)
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

# Function to get a user-scoped client if needed
def get_supabase_client(token: str) -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.postgrest.auth(token)
    return client
