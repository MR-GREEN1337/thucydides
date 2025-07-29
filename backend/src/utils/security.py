import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from loguru import logger
from passlib.context import CryptContext
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..core.settings import get_settings
from ..db.models import User
from ..db.postgresql import get_session

# --- CONFIGURATION ---
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = settings.ALGORITHM
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# --- PASSWORD UTILS ---
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_unusable_password() -> str:
    """Generates a secure, random password hash for social logins."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = "".join(secrets.choice(alphabet) for _ in range(32))
    return get_password_hash(password)


# --- TOKEN UTILS ---
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.PRIVATE_KEY, algorithm=ALGORITHM)


# --- DATABASE LOOKUP UTILS ---
async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    # The statement itself is correct and selects all columns from the User table.
    statement = select(User).where(User.email == email)
    # The issue is how the result is processed.
    # .first() on a result set returns a RowProxy, which can behave differently
    # from a fully loaded model instance. .scalars().first() is the
    # idiomatic way to get a single, complete ORM object.
    result = await session.execute(statement)
    return result.scalars().first()


# --- CORE AUTHENTICATION DEPENDENCY (MIDDLEWARE) ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            logger.warning("Token decoding failed: subject missing.")
            raise credentials_exception
    except JWTError as e:
        logger.warning(f"Token decoding failed: {e}")
        raise credentials_exception from e

    user = await get_user_by_email(session, email=email)
    if user is None:
        logger.warning(f"User not found for email: {email}")
        raise credentials_exception
    if not user.is_active:
        logger.warning(f"Authentication attempt from inactive user: {email}")
        raise HTTPException(status_code=400, detail="Inactive user")

    return user
