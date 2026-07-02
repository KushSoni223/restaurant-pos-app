from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.order import OrderStatus, TableStatus
from app.schemas.common import ORMModel


class TableCreate(BaseModel):
    number: str = Field(max_length=20)
    capacity: int = Field(ge=1, default=2)


class TableRead(ORMModel):
    id: int
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
    quantity: int
    unit_price: Decimal
    notes: str | None = None


class OrderCreate(BaseModel):
    table_id: int | None = None
    customer_id: int | None = None
    notes: str | None = None
    items: list[OrderItemCreate] = Field(default_factory=list)


class OrderRead(ORMModel):
    id: int
    table_id: int | None = None
    waiter_id: int | None = None
    customer_id: int | None = None
    status: OrderStatus
    notes: str | None = None
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    items: list[OrderItemRead] = Field(default_factory=list)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
