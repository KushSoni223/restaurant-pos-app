from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.order import TableCreate, TableRead

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("", response_model=list[TableRead])
async def list_tables(_session: DbSession) -> list[TableRead]:
    # TODO: implement via TableService
    return []


@router.post("", response_model=TableRead, status_code=201)
async def create_table(_payload: TableCreate, _session: DbSession) -> TableRead:
    # TODO: implement via TableService
    raise NotImplementedError("Table creation not implemented yet")
