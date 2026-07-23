from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class MenuCategoryCreate(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = None
    sort_order: int = 0


class MenuCategoryRead(ORMModel):
    id: int
    restaurant_id: int
    name: str
    description: str | None = None
    sort_order: int
    is_active: bool


class MenuCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class MenuItemCreate(BaseModel):
    category_id: int
    name: str = Field(max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, decimal_places=2)
    image_url: str | None = None
    dietary_tags: list[str] = Field(default_factory=list)
    is_featured: bool = False
    prep_time_minutes: int | None = Field(default=None, ge=1, le=240)


class MenuItemRead(ORMModel):
    id: int
    restaurant_id: int
    category_id: int
    name: str
    description: str | None = None
    price: Decimal
    is_available: bool
    image_url: str | None = None
    dietary_tags: list[str] = Field(default_factory=list)
    is_featured: bool = False
    prep_time_minutes: int | None = None


class MenuItemUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(default=None, max_length=150)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    is_available: bool | None = None
    image_url: str | None = None
    dietary_tags: list[str] | None = None
    is_featured: bool | None = None
    prep_time_minutes: int | None = Field(default=None, ge=1, le=240)


class RestaurantMenuRead(BaseModel):
    categories: list[MenuCategoryRead]
    items: list[MenuItemRead]
