from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.payment import PaymentMethod, PaymentStatus
from app.schemas.common import ORMModel


class PaymentCreate(BaseModel):
    order_id: int
    amount: Decimal = Field(gt=0, decimal_places=2)
    method: PaymentMethod
    reference: str | None = None


class PaymentRead(ORMModel):
    id: int
    order_id: int
    amount: Decimal
    method: PaymentMethod
    status: PaymentStatus
    reference: str | None = None
