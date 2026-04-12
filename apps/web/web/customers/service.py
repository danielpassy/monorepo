import uuid
from datetime import date, datetime, timezone

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from web.customers.model import Customer


class CustomerNotFoundError(Exception):
    pass


class CreateCustomerInput(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    start_date: date


class UpdateCustomerInput(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    start_date: date | None = None


async def list_customers(db: AsyncSession) -> list[Customer]:
    result = await db.execute(select(Customer).order_by(Customer.created_at.desc()))
    return list(result.scalars().all())


async def create_customer(db: AsyncSession, data: CreateCustomerInput) -> Customer:
    customer = Customer(
        name=data.name,
        email=data.email,
        phone=data.phone,
        start_date=data.start_date,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


async def get_customer(db: AsyncSession, customer_id: uuid.UUID) -> Customer:
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise CustomerNotFoundError(customer_id)
    return customer


async def update_customer(
    db: AsyncSession, customer_id: uuid.UUID, data: UpdateCustomerInput
) -> Customer:
    customer = await get_customer(db, customer_id)
    for field in data.model_fields_set:
        setattr(customer, field, getattr(data, field))
    customer.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(customer)
    return customer


async def delete_customer(db: AsyncSession, customer_id: uuid.UUID) -> None:
    customer = await get_customer(db, customer_id)
    await db.delete(customer)
    await db.commit()
