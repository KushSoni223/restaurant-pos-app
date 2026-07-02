from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.payment import PaymentCreate, PaymentRead

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaymentRead])
async def list_payments(_session: DbSession) -> list[PaymentRead]:
    # TODO: implement via PaymentService
    return []


@router.post("", response_model=PaymentRead, status_code=201)
async def create_payment(_payload: PaymentCreate, _session: DbSession) -> PaymentRead:
    # TODO: implement via PaymentService
    raise NotImplementedError("Payment creation not implemented yet")
