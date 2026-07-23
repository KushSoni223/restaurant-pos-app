from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession
from app.schemas.tax import TaxSettingsRead, TaxSettingsUpdate
from app.services.tax import TaxService

router = APIRouter(prefix="/tax", tags=["tax"])


@router.get("/settings", response_model=TaxSettingsRead)
async def get_tax_settings(
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
) -> TaxSettingsRead:
    settings = await TaxService(session).get_for_restaurant(restaurant_id)
    return TaxSettingsRead.model_validate(settings)


@router.put("/settings", response_model=TaxSettingsRead)
async def update_tax_settings(
    payload: TaxSettingsUpdate,
    _admin: AdminUser,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
) -> TaxSettingsRead:
    settings = await TaxService(session).update_for_restaurant(restaurant_id, payload)
    return TaxSettingsRead.model_validate(settings)
