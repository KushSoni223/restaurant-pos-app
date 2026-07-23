from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.order import OrderStatus, TableStatus
from app.schemas.common import ORMModel


class TableCreate(BaseModel):
    number: str = Field(max_length=20)
    capacity: int = Field(ge=1, default=2)


class TableRead(ORMModel):
    id: int
    restaurant_id: int | None = None
    number: str
    capacity: int
    status: TableStatus


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(ge=1, default=1)
    notes: str | None = None


class OrderItemRead(ORMModel):
    id: int
    menu_item_id: int
    menu_item_name: str | None = None
    quantity: int
    unit_price: Decimal
    notes: str | None = None
    chef_id: int | None = None


class OrderCreate(BaseModel):
    restaurant_id: int | None = None
    table_id: int | None = None
    customer_id: int | None = None
    waiter_id: int | None = None
    notes: str | None = None
    items: list[OrderItemCreate] = Field(default_factory=list)


class TableStatusUpdate(BaseModel):
    status: TableStatus


class OrderRead(ORMModel):
    id: int
    restaurant_id: int | None = None
    table_id: int | None = None
    table_number: str | None = None
    waiter_id: int | None = None
    waiter_name: str | None = None
    customer_id: int | None = None
    customer_name: str | None = None
    status: OrderStatus
    notes: str | None = None
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    items: list[OrderItemRead] = Field(default_factory=list)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
