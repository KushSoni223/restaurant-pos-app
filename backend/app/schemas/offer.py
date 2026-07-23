from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.offer import DiscountType, OfferScope
from app.schemas.common import ORMModel


class OfferCreate(BaseModel):
    badge_text: str = Field(default="TODAY'S SPECIAL", max_length=50)
    title: str = Field(max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    discount_type: DiscountType
    discount_value: Decimal = Field(gt=0)
    scope: OfferScope = OfferScope.RESTAURANT
    category_id: int | None = None
    menu_item_id: int | None = None
    valid_until_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    applies_dine_in: bool = True
    applies_takeaway: bool = True
    sort_order: int = 0

    @model_validator(mode="after")
    def validate_scope_targets(self) -> "OfferCreate":
        if self.scope == OfferScope.CATEGORY and self.category_id is None:
            raise ValueError("category_id is required for category-scoped offers")
        if self.scope == OfferScope.ITEM and self.menu_item_id is None:
            raise ValueError("menu_item_id is required for item-scoped offers")
        if self.scope == OfferScope.RESTAURANT:
            self.category_id = None
            self.menu_item_id = None
        if self.scope == OfferScope.CATEGORY:
            self.menu_item_id = None
        if self.discount_type == DiscountType.PERCENTAGE and self.discount_value > 100:
            raise ValueError("Percentage discount cannot exceed 100")
        return self


class OfferUpdate(BaseModel):
    badge_text: str | None = Field(default=None, max_length=50)
    title: str | None = Field(default=None, max_length=200)
    subtitle: str | None = Field(default=None, max_length=300)
    discount_type: DiscountType | None = None
    discount_value: Decimal | None = Field(default=None, gt=0)
    scope: OfferScope | None = None
    category_id: int | None = None
    menu_item_id: int | None = None
    valid_until_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    applies_dine_in: bool | None = None
    applies_takeaway: bool | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class OfferRead(ORMModel):
    id: int
    restaurant_id: int
    badge_text: str
    title: str
    subtitle: str | None = None
    discount_type: DiscountType
    discount_value: Decimal
    scope: OfferScope
    category_id: int | None = None
    menu_item_id: int | None = None
    valid_until_time: str | None = None
    applies_dine_in: bool
    applies_takeaway: bool
    is_active: bool
    sort_order: int
    category_name: str | None = None
    menu_item_name: str | None = None
