from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate


class RestaurantService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_scan_code(self, scan_code: str) -> Restaurant:
        normalized = scan_code.strip().upper()
        result = await self.session.execute(
            select(Restaurant).where(
                Restaurant.scan_code == normalized,
                Restaurant.is_active.is_(True),
            )
        )
        restaurant = result.scalar_one_or_none()
        if restaurant is None:
            raise NotFoundError("Restaurant not found. Check the QR code and try again.")
        return restaurant

    async def get_by_id(self, restaurant_id: int) -> Restaurant:
        restaurant = await self.session.get(Restaurant, restaurant_id)
        if restaurant is None or not restaurant.is_active:
            raise NotFoundError("Restaurant not found")
        return restaurant

    async def get_by_id_any(self, restaurant_id: int) -> Restaurant:
        restaurant = await self.session.get(Restaurant, restaurant_id)
        if restaurant is None:
            raise NotFoundError("Restaurant not found")
        return restaurant

    async def list_active(self) -> list[Restaurant]:
        result = await self.session.execute(
            select(Restaurant).where(Restaurant.is_active.is_(True)).order_by(Restaurant.name)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Restaurant]:
        result = await self.session.execute(select(Restaurant).order_by(Restaurant.name))
        return list(result.scalars().all())

    async def create_restaurant(self, payload: RestaurantCreate) -> Restaurant:
        scan_code = payload.scan_code.strip().upper()
        existing = await self.session.execute(
            select(Restaurant).where(Restaurant.scan_code == scan_code)
        )
        if existing.scalar_one_or_none() is not None:
            raise ConflictError("Scan code already in use")

        restaurant = Restaurant(
            name=payload.name.strip(),
            scan_code=scan_code,
            tagline=payload.tagline,
            is_active=True,
        )
        self.session.add(restaurant)
        await self.session.commit()
        await self.session.refresh(restaurant)
        return restaurant

    async def update_restaurant(
        self, restaurant_id: int, payload: RestaurantUpdate
    ) -> Restaurant:
        restaurant = await self.get_by_id_any(restaurant_id)

        if payload.scan_code is not None:
            scan_code = payload.scan_code.strip().upper()
            if scan_code != restaurant.scan_code:
                existing = await self.session.execute(
                    select(Restaurant).where(Restaurant.scan_code == scan_code)
                )
                if existing.scalar_one_or_none() is not None:
                    raise ConflictError("Scan code already in use")
                restaurant.scan_code = scan_code

        if payload.name is not None:
            restaurant.name = payload.name.strip()
        if payload.tagline is not None:
            restaurant.tagline = payload.tagline
        if payload.is_active is not None:
            restaurant.is_active = payload.is_active

        await self.session.commit()
        await self.session.refresh(restaurant)
        return restaurant

    async def delete_restaurant(self, restaurant_id: int) -> None:
        restaurant = await self.get_by_id_any(restaurant_id)
        restaurant.is_active = False
        await self.session.commit()
