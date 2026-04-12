"""
Minimal example: Pydantic-as-DTO + model_fields_set for PATCH.

Run:  uv run fastapi dev patch_example.py
Try:
  POST   /items          {"name": "Laptop", "price": 999.0, "description": null}
  GET    /items/{id}
  PATCH  /items/{id}     {}                            -> nothing changes
  PATCH  /items/{id}     {"description": null}         -> clears description
  PATCH  /items/{id}     {"price": 799.0}              -> updates price only
"""

import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()


# ---------------------------------------------------------------------------
# Service layer — DTOs live here, controller imports them
# ---------------------------------------------------------------------------


class ItemNotFoundError(Exception):
    pass


class CreateItemInput(BaseModel):
    name: str
    price: float
    description: str | None = None


class UpdateItemInput(BaseModel):
    name: str | None = None
    price: float | None = None
    description: str | None = None


class ItemOut(BaseModel):
    id: str
    name: str
    price: float
    description: str | None


# In-memory store (stands in for a DB session)
_store: dict[str, dict[str, Any]] = {}


def create_item(data: CreateItemInput) -> ItemOut:
    item = {"id": str(uuid.uuid4()), **data.model_dump()}
    _store[item["id"]] = item
    return ItemOut(**item)


def get_item(item_id: str) -> ItemOut:
    item = _store.get(item_id)
    if item is None:
        raise ItemNotFoundError(item_id)
    return ItemOut(**item)


def update_item(item_id: str, data: UpdateItemInput) -> ItemOut:
    item = _store.get(item_id)
    if item is None:
        raise ItemNotFoundError(item_id)

    # Only touch fields that were explicitly present in the JSON payload.
    # "name" not in payload  → skip  (keep old value)
    # "description": null    → apply (clears the field)
    for field in data.model_fields_set:
        item[field] = getattr(data, field)

    return ItemOut(**item)


# ---------------------------------------------------------------------------
# Controller — thin, no business logic, no duplicate types
# ---------------------------------------------------------------------------


@app.post("/items", response_model=ItemOut, status_code=201)
def create(body: CreateItemInput) -> ItemOut:
    return create_item(body)


@app.get("/items/{item_id}", response_model=ItemOut)
def read(item_id: str) -> ItemOut:
    try:
        return get_item(item_id)
    except ItemNotFoundError:
        raise HTTPException(status_code=404, detail="item not found")


@app.patch("/items/{item_id}", response_model=ItemOut)
def update(item_id: str, body: UpdateItemInput) -> ItemOut:
    try:
        return update_item(item_id, body)
    except ItemNotFoundError:
        raise HTTPException(status_code=404, detail="item not found")
