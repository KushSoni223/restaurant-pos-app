from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class TaxSettingsRead(ORMModel):
    id: int
    restaurant_id: int
    tax_enabled: bool
    tax_rate: Decimal
    tax_label: str
    service_charge_enabled: bool
    service_charge_rate: Decimal
    service_charge_label: str
    prices_include_tax: bool


class TaxSettingsUpdate(BaseModel):
    tax_enabled: bool | None = None
    tax_rate: Decimal | None = Field(default=None, ge=0, le=1)
    tax_label: str | None = Field(default=None, max_length=50)
    service_charge_enabled: bool | None = None
    service_charge_rate: Decimal | None = Field(default=None, ge=0, le=1)
    service_charge_label: str | None = Field(default=None, max_length=50)
    prices_include_tax: bool | None = None
