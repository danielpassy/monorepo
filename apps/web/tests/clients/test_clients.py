import datetime

from web.clients import service as client_service
from web.clients.service import CreateClientInput


async def test_list_clients_returns_empty(authed_client) -> None:
    response = await authed_client.get("/clients")
    assert response.status_code == 200
    assert response.json() == []


async def test_create_client_returns_201(authed_client) -> None:
    response = await authed_client.post(
        "/clients",
        json={"name": "Ana Silva", "start_date": "2024-01-10"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ana Silva"
    assert data["start_date"] == "2024-01-10"
    assert "id" in data


async def test_get_client_returns_200(authed_client, db_session) -> None:
    client = await client_service.create_client(
        db_session,
        CreateClientInput(
            name="Bia Costa",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 3, 1),
        ),
    )
    response = await authed_client.get(f"/clients/{client.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Bia Costa"


async def test_get_client_returns_404_for_missing(authed_client) -> None:
    response = await authed_client.get("/clients/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


async def test_patch_client_updates_name(authed_client, db_session) -> None:
    client = await client_service.create_client(
        db_session,
        CreateClientInput(
            name="Old Name",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )
    response = await authed_client.patch(
        f"/clients/{client.id}", json={"name": "New Name"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_delete_client_returns_204(authed_client, db_session) -> None:
    client = await client_service.create_client(
        db_session,
        CreateClientInput(
            name="To Delete",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )
    response = await authed_client.delete(f"/clients/{client.id}")
    assert response.status_code == 204


async def test_delete_client_cascades_sessions(authed_client, db_session) -> None:
    from web.sessions import service as session_service
    from web.sessions.service import CreateSessionInput

    client = await client_service.create_client(
        db_session,
        CreateClientInput(
            name="With Sessions",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )
    from web.auth.model import User

    user = User(email="cascade@example.com", name="Cascade User", google_id="g-cascade")
    db_session.add(user)
    await db_session.commit()

    await session_service.create_session(
        db_session,
        client.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 5, 1)),
    )

    response = await authed_client.delete(f"/clients/{client.id}")
    assert response.status_code == 204

    sessions = await session_service.list_sessions(db_session, client.id)
    assert sessions == []
