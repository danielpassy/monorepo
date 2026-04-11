import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from web.clients import service
from web.clients.service import (
    ClientNotFoundError,
    CreateClientInput,
    UpdateClientInput,
)
from web.db import get_session

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientOut(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    start_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateClientBody(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: date


class UpdateClientBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: Optional[date] = None


@router.get("", response_model=list[ClientOut])
async def list_clients(
    db: AsyncSession = Depends(get_session),
) -> list[ClientOut]:
    clients = await service.list_clients(db)
    return [ClientOut.model_validate(c) for c in clients]


@router.post("", response_model=ClientOut, status_code=201)
async def create_client(
    body: CreateClientBody,
    db: AsyncSession = Depends(get_session),
) -> ClientOut:
    data = CreateClientInput(
        name=body.name,
        email=body.email,
        phone=body.phone,
        start_date=body.start_date,
    )
    client = await service.create_client(db, data)
    return ClientOut.model_validate(client)


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> ClientOut:
    try:
        client = await service.get_client(db, client_id)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="client not found")
    return ClientOut.model_validate(client)


@router.patch("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: uuid.UUID,
    body: UpdateClientBody,
    db: AsyncSession = Depends(get_session),
) -> ClientOut:
    data = UpdateClientInput(
        name=body.name,
        email=body.email,
        phone=body.phone,
        start_date=body.start_date,
    )
    try:
        client = await service.update_client(db, client_id, data)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="client not found")
    return ClientOut.model_validate(client)


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> None:
    try:
        await service.delete_client(db, client_id)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="client not found")
