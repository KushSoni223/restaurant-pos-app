from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.order import TableStatus
from app.schemas.order import TableCreate, TableRead, TableStatusUpdate
from app.services.table import TableService

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("", response_model=list[TableRead])
async def list_tables(
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
    sync: bool = Query(False, description="Run table status sync before returning"),
) -> list[TableRead]:
    tables = await TableService(session).list_for_restaurant(restaurant_id, sync=sync)
    return [TableRead.model_validate(table) for table in tables]


@router.post("", response_model=TableRead, status_code=201)
async def create_table(
    payload: TableCreate,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
) -> TableRead:
    table = await TableService(session).create_table(restaurant_id, payload)
    return TableRead.model_validate(table)


@router.get("/{table_id}", response_model=TableRead)
async def get_table(table_id: int, session: DbSession) -> TableRead:
    table = await TableService(session).get_by_id(table_id)
    return TableRead.model_validate(table)


@router.post("/{table_id}/hold", response_model=TableRead)
async def hold_table(table_id: int, session: DbSession) -> TableRead:
    """Mark table occupied when a guest selects it via scan or floor plan."""
    table = await TableService(session).hold_table(table_id)
    return TableRead.model_validate(table)


@router.patch("/{table_id}/status", response_model=TableRead)
async def update_table_status(
    table_id: int,
    payload: TableStatusUpdate,
    session: DbSession,
    _user: CurrentUser,
) -> TableRead:
    table = await TableService(session).update_status(table_id, payload.status)
    return TableRead.model_validate(table)
