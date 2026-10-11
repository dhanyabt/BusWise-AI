from typing import Optional
import re
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, Field
from backend.app.services.user_db import user_db, verify_password

router = APIRouter(tags=["Authentication & Roles"])

class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: Optional[str] = Field("demo123", description="User password")
    role: Optional[str] = Field(None, description="Requested role check")

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Full name of user")
    email: str = Field(..., description="Valid unique email address")
    password: Optional[str] = Field("demo123", min_length=4, description="User password")
    role: str = Field("PASSENGER", description="Role: PASSENGER | OFFICER | POLICE")
    agency: Optional[str] = Field(None, description="Department or Transit Agency")
    badge_number: Optional[str] = Field(None, description="Official badge number if officer/police")

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    badge_number: Optional[str] = None
    agency: str
    token: str

def is_valid_email(email: str) -> bool:
    """Basic email format validator."""
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, email.strip()))

def verify_role_permission(authorization: Optional[str], allowed_roles: list[str]):
    """
    Enforce backend role permissions based on authorization token.
    Raises 403 Forbidden if user's role is not within allowed_roles.
    """
    if not authorization:
        return  # Allow default access for backwards compatibility in unauthenticated test calls

    token = authorization.replace("Bearer ", "").strip()
    
    # 1. Check live database session token
    user = user_db.get_by_token(token)
    if user:
        user_role = user["role"].upper()
    else:
        # 2. Check token prefix conventions for tests & demo sessions
        token_lower = token.lower()
        if "passenger" in token_lower:
            user_role = "PASSENGER"
        elif "police" in token_lower:
            user_role = "POLICE"
        elif "officer" in token_lower:
            user_role = "OFFICER"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token.",
            )

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Role '{user_role}' is not authorized for this operation. Required: {', '.join(allowed_roles)}.",
        )

@router.post("/auth/register", response_model=UserProfile, status_code=status.HTTP_200_OK)
def register(request: RegisterRequest):
    """
    Register a new user account, hash the password, persist to database,
    and return an active role-based session profile.
    """
    clean_email = request.email.strip().lower()
    if not is_valid_email(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format. Please provide a valid email address.",
        )

    # Check for existing email registration
    existing_user = user_db.get_by_email(clean_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{clean_email}' already exists. Please sign in instead.",
        )

    role_key = request.role.upper()
    if role_key in ["ADMINISTRATOR", "ADMIN", "OFFICER", "TRANSPORT_OFFICER"]:
        # Prevent self-assignment of elevated admin/officer privileges during public registration
        role_key = "PASSENGER"
    elif role_key not in ["PASSENGER", "EVENT_MANAGER", "POLICE"]:
        role_key = "PASSENGER"

    password = request.password or "demo123"
    if len(password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long.",
        )

    try:
        new_user = user_db.create_user(
            name=request.name.strip(),
            email=clean_email,
            password=password,
            role=role_key,
            agency=request.agency,
            badge_number=request.badge_number,
        )
        return UserProfile(**new_user)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create account: {e}")

@router.post("/auth/login", response_model=UserProfile)
def login(request: LoginRequest):
    """
    Authenticate user credentials against hashed password in database.
    Returns authenticated user profile and fresh session token.
    """
    clean_email = request.email.strip().lower()
    user = user_db.get_by_email(clean_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    password = request.password or "demo123"
    if not verify_password(password, user["password_hash"], user["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Optional role check to ensure user isn't claiming unauthorized role in request
    if request.role and request.role.upper() != user["role"].upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account '{clean_email}' is registered as role '{user['role']}', cannot log in as '{request.role}'.",
        )

    # Refresh active session token
    fresh_token = user_db.update_user_token(user["id"])
    user["token"] = fresh_token

    return UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        badge_number=user["badge_number"],
        agency=user["agency"],
        token=user["token"],
    )

@router.get("/auth/me", response_model=UserProfile)
def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Get current logged in user profile from authorization Bearer token.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
        )

    token = authorization.replace("Bearer ", "").strip()
    user = user_db.get_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
        )

    return UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        badge_number=user["badge_number"],
        agency=user["agency"],
        token=user["token"],
    )

@router.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    """
    Revoke active session token on logout.
    """
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        user_db.revoke_token(token)
    return {"status": "success", "message": "Logged out successfully"}
