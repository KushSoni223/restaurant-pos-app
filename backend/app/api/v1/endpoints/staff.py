from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.staff import (
    StaffAvailabilityUpdate,
    StaffCreate,
    StaffRead,
    StaffUpdate,
)
from app.services.staff import StaffService

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffRead])
async def list_staff(session: DbSession) -> list[StaffRead]:
    staff = await StaffService(session).list_staff()
    return [StaffRead.model_validate(member) for member in staff]


@router.post("", response_model=StaffRead, status_code=201)
async def create_staff(payload: StaffCreate, session: DbSession) -> StaffRead:
    member = await StaffService(session).create_staff(payload)
    return StaffRead.model_validate(member)


@router.patch("/{user_id}/availability", response_model=StaffRead)
async def update_availability(
    user_id: int,
    payload: StaffAvailabilityUpdate,
    session: DbSession,
) -> StaffRead:
    member = await StaffService(session).set_availability(user_id, payload.is_available)
    return StaffRead.model_validate(member)


@router.patch("/{user_id}", response_model=StaffRead)
async def update_staff(
    user_id: int,
    payload: StaffUpdate,
    session: DbSession,
) -> StaffRead:
    member = await StaffService(session).update_staff(user_id, payload)
    return StaffRead.model_validate(member)


@router.delete("/{user_id}", status_code=204)
async def delete_staff(user_id: int, session: DbSession) -> None:
    await StaffService(session).delete_staff(user_id)
