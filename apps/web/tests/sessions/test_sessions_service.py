import datetime

from web.auth.model import User
from web.clients import service as client_service
from web.clients.service import CreateClientInput
from web.sessions import service as session_service
from web.sessions.service import (
    CreateSessionInput,
    CreateTranscriptEntryInput,
    SessionNotFoundError,
    generate_session_summary,
)
import pytest


async def _setup(db_session):
    client = await client_service.create_client(
        db_session,
        CreateClientInput(
            name="Service Test Client",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )
    user = User(email="svc@example.com", name="Svc User", google_id="g-svc-test")
    db_session.add(user)
    await db_session.commit()
    return client, user


async def test_create_session_calculates_session_number(db_session) -> None:
    client, user = await _setup(db_session)

    s1 = await session_service.create_session(
        db_session,
        client.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 1, 1)),
    )
    s2 = await session_service.create_session(
        db_session,
        client.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 1, 8)),
    )

    assert s1.session_number == 1
    assert s2.session_number == 2


async def test_delete_session_cascades_transcript_entries(db_session) -> None:
    client, user = await _setup(db_session)
    session = await session_service.create_session(
        db_session,
        client.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 1, 1)),
    )
    await session_service.create_transcript_entry(
        db_session, session.id, CreateTranscriptEntryInput(audio_files=[])
    )

    await session_service.delete_session(db_session, session.id)

    with pytest.raises(SessionNotFoundError):
        await session_service.get_session(db_session, session.id)


async def test_generate_summary_uses_notes_and_transcripts(db_session) -> None:
    client, user = await _setup(db_session)
    session = await session_service.create_session(
        db_session,
        client.id,
        user.id,
        CreateSessionInput(
            date=datetime.date(2024, 1, 1), notes="Clinical notes here."
        ),
    )
    entry = await session_service.create_transcript_entry(
        db_session, session.id, CreateTranscriptEntryInput(audio_files=[])
    )
    from web.sessions.service import UpdateTranscriptEntryInput, update_transcript_entry

    await update_transcript_entry(
        db_session,
        entry.id,
        UpdateTranscriptEntryInput(
            status="processed", transcript="Patient said hello."
        ),
    )

    updated = await generate_session_summary(db_session, session.id)

    assert updated.summary is not None
    assert "Clinical notes here." in updated.summary
    assert "Patient said hello." in updated.summary


async def test_update_transcript_entry_updates_status(db_session) -> None:
    client, user = await _setup(db_session)
    session = await session_service.create_session(
        db_session,
        client.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 1, 1)),
    )
    entry = await session_service.create_transcript_entry(
        db_session, session.id, CreateTranscriptEntryInput(audio_files=["a.wav"])
    )

    from web.sessions.service import UpdateTranscriptEntryInput, update_transcript_entry

    updated = await update_transcript_entry(
        db_session,
        entry.id,
        UpdateTranscriptEntryInput(status="processing"),
    )

    assert updated.status == "processing"
    assert updated.audio_files == ["a.wav"]
