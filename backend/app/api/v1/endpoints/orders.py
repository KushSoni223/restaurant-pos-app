from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
async def list_orders(_session: DbSession) -> list[OrderRead]:
    # TODO: implement via OrderService
    return []


@router.post("", response_model=OrderRead, status_code=201)
async def create_order(_payload: OrderCreate, _session: DbSession) -> OrderRead:
    # TODO: implement via OrderService
    raise NotImplementedError("Order creation not implemented yet")


@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: int,
    _payload: OrderStatusUpdate,
    _session: DbSession,
) -> OrderRead:
    # TODO: implement via OrderService
    raise NotImplementedError(f"Order status update not implemented for order {order_id}")
