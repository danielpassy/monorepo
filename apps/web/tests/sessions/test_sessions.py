import datetime

from web.auth.model import User
from web.customers import service as customer_service
from web.customers.service import CreateCustomerInput
from web.sessions import service as session_service
from web.sessions.service import CreateSessionInput, CreateTranscriptEntryInput


async def _make_customer(db_session):
    return await customer_service.create_customer(
        db_session,
        CreateCustomerInput(
            name="Test Customer",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )


async def _make_user(db_session):
    user = User(
        email="therapist@example.com",
        name="Therapist",
        google_id="g-therapist-sessions",
    )
    db_session.add(user)
    await db_session.commit()
    return user


async def test_create_session_assigns_session_number(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    response = await authed_client.post(
        f"/customers/{customer.id}/sessions",
        json={"date": "2024-06-01"},
    )
    assert response.status_code == 201
    assert response.json()["session_number"] == 1


async def test_create_session_increments_session_number(
    authed_client, db_session
) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)

    await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 6, 1)),
    )

    response = await authed_client.post(
        f"/customers/{customer.id}/sessions",
        json={"date": "2024-06-08"},
    )
    assert response.status_code == 201
    assert response.json()["session_number"] == 2


async def test_list_sessions_ordered_by_number_desc(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)

    for day in [1, 8, 15]:
        await session_service.create_session(
            db_session,
            customer.id,
            user.id,
            CreateSessionInput(date=datetime.date(2024, 6, day)),
        )

    response = await authed_client.get(f"/customers/{customer.id}/sessions")
    assert response.status_code == 200
    numbers = [s["session_number"] for s in response.json()]
    assert numbers == sorted(numbers, reverse=True)


async def test_get_session_returns_404_for_missing(authed_client) -> None:
    response = await authed_client.get("/sessions/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


async def test_patch_session_updates_notes(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)
    session = await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 6, 1)),
    )

    response = await authed_client.patch(
        f"/sessions/{session.id}", json={"notes": "Updated notes"}
    )
    assert response.status_code == 200
    assert response.json()["notes"] == "Updated notes"


async def test_delete_session_returns_204(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)
    session = await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 6, 1)),
    )

    response = await authed_client.delete(f"/sessions/{session.id}")
    assert response.status_code == 204


async def test_generate_summary_from_notes(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)
    session = await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(
            date=datetime.date(2024, 6, 1), notes="Important clinical notes."
        ),
    )

    response = await authed_client.post(f"/sessions/{session.id}/summary/generate")
    assert response.status_code == 200
    assert response.json()["summary"] is not None
    assert "Important clinical notes." in response.json()["summary"]


async def test_create_transcript_entry_returns_201(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)
    session = await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 6, 1)),
    )

    response = await authed_client.post(
        f"/sessions/{session.id}/transcript-entries",
        json={"audio_files": ["file1.wav"]},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "waiting_to_be_processed"
    assert data["audio_files"] == ["file1.wav"]


async def test_list_transcript_entries(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)
    session = await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 6, 1)),
    )
    await session_service.create_transcript_entry(
        db_session, session.id, CreateTranscriptEntryInput(audio_files=[])
    )

    response = await authed_client.get(f"/sessions/{session.id}/transcript-entries")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_patch_transcript_entry_updates_status(authed_client, db_session) -> None:
    customer = await _make_customer(db_session)
    user = await _make_user(db_session)
    session = await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 6, 1)),
    )
    entry = await session_service.create_transcript_entry(
        db_session, session.id, CreateTranscriptEntryInput(audio_files=[])
    )

    response = await authed_client.patch(
        f"/session-transcript-entries/{entry.id}",
        json={"status": "processed", "transcript": "Hello world."},
        params={"session_id": str(session.id)},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "processed"
    assert response.json()["transcript"] == "Hello world."
