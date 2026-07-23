from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

MenuSortOption = Literal["default", "price_asc", "price_desc", "name"]


class MenuItemFilterParams(BaseModel):
    category_id: int | None = None
    available_only: bool = False
    featured_only: bool = False
    dietary_tags: list[str] = Field(default_factory=list)
    max_price: Decimal | None = None
    min_price: Decimal | None = None
    search: str | None = None
    sort: MenuSortOption = "default"


class DietaryTagFacet(BaseModel):
    tag: str
    label: str
    count: int


class MenuPriceRange(BaseModel):
    min: Decimal
    max: Decimal


class MenuFilterFacetsRead(BaseModel):
    dietary_tags: list[DietaryTagFacet]
    price_range: MenuPriceRange
    featured_count: int
    available_count: int
    total_count: int
