from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import ForbiddenError
from app.models.order import OrderStatus
from app.models.user import UserRole
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.services.order import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
async def list_orders(
    session: DbSession,
    user: CurrentUser,
    restaurant_id: int | None = None,
    status: OrderStatus | None = None,
    customer_id: int | None = None,
) -> list[OrderRead]:
    if user.role == UserRole.CUSTOMER:
        customer_id = user.id
    elif user.role == UserRole.WAITER:
        if restaurant_id is None:
            raise ForbiddenError("Waiters must filter orders by restaurant_id")
    elif customer_id is not None and user.role not in (UserRole.ADMIN, UserRole.WAITER):
        raise ForbiddenError("Not allowed to filter orders by customer")

    orders = await OrderService(session).list_orders(
        restaurant_id=restaurant_id,
        status=status,
        customer_id=customer_id,
    )
    return [OrderRead.model_validate(order) for order in orders]


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: int,
    session: DbSession,
    user: CurrentUser,
) -> OrderRead:
    order = await OrderService(session).get_order(order_id)
    if user.role == UserRole.CUSTOMER and order.customer_id != user.id:
        raise ForbiddenError("Not allowed to view this order")
    return OrderRead.model_validate(order)


@router.post("", response_model=OrderRead, status_code=201)
async def create_order(payload: OrderCreate, session: DbSession) -> OrderRead:
    order = await OrderService(session).create_order(payload)
    return OrderRead.model_validate(order)


@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    session: DbSession,
    user: CurrentUser,
) -> OrderRead:
    if user.role == UserRole.CUSTOMER:
        raise ForbiddenError("Customers cannot update order status")
    acting_waiter_id = user.id if user.role == UserRole.WAITER else None
    order = await OrderService(session).update_status(
        order_id,
        payload.status,
        waiter_id=acting_waiter_id,
    )
    return OrderRead.model_validate(order)
