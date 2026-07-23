from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import TimestampMixin

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


class RestaurantTaxSettings(Base, TimestampMixin):
    __tablename__ = "restaurant_tax_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id"), unique=True, nullable=False
    )
    tax_enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("0.08"), nullable=False)
    tax_label: Mapped[str] = mapped_column(String(50), default="Sales Tax", nullable=False)
    service_charge_enabled: Mapped[bool] = mapped_column(default=False, nullable=False)
    service_charge_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), default=Decimal("0.00"), nullable=False
    )
    service_charge_label: Mapped[str] = mapped_column(
        String(50), default="Service Charge", nullable=False
    )
    prices_include_tax: Mapped[bool] = mapped_column(default=False, nullable=False)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="tax_settings")
