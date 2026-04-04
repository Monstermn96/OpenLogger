import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import User, LogSession, DataLog
from app.auth.middleware import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionCreate(BaseModel):
    vehicle_id: int | None = None
    start_time: datetime
    end_time: datetime | None = None
    parameters: list[str] | None = None
    notes: str | None = None


class DataLogCreate(BaseModel):
    timestamp: datetime
    data: dict


class BulkDataLogCreate(BaseModel):
    logs: list[DataLogCreate]


class SessionSummary(BaseModel):
    id: int
    vehicle_id: int | None
    start_time: datetime
    end_time: datetime | None
    parameters: list[str] | None
    notes: str | None
    log_count: int = 0

    model_config = {"from_attributes": True}


class SessionDetail(BaseModel):
    id: int
    vehicle_id: int | None
    start_time: datetime
    end_time: datetime | None
    parameters: list[str] | None
    notes: str | None
    logs: list[DataLogCreate]

    model_config = {"from_attributes": True}


@router.get("", response_model=list[SessionSummary])
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            LogSession,
            func.count(DataLog.id).label("log_count"),
        )
        .outerjoin(DataLog)
        .where(LogSession.user_id == user.id)
        .group_by(LogSession.id)
        .order_by(LogSession.start_time.desc())
    )
    rows = result.all()
    summaries = []
    for session, log_count in rows:
        summaries.append(SessionSummary(
            id=session.id,
            vehicle_id=session.vehicle_id,
            start_time=session.start_time,
            end_time=session.end_time,
            parameters=session.parameters,
            notes=session.notes,
            log_count=log_count,
        ))
    return summaries


@router.post("", response_model=SessionSummary, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = LogSession(
        user_id=user.id,
        vehicle_id=body.vehicle_id,
        start_time=body.start_time,
        end_time=body.end_time,
        parameters=body.parameters,
        notes=body.notes,
    )
    db.add(session)
    await db.flush()
    return SessionSummary(
        id=session.id,
        vehicle_id=session.vehicle_id,
        start_time=session.start_time,
        end_time=session.end_time,
        parameters=session.parameters,
        notes=session.notes,
        log_count=0,
    )


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LogSession)
        .options(selectinload(LogSession.data_logs))
        .where(LogSession.id == session_id, LogSession.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionDetail(
        id=session.id,
        vehicle_id=session.vehicle_id,
        start_time=session.start_time,
        end_time=session.end_time,
        parameters=session.parameters,
        notes=session.notes,
        logs=[DataLogCreate(timestamp=log.timestamp, data=log.data) for log in session.data_logs],
    )


@router.put("/{session_id}", response_model=SessionSummary)
async def update_session(
    session_id: int,
    body: SessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LogSession).where(LogSession.id == session_id, LogSession.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.vehicle_id = body.vehicle_id
    session.end_time = body.end_time
    session.parameters = body.parameters
    session.notes = body.notes
    await db.flush()

    count_result = await db.execute(
        select(func.count(DataLog.id)).where(DataLog.session_id == session.id)
    )
    log_count = count_result.scalar() or 0

    return SessionSummary(
        id=session.id,
        vehicle_id=session.vehicle_id,
        start_time=session.start_time,
        end_time=session.end_time,
        parameters=session.parameters,
        notes=session.notes,
        log_count=log_count,
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LogSession).where(LogSession.id == session_id, LogSession.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)


@router.post("/{session_id}/logs", status_code=status.HTTP_201_CREATED)
async def bulk_create_logs(
    session_id: int,
    body: BulkDataLogCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LogSession).where(LogSession.id == session_id, LogSession.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    logs = [
        DataLog(session_id=session_id, timestamp=entry.timestamp, data=entry.data)
        for entry in body.logs
    ]
    db.add_all(logs)
    await db.flush()
    return {"created": len(logs)}


@router.get("/{session_id}/export")
async def export_session_csv(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LogSession)
        .options(selectinload(LogSession.data_logs))
        .where(LogSession.id == session_id, LogSession.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    all_keys: set[str] = set()
    for log in session.data_logs:
        all_keys.update(log.data.keys())
    sorted_keys = sorted(all_keys)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["timestamp"] + sorted_keys)

    for log in sorted(session.data_logs, key=lambda l: l.timestamp):
        row = [log.timestamp.isoformat()]
        for key in sorted_keys:
            row.append(str(log.data.get(key, "")))
        writer.writerow(row)

    output.seek(0)
    filename = f"session_{session_id}.csv"
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
