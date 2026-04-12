import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from web.customers.service import CustomerNotFoundError
from web.db import get_session as db_session
from web.sessions import service
from web.sessions.model import TranscriptEntryStatus
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
    customer_id: uuid.UUID
    therapist_id: int
    date: date
    session_number: int
    duration_minutes: Optional[int]
    notes: Optional[str]
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TranscriptEntryOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    status: TranscriptEntryStatus
    audio_files: list[str]
    transcript: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Session endpoints ---


@router.get("/customers/{customer_id}/sessions", response_model=list[SessionOut])
async def list_sessions(
    customer_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> list[SessionOut]:
    therapist_id = request.state.user["user_id"]
    sessions = await service.list_sessions(db, customer_id, therapist_id)
    return [SessionOut.model_validate(s) for s in sessions]


@router.post(
    "/customers/{customer_id}/sessions", response_model=SessionOut, status_code=201
)
async def create_session(
    customer_id: uuid.UUID,
    body: CreateSessionInput,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    therapist_id = request.state.user["user_id"]
    try:
        session = await service.create_session(db, customer_id, therapist_id, body)
    except CustomerNotFoundError:
        raise HTTPException(status_code=404, detail="customer not found")
    return SessionOut.model_validate(session)


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    therapist_id = request.state.user["user_id"]
    try:
        session = await service.get_session(db, session_id, therapist_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return SessionOut.model_validate(session)


@router.patch("/sessions/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: uuid.UUID,
    body: UpdateSessionInput,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    therapist_id = request.state.user["user_id"]
    try:
        session = await service.update_session(db, session_id, therapist_id, body)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return SessionOut.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> None:
    therapist_id = request.state.user["user_id"]
    try:
        await service.delete_session(db, session_id, therapist_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")


# --- Summary endpoint ---


@router.post("/sessions/{session_id}/summary/generate", response_model=SessionOut)
async def generate_summary(
    session_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> SessionOut:
    therapist_id = request.state.user["user_id"]
    try:
        session = await service.generate_session_summary(db, session_id, therapist_id)
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
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> list[TranscriptEntryOut]:
    therapist_id = request.state.user["user_id"]
    try:
        entries = await service.list_transcript_entries(db, session_id, therapist_id)
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return [TranscriptEntryOut.model_validate(e) for e in entries]


@router.post(
    "/sessions/{session_id}/transcript-entries",
    response_model=TranscriptEntryOut,
    status_code=201,
)
async def create_transcript_entry(
    session_id: uuid.UUID,
    body: CreateTranscriptEntryInput,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> TranscriptEntryOut:
    therapist_id = request.state.user["user_id"]
    try:
        entry = await service.create_transcript_entry(
            db, session_id, therapist_id, body
        )
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail="session not found")
    return TranscriptEntryOut.model_validate(entry)


@router.get("/session-transcript-entries/{entry_id}", response_model=TranscriptEntryOut)
async def get_transcript_entry(
    entry_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> TranscriptEntryOut:
    therapist_id = request.state.user["user_id"]
    try:
        entry = await service.get_transcript_entry(db, entry_id, therapist_id)
    except TranscriptEntryNotFoundError:
        raise HTTPException(status_code=404, detail="transcript entry not found")
    return TranscriptEntryOut.model_validate(entry)


@router.patch(
    "/session-transcript-entries/{entry_id}", response_model=TranscriptEntryOut
)
async def update_transcript_entry(
    entry_id: uuid.UUID,
    body: UpdateTranscriptEntryInput,
    request: Request,
    db: AsyncSession = Depends(db_session),
) -> TranscriptEntryOut:
    therapist_id = request.state.user["user_id"]
    try:
        entry = await service.update_transcript_entry(db, entry_id, therapist_id, body)
    except TranscriptEntryNotFoundError:
        raise HTTPException(status_code=404, detail="transcript entry not found")
    return TranscriptEntryOut.model_validate(entry)
