import uuid
from dataclasses import dataclass
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from web.clients.model import Client


class ClientNotFoundError(Exception):
    pass


@dataclass
class CreateClientInput:
    name: str
    email: str | None
    phone: str | None
    start_date: date


@dataclass
class UpdateClientInput:
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    start_date: date | None = None


async def list_clients(db: AsyncSession) -> list[Client]:
    result = await db.execute(select(Client).order_by(Client.created_at.desc()))
    return list(result.scalars().all())


async def create_client(db: AsyncSession, data: CreateClientInput) -> Client:
    client = Client(
        name=data.name,
        email=data.email,
        phone=data.phone,
        start_date=data.start_date,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


async def get_client(db: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await db.get(Client, client_id)
    if client is None:
        raise ClientNotFoundError(client_id)
    return client


async def update_client(
    db: AsyncSession, client_id: uuid.UUID, data: UpdateClientInput
) -> Client:
    client = await get_client(db, client_id)
    if data.name is not None:
        client.name = data.name
    if data.email is not None:
        client.email = data.email
    if data.phone is not None:
        client.phone = data.phone
    if data.start_date is not None:
        client.start_date = data.start_date
    client.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(client)
    return client


async def delete_client(db: AsyncSession, client_id: uuid.UUID) -> None:
    client = await get_client(db, client_id)
    await db.delete(client)
    await db.commit()
