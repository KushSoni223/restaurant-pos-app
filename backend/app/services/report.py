from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import MenuItem
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.report import DailyReportRow, DashboardRecentOrder, DashboardSummary, ReportsSummary

COMPLETED_STATUSES = (OrderStatus.PAID, OrderStatus.SERVED)
STAFF_ROLES = (UserRole.CHEF, UserRole.WAITER, UserRole.ADMIN)


def _pct_change(current: Decimal | int, previous: Decimal | int) -> float | None:
    current_val = float(current)
    previous_val = float(previous)
    if previous_val == 0:
        if current_val == 0:
            return None
        return 100.0
    return round(((current_val - previous_val) / previous_val) * 100, 1)


class ReportService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _aggregate_range(
        self,
        restaurant_id: int,
        start: date,
        end: date,
    ) -> tuple[int, Decimal]:
        result = await self.session.execute(
            select(
                func.count(Order.id),
                func.coalesce(func.sum(Order.total), 0),
            ).where(
                Order.restaurant_id == restaurant_id,
                Order.status.in_(COMPLETED_STATUSES),
                cast(Order.created_at, Date) >= start,
                cast(Order.created_at, Date) <= end,
            )
        )
        orders, revenue = result.one()
        return int(orders), Decimal(str(revenue))

    async def _daily_breakdown(
        self,
        restaurant_id: int,
        start: date,
        end: date,
    ) -> dict[date, tuple[int, Decimal]]:
        day_col = cast(Order.created_at, Date).label("day")
        result = await self.session.execute(
            select(
                day_col,
                func.count(Order.id),
                func.coalesce(func.sum(Order.total), 0),
            )
            .where(
                Order.restaurant_id == restaurant_id,
                Order.status.in_(COMPLETED_STATUSES),
                day_col >= start,
                day_col <= end,
            )
            .group_by(day_col)
            .order_by(day_col)
        )
        return {
            row.day: (int(row[1]), Decimal(str(row[2])))
            for row in result.all()
        }

    async def weekly_summary(self, restaurant_id: int) -> ReportsSummary:
        today = datetime.now(UTC).date()
        current_start = today - timedelta(days=6)
        previous_end = current_start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=6)

        current_orders, current_revenue = await self._aggregate_range(
            restaurant_id, current_start, today
        )
        previous_orders, previous_revenue = await self._aggregate_range(
            restaurant_id, previous_start, previous_end
        )

        daily_map = await self._daily_breakdown(restaurant_id, current_start, today)

        daily: list[DailyReportRow] = []
        best_day_label: str | None = None
        best_day_revenue = Decimal("0.00")

        cursor = current_start
        while cursor <= today:
            orders, revenue = daily_map.get(cursor, (0, Decimal("0.00")))
            avg = (revenue / orders).quantize(Decimal("0.01")) if orders else Decimal("0.00")
            label = cursor.strftime("%a")
            daily.append(
                DailyReportRow(
                    date=label,
                    orders=orders,
                    revenue=revenue,
                    avg_order_value=avg,
                )
            )
            if revenue > best_day_revenue:
                best_day_revenue = revenue
                best_day_label = label
            cursor += timedelta(days=1)

        avg_order_value = (
            (current_revenue / current_orders).quantize(Decimal("0.01"))
            if current_orders
            else Decimal("0.00")
        )

        return ReportsSummary(
            total_orders=current_orders,
            total_revenue=current_revenue,
            avg_order_value=avg_order_value,
            best_day_label=best_day_label if best_day_revenue > 0 else None,
            best_day_revenue=best_day_revenue,
            orders_change_percent=_pct_change(current_orders, previous_orders),
            revenue_change_percent=_pct_change(current_revenue, previous_revenue),
            daily=daily,
        )

    async def _count_orders_for_day(self, restaurant_id: int, day: date) -> int:
        result = await self.session.execute(
            select(func.count(Order.id)).where(
                Order.restaurant_id == restaurant_id,
                cast(Order.created_at, Date) == day,
            )
        )
        return int(result.scalar_one())

    async def _status_counts_for_day(
        self, restaurant_id: int, day: date
    ) -> dict[OrderStatus, int]:
        result = await self.session.execute(
            select(Order.status, func.count(Order.id))
            .where(
                Order.restaurant_id == restaurant_id,
                cast(Order.created_at, Date) == day,
            )
            .group_by(Order.status)
        )
        return {row[0]: int(row[1]) for row in result.all()}

    async def _revenue_for_day(self, restaurant_id: int, day: date) -> Decimal:
        result = await self.session.execute(
            select(func.coalesce(func.sum(Order.total), 0)).where(
                Order.restaurant_id == restaurant_id,
                Order.status.in_(COMPLETED_STATUSES),
                cast(Order.created_at, Date) == day,
            )
        )
        return Decimal(str(result.scalar_one()))

    async def dashboard_summary(self, restaurant_id: int) -> DashboardSummary:
        today = datetime.now(UTC).date()
        yesterday = today - timedelta(days=1)

        today_orders = await self._count_orders_for_day(restaurant_id, today)
        yesterday_orders = await self._count_orders_for_day(restaurant_id, yesterday)
        status_counts = await self._status_counts_for_day(restaurant_id, today)

        today_revenue = await self._revenue_for_day(restaurant_id, today)
        yesterday_revenue = await self._revenue_for_day(restaurant_id, yesterday)

        menu_result = await self.session.execute(
            select(
                func.count(MenuItem.id),
                func.count(MenuItem.id).filter(MenuItem.is_available.is_(True)),
            ).where(MenuItem.restaurant_id == restaurant_id)
        )
        total_items, active_items = menu_result.one()

        staff_result = await self.session.execute(
            select(
                func.count(User.id),
                func.count(User.id).filter(User.is_available.is_(True)),
            ).where(User.role.in_(STAFF_ROLES), User.is_active.is_(True))
        )
        total_staff, staff_on_duty = staff_result.one()

        orders_result = await self.session.execute(
            select(Order)
            .options(
                selectinload(Order.table),
                selectinload(Order.customer),
            )
            .where(Order.restaurant_id == restaurant_id)
            .order_by(Order.created_at.desc())
            .limit(5)
        )
        recent_orders = [
            DashboardRecentOrder.model_validate(order)
            for order in orders_result.scalars().all()
        ]

        weekly = await self.weekly_summary(restaurant_id)

        return DashboardSummary(
            today_orders=today_orders,
            today_pending=status_counts.get(OrderStatus.PENDING, 0),
            today_preparing=status_counts.get(OrderStatus.PREPARING, 0),
            today_revenue=today_revenue,
            orders_change_percent=_pct_change(today_orders, yesterday_orders),
            revenue_change_percent=_pct_change(today_revenue, yesterday_revenue),
            active_menu_items=int(active_items),
            unavailable_menu_items=int(total_items) - int(active_items),
            staff_on_duty=int(staff_on_duty),
            total_staff=int(total_staff),
            recent_orders=recent_orders,
            weekly_revenue=weekly.daily,
        )
