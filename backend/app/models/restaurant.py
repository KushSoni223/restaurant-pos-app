from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import TimestampMixin


class Restaurant(Base, TimestampMixin):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    scan_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    categories: Mapped[list["MenuCategory"]] = relationship(back_populates="restaurant")
    items: Mapped[list["MenuItem"]] = relationship(back_populates="restaurant")
    offers: Mapped[list["Offer"]] = relationship(back_populates="restaurant")
    tax_settings: Mapped["RestaurantTaxSettings | None"] = relationship(
        back_populates="restaurant", uselist=False
    )
    cms_pages: Mapped[list["CmsPage"]] = relationship(back_populates="restaurant")
