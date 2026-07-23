from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.cms import CmsPage
from app.schemas.cms import CmsPageCreate, CmsPageUpdate
from app.services.restaurant import RestaurantService


class CmsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_for_restaurant(
        self, restaurant_id: int, published_only: bool = False
    ) -> list[CmsPage]:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        query = select(CmsPage).where(CmsPage.restaurant_id == restaurant_id)
        if published_only:
            query = query.where(CmsPage.is_published.is_(True))
        query = query.order_by(CmsPage.sort_order, CmsPage.title)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_slug(
        self, restaurant_id: int, slug: str, published_only: bool = False
    ) -> CmsPage:
        query = select(CmsPage).where(
            CmsPage.restaurant_id == restaurant_id,
            CmsPage.slug == slug.strip().lower(),
        )
        if published_only:
            query = query.where(CmsPage.is_published.is_(True))
        result = await self.session.execute(query)
        page = result.scalar_one_or_none()
        if page is None:
            raise NotFoundError("Page not found")
        return page

    async def get_by_id(self, page_id: int) -> CmsPage:
        page = await self.session.get(CmsPage, page_id)
        if page is None:
            raise NotFoundError("Page not found")
        return page

    async def create_page(self, restaurant_id: int, payload: CmsPageCreate) -> CmsPage:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        existing = await self.session.execute(
            select(CmsPage).where(
                CmsPage.restaurant_id == restaurant_id,
                CmsPage.slug == payload.slug,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ConflictError("A page with this slug already exists")

        page = CmsPage(
            restaurant_id=restaurant_id,
            slug=payload.slug,
            title=payload.title.strip(),
            content=payload.content,
            page_type=payload.page_type,
            is_published=payload.is_published,
            sort_order=payload.sort_order,
        )
        self.session.add(page)
        await self.session.commit()
        await self.session.refresh(page)
        return page

    async def update_page(self, page_id: int, payload: CmsPageUpdate) -> CmsPage:
        page = await self.get_by_id(page_id)

        if payload.slug is not None and payload.slug != page.slug:
            existing = await self.session.execute(
                select(CmsPage).where(
                    CmsPage.restaurant_id == page.restaurant_id,
                    CmsPage.slug == payload.slug,
                    CmsPage.id != page_id,
                )
            )
            if existing.scalar_one_or_none() is not None:
                raise ConflictError("A page with this slug already exists")
            page.slug = payload.slug

        if payload.title is not None:
            page.title = payload.title.strip()
        if payload.content is not None:
            page.content = payload.content
        if payload.page_type is not None:
            page.page_type = payload.page_type
        if payload.is_published is not None:
            page.is_published = payload.is_published
        if payload.sort_order is not None:
            page.sort_order = payload.sort_order

        await self.session.commit()
        await self.session.refresh(page)
        return page

    async def delete_page(self, page_id: int) -> None:
        page = await self.get_by_id(page_id)
        await self.session.delete(page)
        await self.session.commit()
