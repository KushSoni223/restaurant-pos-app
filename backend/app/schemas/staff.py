from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.common import ORMModel
from app.schemas.menu import MenuCategoryRead


class StaffCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole = UserRole.CHEF
    # Menu category IDs the chef specializes in (e.g. Starters, Desserts).
    specialty_category_ids: list[int] = Field(default_factory=list)


class StaffRead(ORMModel):
    id: int
    name: str | None = None
    email: str
    role: UserRole
    is_active: bool
    is_available: bool
    specialties: list[MenuCategoryRead] = Field(default_factory=list)


class StaffAvailabilityUpdate(BaseModel):
    is_available: bool


class StaffUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    role: UserRole | None = None
    is_active: bool | None = None
    is_available: bool | None = None
