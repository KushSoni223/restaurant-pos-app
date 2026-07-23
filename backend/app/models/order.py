import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.menu import MenuItem
from app.models.user import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY = "READY"
    SERVED = "SERVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class TableStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    CLEANING = "CLEANING"


class RestaurantTable(Base, TimestampMixin):
    __tablename__ = "restaurant_tables"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int | None] = mapped_column(ForeignKey("restaurants.id"), nullable=True)
    number: Mapped[str] = mapped_column(String(20), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    status: Mapped[TableStatus] = mapped_column(
        Enum(TableStatus, name="table_status", native_enum=False),
        default=TableStatus.AVAILABLE,
        nullable=False,
    )

    orders: Mapped[list["Order"]] = relationship(back_populates="table")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int | None] = mapped_column(ForeignKey("restaurants.id"), nullable=True)
    table_id: Mapped[int | None] = mapped_column(ForeignKey("restaurant_tables.id"), nullable=True)
    waiter_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status", native_enum=False),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    table: Mapped["RestaurantTable | None"] = relationship(back_populates="orders")
    customer: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[customer_id],
    )
    waiter: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[waiter_id],
    )
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

    @property
    def table_number(self) -> str | None:
        return self.table.number if self.table else None

    @property
    def customer_name(self) -> str | None:
        if self.customer is None:
            return None
        return self.customer.name or self.customer.email

    @property
    def waiter_name(self) -> str | None:
        if self.waiter is None:
            return None
        return self.waiter.name or self.waiter.email


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Chef auto-assigned based on specialty area + availability.
    chef_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship(lazy="selectin")

    @property
    def menu_item_name(self) -> str | None:
        return self.menu_item.name if self.menu_item else None
