import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.menu import MenuCategory


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    WAITER = "WAITER"
    CHEF = "CHEF"
    ADMIN = "ADMIN"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# Areas (menu categories) a chef is skilled in — used for order routing.
chef_specialties = Table(
    "chef_specialties",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("menu_categories.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False),
        nullable=False,
        default=UserRole.CUSTOMER,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    # Whether a staff member is currently accepting work (on shift).
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False)

    specialties: Mapped[list["MenuCategory"]] = relationship(
        "MenuCategory",
        secondary=chef_specialties,
        lazy="selectin",
    )
