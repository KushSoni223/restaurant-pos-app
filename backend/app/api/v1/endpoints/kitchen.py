from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.order import OrderRead
from app.services.order import OrderService

router = APIRouter(prefix="/kitchen", tags=["kitchen"])


@router.get("/queue", response_model=list[OrderRead])
async def kitchen_queue(session: DbSession, chef_id: int | None = None) -> list[OrderRead]:
    """Active orders for the kitchen. Pass chef_id to see one chef's assigned queue."""
    orders = await OrderService(session).kitchen_queue(chef_id=chef_id)
    return [OrderRead.model_validate(order) for order in orders]
