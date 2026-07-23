from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem, OrderStatus, RestaurantTable, TableStatus
from app.models.user import User, UserRole, chef_specialties
from app.schemas.order import OrderCreate
from app.services.table import TableService
from app.services.tax import TaxService

DEFAULT_TAX_RATE = Decimal("0.08")

ACTIVE_TABLE_STATUSES = (
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.SERVED,
)

# Statuses that still need kitchen work.
ACTIVE_KITCHEN_STATUSES = (
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
)


class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _pick_chef_for_category(self, category_id: int) -> User | None:
        """Least-loaded available chef whose specialty covers the category.

        Falls back to any available chef when nobody covers the area, so
        orders never get stuck unassigned while staff is on shift.
        """
        active_load = (
            select(OrderItem.chef_id, func.count(OrderItem.id).label("load"))
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.status.in_(ACTIVE_KITCHEN_STATUSES))
            .group_by(OrderItem.chef_id)
            .subquery()
        )

        def base_query():  # noqa: ANN202
            return (
                select(User)
                .outerjoin(active_load, active_load.c.chef_id == User.id)
                .where(
                    User.role == UserRole.CHEF,
                    User.is_active.is_(True),
                    User.is_available.is_(True),
                )
                .order_by(func.coalesce(active_load.c.load, 0), User.id)
            )

        specialist = await self.session.execute(
            base_query()
            .join(chef_specialties, chef_specialties.c.user_id == User.id)
            .where(chef_specialties.c.category_id == category_id)
            .limit(1)
        )
        chef = specialist.scalars().first()
        if chef is not None:
            return chef

        fallback = await self.session.execute(base_query().limit(1))
        return fallback.scalars().first()

    async def create_order(self, payload: OrderCreate) -> Order:
        if not payload.items:
            raise NotFoundError("Order must contain at least one item")

        menu_item_ids = [line.menu_item_id for line in payload.items]
        result = await self.session.execute(
            select(MenuItem).where(MenuItem.id.in_(menu_item_ids))
        )
        menu_items = {item.id: item for item in result.scalars().all()}
        missing = set(menu_item_ids) - set(menu_items)
        if missing:
            raise NotFoundError(f"Menu items not found: {sorted(missing)}")

        restaurant_id = payload.restaurant_id
        if restaurant_id is None:
            restaurant_id = next(iter(menu_items.values())).restaurant_id
        else:
            for menu_item in menu_items.values():
                if menu_item.restaurant_id != restaurant_id:
                    raise NotFoundError("All items must belong to the same restaurant")

        order = Order(
            restaurant_id=restaurant_id,
            table_id=payload.table_id,
            customer_id=payload.customer_id,
            waiter_id=payload.waiter_id,
            notes=payload.notes,
            status=OrderStatus.PENDING,
        )

        table: RestaurantTable | None = None
        if payload.table_id is not None:
            table = await self.session.get(RestaurantTable, payload.table_id)
            if table is None or table.restaurant_id != restaurant_id:
                raise NotFoundError("Table not found for this restaurant")

        subtotal = Decimal("0.00")
        for line in payload.items:
            menu_item = menu_items[line.menu_item_id]
            chef = await self._pick_chef_for_category(menu_item.category_id)
            subtotal += menu_item.price * line.quantity
            order.items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    quantity=line.quantity,
                    unit_price=menu_item.price,
                    notes=line.notes,
                    chef_id=chef.id if chef else None,
                )
            )

        order.subtotal = subtotal
        tax_settings = await TaxService(self.session).get_for_restaurant(restaurant_id)
        tax = Decimal("0.00")
        service_charge = Decimal("0.00")
        if tax_settings.tax_enabled:
            tax = (subtotal * tax_settings.tax_rate).quantize(Decimal("0.01"))
        if tax_settings.service_charge_enabled:
            service_charge = (subtotal * tax_settings.service_charge_rate).quantize(Decimal("0.01"))
        order.tax = tax
        order.total = order.subtotal + tax + service_charge

        if table is not None:
            table.status = TableStatus.OCCUPIED
            table.updated_at = datetime.now(UTC)

        self.session.add(order)
        await self.session.commit()
        if table is not None:
            await TableService(self.session).sync_table(table.id)
        return await self.get_order(order.id)

    async def _sync_table_status(self, table_id: int, *, force_release: bool = False) -> None:
        await TableService(self.session).sync_table(table_id, force_release=force_release)

    async def get_order(self, order_id: int) -> Order:
        result = await self.session.execute(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.table),
                selectinload(Order.customer),
                selectinload(Order.waiter),
            )
            .where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if order is None:
            raise NotFoundError("Order not found")
        return order

    async def list_orders(
        self,
        *,
        restaurant_id: int | None = None,
        status: OrderStatus | None = None,
        customer_id: int | None = None,
    ) -> list[Order]:
        query = (
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.table),
                selectinload(Order.customer),
                selectinload(Order.waiter),
            )
            .order_by(Order.created_at.desc())
        )
        if restaurant_id is not None:
            query = query.where(Order.restaurant_id == restaurant_id)
        if status is not None:
            query = query.where(Order.status == status)
        if customer_id is not None:
            query = query.where(Order.customer_id == customer_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def kitchen_queue(self, chef_id: int | None = None) -> list[Order]:
        query = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.menu_item),
                selectinload(Order.table),
                selectinload(Order.customer),
                selectinload(Order.waiter),
            )
            .where(Order.status.in_(ACTIVE_KITCHEN_STATUSES))
            .order_by(Order.created_at.asc())
        )
        if chef_id is not None:
            query = query.join(OrderItem, OrderItem.order_id == Order.id).where(
                OrderItem.chef_id == chef_id
            ).distinct()
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_status(
        self,
        order_id: int,
        status: OrderStatus,
        *,
        waiter_id: int | None = None,
    ) -> Order:
        order = await self.get_order(order_id)
        order.status = status
        if waiter_id is not None:
            order.waiter_id = waiter_id
        table_id = order.table_id
        await self.session.commit()

        if table_id is not None and status in (OrderStatus.PAID, OrderStatus.CANCELLED):
            await self._sync_table_status(table_id, force_release=True)
            await self.session.commit()

        return await self.get_order(order_id)
