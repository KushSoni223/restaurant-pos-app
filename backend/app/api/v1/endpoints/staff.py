from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.auth import UserRead

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[UserRead])
async def list_staff(_session: DbSession) -> list[UserRead]:
    # TODO: implement via StaffService (admin only)
    return []
