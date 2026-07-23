from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError
from app.models.menu import MenuCategory, MenuItem
from app.models.offer import DiscountType, Offer, OfferScope
from app.schemas.offer import OfferCreate, OfferUpdate
from app.services.restaurant import RestaurantService


class OfferService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _is_time_valid(self, offer: Offer) -> bool:
        if not offer.valid_until_time:
            return True
        now = datetime.now(UTC).strftime("%H:%M")
        return now <= offer.valid_until_time

    async def list_for_restaurant(self, restaurant_id: int, active_only: bool = False) -> list[Offer]:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        query = (
            select(Offer)
            .where(Offer.restaurant_id == restaurant_id)
            .options(selectinload(Offer.category), selectinload(Offer.menu_item))
            .order_by(Offer.sort_order, Offer.id)
        )
        if active_only:
            query = query.where(Offer.is_active.is_(True))
        result = await self.session.execute(query)
        offers = list(result.scalars().all())
        if active_only:
            return [o for o in offers if self._is_time_valid(o)]
        return offers

    async def list_all(self) -> list[Offer]:
        result = await self.session.execute(
            select(Offer)
            .options(selectinload(Offer.category), selectinload(Offer.menu_item))
            .order_by(Offer.restaurant_id, Offer.sort_order, Offer.id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, offer_id: int) -> Offer:
        offer = await self.session.get(
            Offer,
            offer_id,
            options=(selectinload(Offer.category), selectinload(Offer.menu_item)),
        )
        if offer is None:
            raise NotFoundError("Offer not found")
        return offer

    async def _validate_targets(
        self,
        restaurant_id: int,
        scope: OfferScope,
        category_id: int | None,
        menu_item_id: int | None,
    ) -> None:
        if scope == OfferScope.CATEGORY:
            category = await self.session.get(MenuCategory, category_id)
            if category is None or category.restaurant_id != restaurant_id:
                raise NotFoundError("Category not found for this restaurant")
        if scope == OfferScope.ITEM:
            item = await self.session.get(MenuItem, menu_item_id)
            if item is None or item.restaurant_id != restaurant_id:
                raise NotFoundError("Menu item not found for this restaurant")

    async def create_offer(self, restaurant_id: int, payload: OfferCreate) -> Offer:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        await self._validate_targets(
            restaurant_id, payload.scope, payload.category_id, payload.menu_item_id
        )

        if payload.discount_type == DiscountType.PERCENTAGE and payload.discount_value > 100:
            raise ConflictError("Percentage discount cannot exceed 100")

        offer = Offer(
            restaurant_id=restaurant_id,
            badge_text=payload.badge_text.strip(),
            title=payload.title.strip(),
            subtitle=payload.subtitle,
            discount_type=payload.discount_type,
            discount_value=Decimal(str(payload.discount_value)),
            scope=payload.scope,
            category_id=payload.category_id,
            menu_item_id=payload.menu_item_id,
            valid_until_time=payload.valid_until_time,
            applies_dine_in=payload.applies_dine_in,
            applies_takeaway=payload.applies_takeaway,
            is_active=True,
            sort_order=payload.sort_order,
        )
        self.session.add(offer)
        await self.session.commit()
        return await self.get_by_id(offer.id)

    async def update_offer(self, offer_id: int, payload: OfferUpdate) -> Offer:
        offer = await self.get_by_id(offer_id)

        scope = payload.scope if payload.scope is not None else offer.scope
        category_id = payload.category_id if payload.category_id is not None else offer.category_id
        menu_item_id = (
            payload.menu_item_id if payload.menu_item_id is not None else offer.menu_item_id
        )

        if payload.scope is not None or payload.category_id is not None or payload.menu_item_id is not None:
            if scope == OfferScope.RESTAURANT:
                category_id = None
                menu_item_id = None
            elif scope == OfferScope.CATEGORY:
                menu_item_id = None
            await self._validate_targets(offer.restaurant_id, scope, category_id, menu_item_id)
            offer.scope = scope
            offer.category_id = category_id
            offer.menu_item_id = menu_item_id

        if payload.badge_text is not None:
            offer.badge_text = payload.badge_text.strip()
        if payload.title is not None:
            offer.title = payload.title.strip()
        if payload.subtitle is not None:
            offer.subtitle = payload.subtitle
        if payload.discount_type is not None:
            offer.discount_type = payload.discount_type
        if payload.discount_value is not None:
            discount_type = payload.discount_type or offer.discount_type
            if discount_type == DiscountType.PERCENTAGE and payload.discount_value > 100:
                raise ConflictError("Percentage discount cannot exceed 100")
            offer.discount_value = Decimal(str(payload.discount_value))
        if payload.valid_until_time is not None:
            offer.valid_until_time = payload.valid_until_time
        if payload.applies_dine_in is not None:
            offer.applies_dine_in = payload.applies_dine_in
        if payload.applies_takeaway is not None:
            offer.applies_takeaway = payload.applies_takeaway
        if payload.is_active is not None:
            offer.is_active = payload.is_active
        if payload.sort_order is not None:
            offer.sort_order = payload.sort_order

        await self.session.commit()
        return await self.get_by_id(offer.id)

    async def delete_offer(self, offer_id: int) -> None:
        offer = await self.get_by_id(offer_id)
        await self.session.delete(offer)
        await self.session.commit()
