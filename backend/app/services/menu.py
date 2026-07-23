from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.menu import MenuCategory, MenuItem
from app.schemas.menu import MenuCategoryCreate, MenuCategoryUpdate, MenuItemCreate, MenuItemUpdate
from app.schemas.menu_filters import (
    DietaryTagFacet,
    MenuFilterFacetsRead,
    MenuItemFilterParams,
    MenuPriceRange,
)
from app.services.restaurant import RestaurantService

DIETARY_TAG_LABELS: dict[str, str] = {
    "VEGETARIAN": "Vegetarian",
    "VEGAN": "Vegan",
    "GLUTEN_FREE": "Gluten-free",
    "SPICY": "Spicy",
}


def apply_item_filters(
    items: list[MenuItem], filters: MenuItemFilterParams
) -> list[MenuItem]:
    result = items

    if filters.category_id is not None:
        result = [item for item in result if item.category_id == filters.category_id]

    if filters.available_only:
        result = [item for item in result if item.is_available]

    if filters.featured_only:
        result = [item for item in result if item.is_featured]

    if filters.dietary_tags:
        required = {tag.upper() for tag in filters.dietary_tags}
        result = [
            item
            for item in result
            if required.issubset({tag.upper() for tag in (item.dietary_tags or [])})
        ]

    if filters.min_price is not None:
        result = [item for item in result if item.price >= filters.min_price]

    if filters.max_price is not None:
        result = [item for item in result if item.price <= filters.max_price]

    if filters.search:
        query = filters.search.strip().lower()
        if query:
            result = [
                item
                for item in result
                if query in item.name.lower()
                or (item.description and query in item.description.lower())
            ]

    return sort_menu_items(result, filters.sort)


def sort_menu_items(items: list[MenuItem], sort: str) -> list[MenuItem]:
    if sort == "price_asc":
        return sorted(items, key=lambda item: (item.price, item.name.lower()))
    if sort == "price_desc":
        return sorted(items, key=lambda item: (-item.price, item.name.lower()))
    if sort == "name":
        return sorted(items, key=lambda item: item.name.lower())
    return sorted(items, key=lambda item: item.id)


def build_filter_facets(items: list[MenuItem]) -> MenuFilterFacetsRead:
    prices = [item.price for item in items]
    price_range = MenuPriceRange(
        min=min(prices) if prices else Decimal("0"),
        max=max(prices) if prices else Decimal("0"),
    )

    tag_counts: dict[str, int] = {tag: 0 for tag in DIETARY_TAG_LABELS}
    for item in items:
        for tag in item.dietary_tags or []:
            normalized = tag.upper()
            if normalized in tag_counts:
                tag_counts[normalized] += 1

    return MenuFilterFacetsRead(
        dietary_tags=[
            DietaryTagFacet(tag=tag, label=label, count=tag_counts[tag])
            for tag, label in DIETARY_TAG_LABELS.items()
            if tag_counts[tag] > 0
        ],
        price_range=price_range,
        featured_count=sum(1 for item in items if item.is_featured),
        available_count=sum(1 for item in items if item.is_available),
        total_count=len(items),
    )


class MenuService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _fetch_items(self, restaurant_id: int) -> list[MenuItem]:
        result = await self.session.execute(
            select(MenuItem)
            .where(MenuItem.restaurant_id == restaurant_id)
            .order_by(MenuItem.id)
        )
        return list(result.scalars().all())

    async def list_categories(self, restaurant_id: int) -> list[MenuCategory]:
        await RestaurantService(self.session).get_by_id(restaurant_id)
        result = await self.session.execute(
            select(MenuCategory)
            .where(MenuCategory.restaurant_id == restaurant_id)
            .order_by(MenuCategory.sort_order)
        )
        return list(result.scalars().all())

    async def list_all_categories(self) -> list[MenuCategory]:
        result = await self.session.execute(
            select(MenuCategory).order_by(MenuCategory.restaurant_id, MenuCategory.sort_order)
        )
        return list(result.scalars().all())

    async def list_items(
        self,
        restaurant_id: int,
        filters: MenuItemFilterParams | None = None,
    ) -> list[MenuItem]:
        await RestaurantService(self.session).get_by_id(restaurant_id)
        items = await self._fetch_items(restaurant_id)
        if filters is None:
            return items
        return apply_item_filters(items, filters)

    async def get_filter_facets(self, restaurant_id: int) -> MenuFilterFacetsRead:
        await RestaurantService(self.session).get_by_id(restaurant_id)
        items = await self._fetch_items(restaurant_id)
        return build_filter_facets(items)

    async def get_restaurant_menu(
        self,
        restaurant_id: int,
        filters: MenuItemFilterParams | None = None,
    ) -> tuple[list[MenuCategory], list[MenuItem]]:
        """Categories + items in one round trip (one restaurant lookup)."""
        await RestaurantService(self.session).get_by_id(restaurant_id)
        categories = await self.session.execute(
            select(MenuCategory)
            .where(MenuCategory.restaurant_id == restaurant_id)
            .order_by(MenuCategory.sort_order)
        )
        items = await self._fetch_items(restaurant_id)
        if filters is not None:
            items = apply_item_filters(items, filters)
        return list(categories.scalars().all()), items

    async def list_all_items(self) -> list[MenuItem]:
        result = await self.session.execute(
            select(MenuItem).order_by(MenuItem.restaurant_id, MenuItem.id)
        )
        return list(result.scalars().all())

    async def get_item(self, menu_item_id: int, restaurant_id: int | None = None) -> MenuItem:
        item = await self.session.get(MenuItem, menu_item_id)
        if item is None:
            raise NotFoundError(f"Menu item not found: {menu_item_id}")
        if restaurant_id is not None and item.restaurant_id != restaurant_id:
            raise NotFoundError(f"Menu item not found: {menu_item_id}")
        return item

    async def _get_category_for_restaurant(
        self, category_id: int, restaurant_id: int
    ) -> MenuCategory:
        category = await self.session.get(MenuCategory, category_id)
        if category is None or category.restaurant_id != restaurant_id:
            raise NotFoundError("Category not found for this restaurant")
        return category

    async def create_category(
        self, restaurant_id: int, payload: MenuCategoryCreate
    ) -> MenuCategory:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        category = MenuCategory(
            restaurant_id=restaurant_id,
            name=payload.name.strip(),
            description=payload.description,
            sort_order=payload.sort_order,
            is_active=True,
        )
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def update_category(
        self, category_id: int, payload: MenuCategoryUpdate
    ) -> MenuCategory:
        category = await self.session.get(MenuCategory, category_id)
        if category is None:
            raise NotFoundError("Category not found")

        if payload.name is not None:
            category.name = payload.name.strip()
        if payload.description is not None:
            category.description = payload.description
        if payload.sort_order is not None:
            category.sort_order = payload.sort_order
        if payload.is_active is not None:
            category.is_active = payload.is_active

        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def delete_category(self, category_id: int) -> None:
        category = await self.session.get(MenuCategory, category_id)
        if category is None:
            raise NotFoundError("Category not found")
        category.is_active = False
        await self.session.commit()

    async def create_item(self, restaurant_id: int, payload: MenuItemCreate) -> MenuItem:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        await self._get_category_for_restaurant(payload.category_id, restaurant_id)

        item = MenuItem(
            restaurant_id=restaurant_id,
            category_id=payload.category_id,
            name=payload.name.strip(),
            description=payload.description,
            price=Decimal(str(payload.price)),
            image_url=payload.image_url,
            dietary_tags=[tag.upper() for tag in payload.dietary_tags],
            is_featured=payload.is_featured,
            prep_time_minutes=payload.prep_time_minutes,
            is_available=True,
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update_item(self, item_id: int, payload: MenuItemUpdate) -> MenuItem:
        item = await self.session.get(MenuItem, item_id)
        if item is None:
            raise NotFoundError("Menu item not found")

        if payload.category_id is not None:
            await self._get_category_for_restaurant(payload.category_id, item.restaurant_id)
            item.category_id = payload.category_id
        if payload.name is not None:
            item.name = payload.name.strip()
        if payload.description is not None:
            item.description = payload.description
        if payload.price is not None:
            item.price = Decimal(str(payload.price))
        if payload.is_available is not None:
            item.is_available = payload.is_available
        if payload.image_url is not None:
            item.image_url = payload.image_url
        if payload.dietary_tags is not None:
            item.dietary_tags = [tag.upper() for tag in payload.dietary_tags]
        if payload.is_featured is not None:
            item.is_featured = payload.is_featured
        if payload.prep_time_minutes is not None:
            item.prep_time_minutes = payload.prep_time_minutes

        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete_item(self, item_id: int) -> None:
        item = await self.session.get(MenuItem, item_id)
        if item is None:
            raise NotFoundError("Menu item not found")
        try:
            await self.session.delete(item)
            await self.session.commit()
        except Exception as exc:
            await self.session.rollback()
            raise ConflictError(
                "Cannot delete item — it may be referenced by existing orders"
            ) from exc
