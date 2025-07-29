"""
API endpoints for user authentication, registration, and OAuth2 integration.
Handles both local password-based auth and social logins (Google).
"""

from typing import Any, Dict, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from loguru import logger
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


from ...utils.security import (
    ALGORITHM,
    create_access_token,
    create_refresh_token,
    generate_unusable_password,
    get_password_hash,
    get_user_by_email,
    verify_password,
)
from ...core.settings import get_settings
from ...db.models import Project, User
from ...db.postgresql import get_session

# --- Pydantic/SQLModel Schemas for API Validation ---


class UserCreate(SQLModel):
    """Schema for creating a new user with email and password."""

    email: str
    password: str
    full_name: Optional[str] = None


class UserRead(SQLModel):
    """Schema for safely returning user information."""

    id: uuid.UUID
    email: str
    full_name: Optional[str] = None


class Token(SQLModel):
    """Schema for returning access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Lifetime of the access token in seconds


class RefreshTokenRequest(SQLModel):
    """Schema for the refresh token request body."""

    refresh_token: str


# --- NEW: Schema for Google Token Login ---
class GoogleToken(SQLModel):
    id_token: str


# --- Router and Global Settings Initialization ---

router = APIRouter()
settings = get_settings()
google_request = google_requests.Request()


# --- Helper Function for User & Project Creation ---


async def create_user_and_project(
    session: AsyncSession, user_data: Dict[str, Any]
) -> User:
    """
    Creates a user and their default project within a single transaction.
    This is the central function for onboarding new users.
    """
    db_user = User.model_validate(user_data)
    try:
        session.add(db_user)
        await session.flush()  # Flush to get the db_user.id before creating the project

        project_name = f"{db_user.full_name or db_user.email.split('@')[0]}'s Project"
        new_project = Project(name=project_name, user_id=db_user.id)
        session.add(new_project)
        await session.flush()  # Flush to get the new_project.id

        # Link the default project back to the user
        db_user.active_project_id = new_project.id
        session.add(db_user)

        await session.commit()
        await session.refresh(db_user)
        logger.info(
            f"User '{db_user.email}' registered and created project '{new_project.name}'"
        )
        return db_user
    except Exception as e:
        await session.rollback()
        logger.error(f"Error during user/project creation for {db_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="There was an error creating account data.",
        )


# --- Standard Email/Password Authentication Endpoints ---


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, session: AsyncSession = Depends(get_session)
):
    """
    Register a new user with an email and password.
    Creates a default project for the user upon successful registration.
    """
    if await get_user_by_email(session=session, email=user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    user_data = user_in.model_dump()
    user_data["hashed_password"] = get_password_hash(user_in.password)
    del user_data["password"]  # Never store or pass around the plaintext password

    # Return the created user object (without tokens)
    return await create_user_and_project(session, user_data)


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    """
    Authenticate a user and return access and refresh tokens.
    Uses OAuth2PasswordRequestForm for standard form data submission.
    """
    user = await get_user_by_email(session=session, email=form_data.username)

    if (
        not user
        or not user.hashed_password
        or not verify_password(form_data.password, user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    req: RefreshTokenRequest, session: AsyncSession = Depends(get_session)
):
    """
    Refresh an expired access token using a valid refresh token.
    """
    try:
        payload = jwt.decode(
            req.refresh_token, settings.PUBLIC_KEY, algorithms=[ALGORITHM]
        )
        email: Optional[str] = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

        user = await get_user_by_email(session, email=email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        access_token = create_access_token(data={"sub": user.email})
        refresh_token = create_refresh_token(
            data={"sub": user.email}
        )  # Issue a new refresh token for security
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in,
            "token_type": "bearer",
        }
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


# --- NEW: Unified Google OAuth Login Endpoint ---
@router.post("/google/login", response_model=Token)
async def google_login(
    token_data: GoogleToken, session: AsyncSession = Depends(get_session)
):
    """
    Handles login via Google token from NextAuth.
    Verifies the token, then finds or creates a user, and issues our own JWTs.
    """
    try:
        # Verify the ID token with Google's servers
        id_info = id_token.verify_oauth2_token(
            token_data.id_token, google_request, settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        logger.error(f"Invalid Google token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token"
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=400, detail="Email not returned from Google provider."
        )

    user = await get_user_by_email(session, email)
    if not user:
        logger.info(f"New Google user: {email}. Creating account.")
        user_data = {
            "email": email,
            "full_name": id_info.get("name"),
            "hashed_password": generate_unusable_password(),
            "is_verified": id_info.get("email_verified", False),
        }
        user = await create_user_and_project(session, user_data)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Issue our application's own tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
        "token_type": "bearer",
    }
