from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase_client, supabase_admin

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Validate token with Supabase
        client = get_supabase_client(token)
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user": response.user, "token": token}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
