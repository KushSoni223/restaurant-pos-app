from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class MenuCategoryCreate(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = None
    sort_order: int = 0


class MenuCategoryRead(ORMModel):
    id: int
    name: str
    description: str | None = None
    sort_order: int
    is_active: bool


class MenuItemCreate(BaseModel):
    category_id: int
    name: str = Field(max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, decimal_places=2)
    image_url: str | None = None


class MenuItemRead(ORMModel):
    id: int
    category_id: int
    name: str
    description: str | None = None
    price: Decimal
    is_available: bool
    image_url: str | None = None
