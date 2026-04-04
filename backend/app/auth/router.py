import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator

from app.db.database import get_db
from app.db.models import User
from app.auth.security import create_access_token, create_refresh_token, decode_token
from app.auth.middleware import get_current_user
from app.auth.nexus_client import NexusClient, NexusError, get_nexus_client

router = APIRouter(prefix="/api/auth", tags=["auth"])

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{2,16}$")


class AuthRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not _USERNAME_RE.match(v):
            raise ValueError("Username must be 2-16 characters: letters, numbers, underscores only")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    username: str


class RefreshRequest(BaseModel):
    refresh_token: str


async def _get_or_create_local_user(
    db: AsyncSession, nexus_id: str, username: str
) -> User:
    result = await db.execute(select(User).where(User.nexus_id == nexus_id))
    user = result.scalar_one_or_none()
    if user:
        if user.username != username:
            user.username = username
            await db.flush()
        return user

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user and not user.nexus_id:
        user.nexus_id = nexus_id
        await db.flush()
        return user

    user = User(
        nexus_id=nexus_id,
        username=username,
        hashed_password="nexus-managed",
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    body: AuthRequest,
    db: AsyncSession = Depends(get_db),
    nexus: NexusClient = Depends(get_nexus_client),
):
    try:
        result = await nexus.login(body.username, body.password)
    except NexusError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = await _get_or_create_local_user(db, result["user_id"], result["username"])
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, nexus_session=result["session_token"]),
        refresh_token=create_refresh_token(user.id, nexus_session=result["session_token"]),
        username=user.username,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: AuthRequest,
    db: AsyncSession = Depends(get_db),
    nexus: NexusClient = Depends(get_nexus_client),
):
    try:
        result = await nexus.register(body.username, body.password)
    except NexusError as e:
        if e.status_code == 409:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
        if e.status_code == 0:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.detail)
        if 400 <= e.status_code < 500:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=e.detail)

    user = await _get_or_create_local_user(db, result["user_id"], result["username"])
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, nexus_session=result["session_token"]),
        refresh_token=create_refresh_token(user.id, nexus_session=result["session_token"]),
        username=user.username,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    nexus: NexusClient = Depends(get_nexus_client),
):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    nexus_session = payload.get("nexus_session")
    if nexus_session:
        identity = await nexus.validate_session(nexus_session)
        if not identity:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id, nexus_session=nexus_session),
        refresh_token=create_refresh_token(user.id, nexus_session=nexus_session),
        username=user.username,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: RefreshRequest,
    nexus: NexusClient = Depends(get_nexus_client),
):
    payload = decode_token(body.refresh_token)
    if payload:
        nexus_session = payload.get("nexus_session")
        if nexus_session:
            await nexus.logout(nexus_session)


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username}
