from fastapi import APIRouter, HTTPException
from app.schemas import UserCreate, UserLogin, TokenResponse
from app.database import supabase_admin

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
async def signup(user: UserCreate):
    response = supabase_admin.auth.sign_up({
        "email": user.email,
        "password": user.password,
        "options": {
            "data": {
                "full_name": user.full_name
            }
        }
    })
    
    if not response or not response.session:
        raise HTTPException(status_code=400, detail="Signup failed. Email might already exist.")
        
    return {
        "access_token": response.session.access_token,
        "token_type": "bearer",
        "user": response.user.model_dump()
    }

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    try:
        response = supabase_admin.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": response.user.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")
