import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import TimestampMixin

if TYPE_CHECKING:
    from app.models.menu import MenuCategory, MenuItem
    from app.models.restaurant import Restaurant


class OfferScope(str, enum.Enum):
    RESTAURANT = "RESTAURANT"
    CATEGORY = "CATEGORY"
    ITEM = "ITEM"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


class Offer(Base, TimestampMixin):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), nullable=False)
    badge_text: Mapped[str] = mapped_column(String(50), nullable=False, default="TODAY'S SPECIAL")
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300), nullable=True)
    discount_type: Mapped[DiscountType] = mapped_column(
        Enum(DiscountType, name="discount_type", native_enum=False),
        nullable=False,
    )
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    scope: Mapped[OfferScope] = mapped_column(
        Enum(OfferScope, name="offer_scope", native_enum=False),
        nullable=False,
        default=OfferScope.RESTAURANT,
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("menu_categories.id"), nullable=True
    )
    menu_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("menu_items.id"), nullable=True
    )
    valid_until_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    applies_dine_in: Mapped[bool] = mapped_column(default=True, nullable=False)
    applies_takeaway: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="offers")
    category: Mapped["MenuCategory | None"] = relationship()
    menu_item: Mapped["MenuItem | None"] = relationship()
