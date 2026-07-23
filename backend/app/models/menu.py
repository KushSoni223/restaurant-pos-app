from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import TimestampMixin

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


class MenuCategory(Base, TimestampMixin):
    __tablename__ = "menu_categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="categories")
    items: Mapped[list["MenuItem"]] = relationship(back_populates="category")


class MenuItem(Base, TimestampMixin):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("menu_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    dietary_tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    is_featured: Mapped[bool] = mapped_column(default=False, nullable=False)
    prep_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="items")
    category: Mapped["MenuCategory"] = relationship(back_populates="items")

