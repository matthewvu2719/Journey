"""
Authentication system with Supabase Auth and guest mode
"""
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from supabase import Client, create_client
from dotenv import load_dotenv

load_dotenv()

# JWT settings for guest mode
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

security = HTTPBearer(auto_error=False)


class AuthService:
    """Handles authentication for both Supabase Auth and guest mode"""
    
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if url and key and url != "https://your-project.supabase.co":
            try:
                self.supabase: Client = create_client(url, key)
                self.supabase_enabled = True
                print("✓ Supabase Auth enabled")
            except Exception as e:
                print(f"⚠️  Supabase Auth failed: {e}")
                self.supabase = None
                self.supabase_enabled = False
        else:
            self.supabase = None
            self.supabase_enabled = False
            print("⚠️  Running in guest-only mode")
    
    # ========================================================================
    # GUEST MODE (JWT-based)
    # ========================================================================
    
    def create_guest_token(self, guest_id: str) -> str:
        """Create JWT token for guest user"""
        payload = {
            "sub": guest_id,
            "type": "guest",
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    def verify_guest_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode guest JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    # ========================================================================
    # SUPABASE AUTH
    # ========================================================================
    
    def sign_up(self, email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Sign up new user with Supabase Auth"""
        if not self.supabase_enabled:
            raise HTTPException(status_code=501, detail="Supabase Auth not configured")
        
        try:
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {"name": name} if name else {}
                }
            })
            
            if response.user:
                return {
                    "user_id": response.user.id,
                    "email": response.user.email,
                    "access_token": response.session.access_token if response.session else None,
                    "refresh_token": response.session.refresh_token if response.session else None
                }
            else:
                raise HTTPException(status_code=400, detail="Sign up failed")
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in user with Supabase Auth"""
        if not self.supabase_enabled:
            raise HTTPException(status_code=501, detail="Supabase Auth not configured")
        
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user and response.session:
                return {
                    "user_id": response.user.id,
                    "email": response.user.email,
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid credentials")
        
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    def sign_out(self, token: str) -> bool:
        """Sign out user"""
        if not self.supabase_enabled:
            return True  # Guest mode, just discard token client-side
        
        try:
            self.supabase.auth.sign_out()
            return True
        except Exception:
            return False
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user info from Supabase token"""
        if not self.supabase_enabled:
            return None
        
        try:
            response = self.supabase.auth.get_user(token)
            if response.user:
                return {
                    "user_id": response.user.id,
                    "email": response.user.email,
                    "type": "authenticated"
                }
            return None
        except Exception:
            return None
    
    # ========================================================================
    # UNIFIED AUTH
    # ========================================================================
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify token (either Supabase or guest JWT)"""
        # Try Supabase first
        if self.supabase_enabled:
            user = self.get_user_from_token(token)
            if user:
                return user
        
        # Try guest token
        guest_data = self.verify_guest_token(token)
        if guest_data:
            return {
                "user_id": guest_data["sub"],
                "type": "guest"
            }
        
        return None


# Global auth service instance
auth_service = AuthService()


# ========================================================================
# DEPENDENCY FUNCTIONS
# ========================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency to get current user from token
    Returns user info or raises 401
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = auth_service.verify_token(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - returns user if authenticated, None otherwise
    Useful for endpoints that work for both guests and authenticated users
    """
    if not credentials:
        return None
    
    return auth_service.verify_token(credentials.credentials)


async def get_user_id(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """Extract user_id from current user"""
    return current_user["user_id"]


async def get_user_id_optional(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
) -> str:
    """Get user_id or default to 'guest'"""
    if current_user:
        return current_user["user_id"]
    return "guest"


# ========================================================================
# AUTH MODELS
# ========================================================================

from pydantic import BaseModel, EmailStr

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class GuestLoginRequest(BaseModel):
    device_id: Optional[str] = None  # Optional device identifier


class AuthResponse(BaseModel):
    user_id: str
    email: Optional[str] = None
    access_token: str
    refresh_token: Optional[str] = None
    user_type: str  # 'authenticated' or 'guest'


class UserInfo(BaseModel):
    user_id: str
    email: Optional[str] = None
    user_type: str
    created_at: Optional[datetime] = None
    timezone: Optional[str] = None  # e.g., "America/New_York", "UTC"


class UserPreferences(BaseModel):
    user_id: str
    timezone: str = "UTC"  # Default to UTC
    date_format: str = "YYYY-MM-DD"  # ISO format
    time_format: str = "24h"  # 24h or 12h
    week_start: str = "monday"  # monday or sunday


class UserPreferencesUpdate(BaseModel):
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    week_start: Optional[str] = None
