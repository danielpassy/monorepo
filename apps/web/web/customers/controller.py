import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from web.customers import service
from web.customers.service import (
    CreateCustomerInput,
    CustomerNotFoundError,
    UpdateCustomerInput,
)
from web.db import get_session

router = APIRouter(prefix="/customers", tags=["customers"])


class CustomerOut(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    start_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CustomerOut])
async def list_customers(
    db: AsyncSession = Depends(get_session),
) -> list[CustomerOut]:
    customers = await service.list_customers(db)
    return [CustomerOut.model_validate(c) for c in customers]


@router.post("", response_model=CustomerOut, status_code=201)
async def create_customer(
    body: CreateCustomerInput,
    db: AsyncSession = Depends(get_session),
) -> CustomerOut:
    customer = await service.create_customer(db, body)
    return CustomerOut.model_validate(customer)


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> CustomerOut:
    try:
        customer = await service.get_customer(db, customer_id)
    except CustomerNotFoundError:
        raise HTTPException(status_code=404, detail="customer not found")
    return CustomerOut.model_validate(customer)


@router.patch("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: uuid.UUID,
    body: UpdateCustomerInput,
    db: AsyncSession = Depends(get_session),
) -> CustomerOut:
    try:
        customer = await service.update_customer(db, customer_id, body)
    except CustomerNotFoundError:
        raise HTTPException(status_code=404, detail="customer not found")
    return CustomerOut.model_validate(customer)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> None:
    try:
        await service.delete_customer(db, customer_id)
    except CustomerNotFoundError:
        raise HTTPException(status_code=404, detail="customer not found")
