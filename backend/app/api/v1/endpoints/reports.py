from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession
from app.schemas.report import DashboardSummary, ReportsSummary
from app.services.report import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/weekly", response_model=ReportsSummary)
async def weekly_reports(
    session: DbSession,
    _admin: AdminUser,
    restaurant_id: int = Query(...),
) -> ReportsSummary:
    return await ReportService(session).weekly_summary(restaurant_id)


@router.get("/dashboard", response_model=DashboardSummary)
async def dashboard(
    session: DbSession,
    _admin: AdminUser,
    restaurant_id: int = Query(...),
) -> DashboardSummary:
    return await ReportService(session).dashboard_summary(restaurant_id)
