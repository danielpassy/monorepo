import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from web.clients.service import ClientNotFoundError
from web.db import get_session as db_session
from web.sessions import service
from web.sessions.service import (
    CreateSessionInput,
    CreateTranscriptEntryInput,
    SessionNotFoundError,
    TranscriptEntryNotFoundError,
    UpdateSessionInput,
    UpdateTranscriptEntryInput,
)

router = APIRouter(tags=["sessions"])


class SessionOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    therapist_id: int
    date: date
    session_number: int
    duration_minutes: Optional[int]
    notes: Optional[str]
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateSessionBody(BaseModel):
    date: date
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class UpdateSessionBody(BaseModel):
    date: Optional[date] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    summary: Optional[str] = None


class TranscriptEntryOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    status: str
    audio_files: list[str]
    transcript: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateTranscriptEntryBody(BaseModel):
    audio_files: list[str] = []


class UpdateTranscriptEntryBody(BaseModel):
    status: Optional[str] = None
    audio_files: Optional[list[str]] = None
    transcript: Optional[str] = None


# --- Session endpoints ---


@router.get("/clients/{client_id}/sessions", response_model=list[SessionOut])
async def list_sessions(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(db_session),
) -> list[SessionOut]:
    sessions = await service.list_sessions(db, client_id)
    return [SessionOut.model_validate(s) for s in sessions]


@router.post(
    "/clients/{client_id}/sessions", response_model=SessionOut, status_code=201
)
async def create_session(
    client_id: uuid.UUID,
    body: CreateSessionBody,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    user = request.state.user
    data = CreateSessionInput(
        date=body.date,
        duration_minutes=body.duration_minutes,
        notes=body.notes,
    )
    try:
        session = await service.create_session(db, client_id, user["user_id"], data)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="client not found")
    return SessionOut.model_validate(session)


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    try:
        session = await service.get_session(db, session_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return SessionOut.model_validate(session)


@router.patch("/sessions/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: uuid.UUID,
    body: UpdateSessionBody,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    data = UpdateSessionInput(
        date=body.date,
        duration_minutes=body.duration_minutes,
        notes=body.notes,
        summary=body.summary,
    )
    try:
        session = await service.update_session(db, session_id, data)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return SessionOut.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(db_session),
) -> None:
    try:
        await service.delete_session(db, session_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")


# --- Summary endpoint ---


@router.post("/sessions/{session_id}/summary/generate", response_model=SessionOut)
async def generate_summary(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    try:
        session = await service.generate_session_summary(db, session_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return SessionOut.model_validate(session)


# --- Transcript entry endpoints ---


@router.get(
    "/sessions/{session_id}/transcript-entries",
    response_model=list[TranscriptEntryOut],
)
async def list_transcript_entries(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(db_session),
) -> list[TranscriptEntryOut]:
    entries = await service.list_transcript_entries(db, session_id)
    return [TranscriptEntryOut.model_validate(e) for e in entries]


@router.post(
    "/sessions/{session_id}/transcript-entries",
    response_model=TranscriptEntryOut,
    status_code=201,
)
async def create_transcript_entry(
    session_id: uuid.UUID,
    body: CreateTranscriptEntryBody,
    db: AsyncSession = Depends(db_session),
) -> TranscriptEntryOut:
    data = CreateTranscriptEntryInput(audio_files=body.audio_files)
    try:
        entry = await service.create_transcript_entry(db, session_id, data)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return TranscriptEntryOut.model_validate(entry)


@router.get("/session-transcript-entries/{entry_id}", response_model=TranscriptEntryOut)
async def get_transcript_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(db_session),
) -> TranscriptEntryOut:
    try:
        entry = await service.get_transcript_entry(db, entry_id)
    except TranscriptEntryNotFoundError:
        raise HTTPException(status_code=404, detail="transcript entry not found")
    return TranscriptEntryOut.model_validate(entry)


@router.patch(
    "/session-transcript-entries/{entry_id}", response_model=TranscriptEntryOut
)
async def update_transcript_entry(
    entry_id: uuid.UUID,
    body: UpdateTranscriptEntryBody,
    db: AsyncSession = Depends(db_session),
) -> TranscriptEntryOut:
    data = UpdateTranscriptEntryInput(
        status=body.status,
        audio_files=body.audio_files,
        transcript=body.transcript,
    )
    try:
        entry = await service.update_transcript_entry(db, entry_id, data)
    except TranscriptEntryNotFoundError:
        raise HTTPException(status_code=404, detail="transcript entry not found")
    return TranscriptEntryOut.model_validate(entry)
