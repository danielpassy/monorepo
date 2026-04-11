import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from web.clients.service import get_client
from web.sessions.model import Session, SessionTranscriptEntry


class SessionNotFoundError(Exception):
    pass


class TranscriptEntryNotFoundError(Exception):
    pass


@dataclass
class CreateSessionInput:
    date: date
    duration_minutes: int | None = None
    notes: str | None = None


@dataclass
class UpdateSessionInput:
    date: date | None = None
    duration_minutes: int | None = None
    notes: str | None = None
    summary: str | None = None


@dataclass
class CreateTranscriptEntryInput:
    audio_files: list[str] = field(default_factory=list)


@dataclass
class UpdateTranscriptEntryInput:
    status: str | None = None
    audio_files: list[str] | None = None
    transcript: str | None = None


async def list_sessions(db: AsyncSession, client_id: uuid.UUID) -> list[Session]:
    result = await db.execute(
        select(Session)
        .where(Session.client_id == client_id)
        .order_by(Session.session_number.desc())
    )
    return list(result.scalars().all())


async def create_session(
    db: AsyncSession,
    client_id: uuid.UUID,
    therapist_id: int,
    data: CreateSessionInput,
) -> Session:
    await get_client(db, client_id)

    result = await db.execute(
        select(func.max(Session.session_number)).where(Session.client_id == client_id)
    )
    max_num = result.scalar() or 0

    session = Session(
        client_id=client_id,
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
    if data.date is not None:
        session.date = data.date
    if data.duration_minutes is not None:
        session.duration_minutes = data.duration_minutes
    if data.notes is not None:
        session.notes = data.notes
    if data.summary is not None:
        session.summary = data.summary
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(session)
    return session


async def delete_session(db: AsyncSession, session_id: uuid.UUID) -> None:
    session = await get_session(db, session_id)
    await db.delete(session)
    await db.commit()


async def list_transcript_entries(
    db: AsyncSession, session_id: uuid.UUID
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
    if data.status is not None:
        entry.status = data.status
    if data.audio_files is not None:
        entry.audio_files = data.audio_files
    if data.transcript is not None:
        entry.transcript = data.transcript
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
