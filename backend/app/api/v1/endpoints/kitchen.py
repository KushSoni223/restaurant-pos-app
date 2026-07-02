from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.order import OrderRead

router = APIRouter(prefix="/kitchen", tags=["kitchen"])


@router.get("/queue", response_model=list[OrderRead])
async def kitchen_queue(_session: DbSession) -> list[OrderRead]:
    # TODO: return orders in PREPARING / CONFIRMED status for chef KDS
    return []
