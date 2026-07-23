from decimal import Decimal

from pydantic import BaseModel

from app.models.order import OrderStatus
from app.schemas.common import ORMModel


class DailyReportRow(BaseModel):
    date: str
    orders: int
    revenue: Decimal
    avg_order_value: Decimal


class ReportsSummary(BaseModel):
    total_orders: int
    total_revenue: Decimal
    avg_order_value: Decimal
    best_day_label: str | None
    best_day_revenue: Decimal
    orders_change_percent: float | None
    revenue_change_percent: float | None
    daily: list[DailyReportRow]


class DashboardRecentOrder(ORMModel):
    id: int
    table_number: str | None = None
    customer_name: str | None = None
    total: Decimal
    status: OrderStatus


class DashboardSummary(BaseModel):
    today_orders: int
    today_pending: int
    today_preparing: int
    today_revenue: Decimal
    orders_change_percent: float | None
    revenue_change_percent: float | None
    active_menu_items: int
    unavailable_menu_items: int
    staff_on_duty: int
    total_staff: int
    recent_orders: list[DashboardRecentOrder]
    weekly_revenue: list[DailyReportRow]
