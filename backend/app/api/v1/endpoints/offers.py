from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession
from app.schemas.offer import OfferCreate, OfferRead, OfferUpdate
from app.services.offer import OfferService

router = APIRouter(prefix="/offers", tags=["offers"])


def _to_read(offer) -> OfferRead:
    return OfferRead(
        id=offer.id,
        restaurant_id=offer.restaurant_id,
        badge_text=offer.badge_text,
        title=offer.title,
        subtitle=offer.subtitle,
        discount_type=offer.discount_type,
        discount_value=offer.discount_value,
        scope=offer.scope,
        category_id=offer.category_id,
        menu_item_id=offer.menu_item_id,
        valid_until_time=offer.valid_until_time,
        applies_dine_in=offer.applies_dine_in,
        applies_takeaway=offer.applies_takeaway,
        is_active=offer.is_active,
        sort_order=offer.sort_order,
        category_name=offer.category.name if offer.category else None,
        menu_item_name=offer.menu_item.name if offer.menu_item else None,
    )


@router.get("", response_model=list[OfferRead])
async def list_offers(
    session: DbSession,
    restaurant_id: int | None = Query(None, description="Filter by restaurant"),
    active_only: bool = Query(False, description="Return only active, time-valid offers"),
) -> list[OfferRead]:
    service = OfferService(session)
    if restaurant_id is not None:
        offers = await service.list_for_restaurant(restaurant_id, active_only=active_only)
    else:
        offers = await service.list_all()
    return [_to_read(o) for o in offers]


@router.post("", response_model=OfferRead, status_code=201)
async def create_offer(
    payload: OfferCreate,
    _admin: AdminUser,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant this offer belongs to"),
) -> OfferRead:
    offer = await OfferService(session).create_offer(restaurant_id, payload)
    return _to_read(offer)


@router.patch("/{offer_id}", response_model=OfferRead)
async def update_offer(
    offer_id: int,
    payload: OfferUpdate,
    _admin: AdminUser,
    session: DbSession,
) -> OfferRead:
    offer = await OfferService(session).update_offer(offer_id, payload)
    return _to_read(offer)


@router.delete("/{offer_id}", status_code=204)
async def delete_offer(offer_id: int, _admin: AdminUser, session: DbSession) -> None:
    await OfferService(session).delete_offer(offer_id)
