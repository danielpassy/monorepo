import datetime

from web.customers import service as customer_service
from web.customers.service import CreateCustomerInput


async def test_list_customers_returns_empty(authed_client) -> None:
    response = await authed_client.get("/customers")
    assert response.status_code == 200
    assert response.json() == []


async def test_create_customer_returns_201(authed_client) -> None:
    response = await authed_client.post(
        "/customers",
        json={"name": "Ana Silva", "start_date": "2024-01-10"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ana Silva"
    assert data["start_date"] == "2024-01-10"
    assert "id" in data


async def test_get_customer_returns_200(authed_client, authed_user, db_session) -> None:
    user, _ = authed_user
    customer = await customer_service.create_customer(
        db_session,
        user.id,
        CreateCustomerInput(
            name="Bia Costa",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 3, 1),
        ),
    )
    response = await authed_client.get(f"/customers/{customer.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Bia Costa"


async def test_get_customer_returns_404_for_missing(authed_client) -> None:
    response = await authed_client.get(
        "/customers/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


async def test_patch_customer_updates_name(
    authed_client, authed_user, db_session
) -> None:
    user, _ = authed_user
    customer = await customer_service.create_customer(
        db_session,
        user.id,
        CreateCustomerInput(
            name="Old Name",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )
    response = await authed_client.patch(
        f"/customers/{customer.id}", json={"name": "New Name"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_delete_customer_returns_204(
    authed_client, authed_user, db_session
) -> None:
    user, _ = authed_user
    customer = await customer_service.create_customer(
        db_session,
        user.id,
        CreateCustomerInput(
            name="To Delete",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )
    response = await authed_client.delete(f"/customers/{customer.id}")
    assert response.status_code == 204


async def test_delete_customer_cascades_sessions(
    authed_client, authed_user, db_session
) -> None:
    from web.sessions import service as session_service
    from web.sessions.service import CreateSessionInput

    user, _ = authed_user
    customer = await customer_service.create_customer(
        db_session,
        user.id,
        CreateCustomerInput(
            name="With Sessions",
            email=None,
            phone=None,
            start_date=datetime.date(2024, 1, 1),
        ),
    )

    await session_service.create_session(
        db_session,
        customer.id,
        user.id,
        CreateSessionInput(date=datetime.date(2024, 5, 1)),
    )

    response = await authed_client.delete(f"/customers/{customer.id}")
    assert response.status_code == 204

    sessions = await session_service.list_sessions(db_session, customer.id, user.id)
    assert sessions == []
