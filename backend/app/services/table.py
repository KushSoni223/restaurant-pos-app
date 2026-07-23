from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.order import Order, OrderStatus, RestaurantTable, TableStatus
from app.schemas.order import TableCreate
from app.services.restaurant import RestaurantService

# How long a table stays occupied without an active order before auto-release.
TABLE_HOLD_MINUTES = 3

ACTIVE_TABLE_STATUSES = (
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.SERVED,
)


class TableService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _active_order_counts(self, table_ids: list[int]) -> dict[int, int]:
        if not table_ids:
            return {}
        result = await self.session.execute(
            select(Order.table_id, func.count())
            .where(
                Order.table_id.in_(table_ids),
                Order.status.in_(ACTIVE_TABLE_STATUSES),
            )
            .group_by(Order.table_id)
        )
        return {int(table_id): int(count) for table_id, count in result.all()}

    async def _active_order_count(self, table_id: int) -> int:
        counts = await self._active_order_counts([table_id])
        return counts.get(table_id, 0)

    @staticmethod
    def _as_utc(moment: datetime) -> datetime:
        if moment.tzinfo is None:
            return moment.replace(tzinfo=UTC)
        return moment

    async def list_for_restaurant(
        self,
        restaurant_id: int,
        *,
        sync: bool = False,
    ) -> list[RestaurantTable]:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        if sync:
            await self.sync_statuses(restaurant_id=restaurant_id)
        result = await self.session.execute(
            select(RestaurantTable)
            .where(RestaurantTable.restaurant_id == restaurant_id)
            .order_by(RestaurantTable.number)
        )
        return list(result.scalars().all())

    async def get_by_id(self, table_id: int) -> RestaurantTable:
        table = await self.session.get(RestaurantTable, table_id)
        if table is None:
            raise NotFoundError("Table not found")
        return table

    async def hold_table(self, table_id: int) -> RestaurantTable:
        """Mark a table occupied when a guest selects it (scan / floor plan)."""
        table = await self.get_by_id(table_id)
        if table.status == TableStatus.CLEANING:
            raise ConflictError("Table is being cleaned and cannot be selected")

        table.status = TableStatus.OCCUPIED
        table.updated_at = datetime.now(UTC)
        await self.session.commit()
        await self.session.refresh(table)
        return table

    async def sync_table(self, table_id: int, *, force_release: bool = False) -> None:
        table = await self.get_by_id(table_id)
        active = await self._active_order_count(table_id)
        cutoff = datetime.now(UTC) - timedelta(minutes=TABLE_HOLD_MINUTES)

        if active > 0:
            table.status = TableStatus.OCCUPIED
        elif force_release:
            table.status = TableStatus.AVAILABLE
        elif table.status in (TableStatus.OCCUPIED, TableStatus.RESERVED):
            if self._as_utc(table.updated_at) <= cutoff:
                table.status = TableStatus.AVAILABLE

        await self.session.commit()

    async def sync_statuses(self, restaurant_id: int | None = None) -> int:
        """Align all tables: occupied when orders exist, release stale holds."""
        query = select(RestaurantTable)
        if restaurant_id is not None:
            query = query.where(RestaurantTable.restaurant_id == restaurant_id)

        result = await self.session.execute(query)
        tables = list(result.scalars().all())
        if not tables:
            return 0

        active_counts = await self._active_order_counts([table.id for table in tables])
        cutoff = datetime.now(UTC) - timedelta(minutes=TABLE_HOLD_MINUTES)
        changed = 0

        for table in tables:
            active = active_counts.get(table.id, 0)
            if active > 0:
                if table.status != TableStatus.OCCUPIED:
                    table.status = TableStatus.OCCUPIED
                    changed += 1
                continue

            if table.status in (TableStatus.OCCUPIED, TableStatus.RESERVED):
                if self._as_utc(table.updated_at) <= cutoff:
                    table.status = TableStatus.AVAILABLE
                    changed += 1

        if changed:
            await self.session.commit()
        return changed

    async def update_status(self, table_id: int, status: TableStatus) -> RestaurantTable:
        table = await self.get_by_id(table_id)
        table.status = status
        await self.session.commit()
        await self.session.refresh(table)
        return table

    async def create_table(self, restaurant_id: int, payload: TableCreate) -> RestaurantTable:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        existing = await self.session.execute(
            select(RestaurantTable).where(
                RestaurantTable.restaurant_id == restaurant_id,
                RestaurantTable.number == payload.number.strip(),
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ConflictError("A table with this number already exists")

        table = RestaurantTable(
            restaurant_id=restaurant_id,
            number=payload.number.strip(),
            capacity=payload.capacity,
            status=TableStatus.AVAILABLE,
        )
        self.session.add(table)
        await self.session.commit()
        await self.session.refresh(table)
        return table
