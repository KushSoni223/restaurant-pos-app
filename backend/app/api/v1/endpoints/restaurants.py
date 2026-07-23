from fastapi import APIRouter

from app.api.deps import AdminUser, DbSession
from app.schemas.restaurant import RestaurantCreate, RestaurantRead, RestaurantUpdate
from app.services.restaurant import RestaurantService

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=list[RestaurantRead])
async def list_restaurants(session: DbSession) -> list[RestaurantRead]:
    restaurants = await RestaurantService(session).list_active()
    return [RestaurantRead.model_validate(r) for r in restaurants]


@router.get("/all", response_model=list[RestaurantRead])
async def list_all_restaurants(_admin: AdminUser, session: DbSession) -> list[RestaurantRead]:
    restaurants = await RestaurantService(session).list_all()
    return [RestaurantRead.model_validate(r) for r in restaurants]


@router.get("/scan/{scan_code}", response_model=RestaurantRead)
async def scan_restaurant(scan_code: str, session: DbSession) -> RestaurantRead:
    """Resolve a QR / manual code to a restaurant."""
    restaurant = await RestaurantService(session).get_by_scan_code(scan_code)
    return RestaurantRead.model_validate(restaurant)


@router.get("/{restaurant_id}", response_model=RestaurantRead)
async def get_restaurant(restaurant_id: int, session: DbSession) -> RestaurantRead:
    restaurant = await RestaurantService(session).get_by_id_any(restaurant_id)
    return RestaurantRead.model_validate(restaurant)


@router.post("", response_model=RestaurantRead, status_code=201)
async def create_restaurant(
    payload: RestaurantCreate, _admin: AdminUser, session: DbSession
) -> RestaurantRead:
    restaurant = await RestaurantService(session).create_restaurant(payload)
    return RestaurantRead.model_validate(restaurant)


@router.patch("/{restaurant_id}", response_model=RestaurantRead)
async def update_restaurant(
    restaurant_id: int,
    payload: RestaurantUpdate,
    _admin: AdminUser,
    session: DbSession,
) -> RestaurantRead:
    restaurant = await RestaurantService(session).update_restaurant(restaurant_id, payload)
    return RestaurantRead.model_validate(restaurant)


@router.delete("/{restaurant_id}", status_code=204)
async def delete_restaurant(
    restaurant_id: int, _admin: AdminUser, session: DbSession
) -> None:
    await RestaurantService(session).delete_restaurant(restaurant_id)
