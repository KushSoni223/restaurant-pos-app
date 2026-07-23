import enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.user import TimestampMixin

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant


class CmsPageType(str, enum.Enum):
    ABOUT = "ABOUT"
    TERMS = "TERMS"
    PRIVACY = "PRIVACY"
    FAQ = "FAQ"
    CUSTOM = "CUSTOM"


class CmsPage(Base, TimestampMixin):
    __tablename__ = "cms_pages"
    __table_args__ = (UniqueConstraint("restaurant_id", "slug", name="uq_cms_pages_restaurant_slug"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    page_type: Mapped[CmsPageType] = mapped_column(
        Enum(CmsPageType, name="cms_page_type", native_enum=False),
        nullable=False,
        default=CmsPageType.CUSTOM,
    )
    is_published: Mapped[bool] = mapped_column(default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="cms_pages")
