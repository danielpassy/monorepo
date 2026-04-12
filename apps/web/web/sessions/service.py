import uuid
from datetime import date, datetime, timezone

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from web.customers.service import get_customer
from web.sessions.model import Session, SessionTranscriptEntry


class SessionNotFoundError(Exception):
    pass


class TranscriptEntryNotFoundError(Exception):
    pass


class CreateSessionInput(BaseModel):
    date: date
    duration_minutes: int | None = None
    notes: str | None = None


class UpdateSessionInput(BaseModel):
    date: date | None = None
    duration_minutes: int | None = None
    notes: str | None = None
    summary: str | None = None


class CreateTranscriptEntryInput(BaseModel):
    audio_files: list[str] = []


class UpdateTranscriptEntryInput(BaseModel):
    status: str | None = None
    audio_files: list[str] | None = None
    transcript: str | None = None


async def list_sessions(db: AsyncSession, customer_id: uuid.UUID) -> list[Session]:
    result = await db.execute(
        select(Session)
        .where(Session.customer_id == customer_id)
        .order_by(Session.session_number.desc())
    )
    return list(result.scalars().all())


async def create_session(
    db: AsyncSession,
    customer_id: uuid.UUID,
    therapist_id: int,
    data: CreateSessionInput,
) -> Session:
    await get_customer(db, customer_id)

    result = await db.execute(
        select(func.max(Session.session_number)).where(
            Session.customer_id == customer_id
        )
    )
    max_num = result.scalar() or 0

    session = Session(
        customer_id=customer_id,
        therapist_id=therapist_id,
        date=data.date,
        session_number=max_num + 1,
        duration_minutes=data.duration_minutes,
        notes=data.notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: uuid.UUID) -> Session:
    session = await db.get(Session, session_id)
    if session is None:
        raise SessionNotFoundError(session_id)
    return session


async def update_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    data: UpdateSessionInput,
) -> Session:
    session = await get_session(db, session_id)
    for field in data.model_fields_set:
        setattr(session, field, getattr(data, field))
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(session)
    return session


async def delete_session(db: AsyncSession, session_id: uuid.UUID) -> None:
    session = await get_session(db, session_id)
    await db.delete(session)
    await db.commit()


async def list_transcript_entries(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[SessionTranscriptEntry]:
    result = await db.execute(
        select(SessionTranscriptEntry)
        .where(SessionTranscriptEntry.session_id == session_id)
        .order_by(SessionTranscriptEntry.created_at.asc())
    )
    return list(result.scalars().all())


async def create_transcript_entry(
    db: AsyncSession,
    session_id: uuid.UUID,
    data: CreateTranscriptEntryInput,
) -> SessionTranscriptEntry:
    await get_session(db, session_id)

    entry = SessionTranscriptEntry(
        session_id=session_id,
        status="waiting_to_be_processed",
        audio_files=data.audio_files,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_transcript_entry(
    db: AsyncSession, entry_id: uuid.UUID
) -> SessionTranscriptEntry:
    entry = await db.get(SessionTranscriptEntry, entry_id)
    if entry is None:
        raise TranscriptEntryNotFoundError(entry_id)
    return entry


async def update_transcript_entry(
    db: AsyncSession,
    entry_id: uuid.UUID,
    data: UpdateTranscriptEntryInput,
) -> SessionTranscriptEntry:
    entry = await get_transcript_entry(db, entry_id)
    for field in data.model_fields_set:
        setattr(entry, field, getattr(data, field))
    entry.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(entry)
    return entry


async def generate_session_summary(db: AsyncSession, session_id: uuid.UUID) -> Session:
    session = await get_session(db, session_id)
    entries = await list_transcript_entries(db, session_id)

    parts: list[str] = []
    if session.notes:
        parts.append(f"Notas clínicas:\n{session.notes}")

    processed = [e for e in entries if e.status == "processed" and e.transcript]
    if processed:
        transcript_text = "\n\n".join(e.transcript for e in processed if e.transcript)
        parts.append(f"Transcrição:\n{transcript_text}")

    if not parts:
        summary = "Nenhum conteúdo disponível para gerar resumo."
    else:
        summary = "\n\n".join(parts)

    session.summary = summary
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(session)
    return session
