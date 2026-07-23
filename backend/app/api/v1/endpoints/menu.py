from decimal import Decimal

from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession
from app.schemas.menu import (
    MenuCategoryCreate,
    MenuCategoryRead,
    MenuCategoryUpdate,
    MenuItemCreate,
    MenuItemRead,
    MenuItemUpdate,
    RestaurantMenuRead,
)
from app.schemas.menu_filters import MenuFilterFacetsRead, MenuItemFilterParams, MenuSortOption
from app.services.menu import MenuService

router = APIRouter(prefix="/menu", tags=["menu"])


def _parse_menu_filters(
    category_id: int | None = None,
    available_only: bool = False,
    featured_only: bool = False,
    dietary_tags: str | None = None,
    max_price: Decimal | None = None,
    min_price: Decimal | None = None,
    search: str | None = None,
    sort: MenuSortOption = "default",
) -> MenuItemFilterParams:
    parsed_tags = (
        [tag.strip().upper() for tag in dietary_tags.split(",") if tag.strip()]
        if dietary_tags
        else []
    )
    return MenuItemFilterParams(
        category_id=category_id,
        available_only=available_only,
        featured_only=featured_only,
        dietary_tags=parsed_tags,
        max_price=max_price,
        min_price=min_price,
        search=search,
        sort=sort,
    )


def _has_active_filters(filters: MenuItemFilterParams) -> bool:
    return any(
        [
            filters.category_id is not None,
            filters.available_only,
            filters.featured_only,
            bool(filters.dietary_tags),
            filters.max_price is not None,
            filters.min_price is not None,
            bool(filters.search and filters.search.strip()),
            filters.sort != "default",
        ]
    )


@router.get("/filters", response_model=MenuFilterFacetsRead)
async def get_menu_filters(
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
) -> MenuFilterFacetsRead:
    return await MenuService(session).get_filter_facets(restaurant_id)


@router.get("", response_model=RestaurantMenuRead)
async def get_restaurant_menu(
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
    category_id: int | None = Query(None, description="Filter by category"),
    available_only: bool = Query(False, description="Only available items"),
    featured_only: bool = Query(False, description="Only featured items"),
    dietary_tags: str | None = Query(
        None, description="Comma-separated dietary tags (VEGETARIAN, VEGAN, GLUTEN_FREE, SPICY)"
    ),
    max_price: Decimal | None = Query(None, description="Maximum item price"),
    min_price: Decimal | None = Query(None, description="Minimum item price"),
    search: str | None = Query(None, description="Search item name or description"),
    sort: MenuSortOption = Query("default", description="Sort order for items"),
) -> RestaurantMenuRead:
    filters = _parse_menu_filters(
        category_id=category_id,
        available_only=available_only,
        featured_only=featured_only,
        dietary_tags=dietary_tags,
        max_price=max_price,
        min_price=min_price,
        search=search,
        sort=sort,
    )
    active_filters = _has_active_filters(filters)
    categories, items = await MenuService(session).get_restaurant_menu(
        restaurant_id,
        filters if active_filters else None,
    )
    return RestaurantMenuRead(
        categories=[MenuCategoryRead.model_validate(c) for c in categories],
        items=[MenuItemRead.model_validate(i) for i in items],
    )


@router.get("/categories", response_model=list[MenuCategoryRead])
async def list_categories(
    session: DbSession,
    restaurant_id: int | None = Query(None, description="Filter by restaurant"),
) -> list[MenuCategoryRead]:
    service = MenuService(session)
    if restaurant_id is not None:
        categories = await service.list_categories(restaurant_id)
    else:
        categories = await service.list_all_categories()
    return [MenuCategoryRead.model_validate(category) for category in categories]


@router.post("/categories", response_model=MenuCategoryRead, status_code=201)
async def create_category(
    payload: MenuCategoryCreate,
    _admin: AdminUser,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant to add category to"),
) -> MenuCategoryRead:
    category = await MenuService(session).create_category(restaurant_id, payload)
    return MenuCategoryRead.model_validate(category)


@router.patch("/categories/{category_id}", response_model=MenuCategoryRead)
async def update_category(
    category_id: int,
    payload: MenuCategoryUpdate,
    _admin: AdminUser,
    session: DbSession,
) -> MenuCategoryRead:
    category = await MenuService(session).update_category(category_id, payload)
    return MenuCategoryRead.model_validate(category)


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: int, _admin: AdminUser, session: DbSession
) -> None:
    await MenuService(session).delete_category(category_id)


@router.get("/items", response_model=list[MenuItemRead])
async def list_items(
    session: DbSession,
    restaurant_id: int | None = Query(None, description="Filter by restaurant"),
    category_id: int | None = Query(None, description="Filter by category"),
    available_only: bool = Query(False, description="Only available items"),
    featured_only: bool = Query(False, description="Only featured items"),
    dietary_tags: str | None = Query(
        None, description="Comma-separated dietary tags (VEGETARIAN, VEGAN, GLUTEN_FREE, SPICY)"
    ),
    max_price: Decimal | None = Query(None, description="Maximum item price"),
    min_price: Decimal | None = Query(None, description="Minimum item price"),
    search: str | None = Query(None, description="Search item name or description"),
    sort: MenuSortOption = Query("default", description="Sort order for items"),
) -> list[MenuItemRead]:
    service = MenuService(session)
    if restaurant_id is not None:
        filters = _parse_menu_filters(
            category_id=category_id,
            available_only=available_only,
            featured_only=featured_only,
            dietary_tags=dietary_tags,
            max_price=max_price,
            min_price=min_price,
            search=search,
            sort=sort,
        )
        items = await service.list_items(
            restaurant_id,
            filters if _has_active_filters(filters) else None,
        )
    else:
        items = await service.list_all_items()
    return [MenuItemRead.model_validate(item) for item in items]


@router.post("/items", response_model=MenuItemRead, status_code=201)
async def create_item(
    payload: MenuItemCreate,
    _admin: AdminUser,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant to add item to"),
) -> MenuItemRead:
    item = await MenuService(session).create_item(restaurant_id, payload)
    return MenuItemRead.model_validate(item)


@router.patch("/items/{item_id}", response_model=MenuItemRead)
async def update_item(
    item_id: int,
    payload: MenuItemUpdate,
    _admin: AdminUser,
    session: DbSession,
) -> MenuItemRead:
    item = await MenuService(session).update_item(item_id, payload)
    return MenuItemRead.model_validate(item)


@router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: int, _admin: AdminUser, session: DbSession) -> None:
    await MenuService(session).delete_item(item_id)
