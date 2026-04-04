from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import User, ECUProfile
from app.auth.middleware import get_current_user

router = APIRouter(prefix="/api/ecu-profiles", tags=["ecu-profiles"])


class ECUProfileCreate(BaseModel):
    name: str
    vehicle_id: int | None = None
    description: str | None = None
    profile_data: dict
    is_active: bool = False


class ECUProfileResponse(BaseModel):
    id: int
    name: str
    vehicle_id: int | None
    description: str | None
    profile_data: dict
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("", response_model=list[ECUProfileResponse])
async def list_profiles(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ECUProfile).where(ECUProfile.user_id == user.id).order_by(ECUProfile.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ECUProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    body: ECUProfileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = ECUProfile(user_id=user.id, **body.model_dump())
    db.add(profile)
    await db.flush()
    return profile


@router.get("/{profile_id}", response_model=ECUProfileResponse)
async def get_profile(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ECUProfile).where(ECUProfile.id == profile_id, ECUProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ECUProfile).where(ECUProfile.id == profile_id, ECUProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
