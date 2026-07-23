from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession
from app.schemas.cms import CmsPageCreate, CmsPageRead, CmsPageUpdate
from app.services.cms import CmsService

router = APIRouter(prefix="/cms", tags=["cms"])


@router.get("/pages", response_model=list[CmsPageRead])
async def list_cms_pages(
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
    published_only: bool = Query(False),
) -> list[CmsPageRead]:
    pages = await CmsService(session).list_for_restaurant(
        restaurant_id, published_only=published_only
    )
    return [CmsPageRead.model_validate(page) for page in pages]


@router.get("/pages/{slug}", response_model=CmsPageRead)
async def get_cms_page_by_slug(
    slug: str,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
    published_only: bool = Query(False),
) -> CmsPageRead:
    page = await CmsService(session).get_by_slug(
        restaurant_id, slug, published_only=published_only
    )
    return CmsPageRead.model_validate(page)


@router.post("/pages", response_model=CmsPageRead, status_code=201)
async def create_cms_page(
    payload: CmsPageCreate,
    _admin: AdminUser,
    session: DbSession,
    restaurant_id: int = Query(..., description="Restaurant ID"),
) -> CmsPageRead:
    page = await CmsService(session).create_page(restaurant_id, payload)
    return CmsPageRead.model_validate(page)


@router.patch("/pages/{page_id}", response_model=CmsPageRead)
async def update_cms_page(
    page_id: int,
    payload: CmsPageUpdate,
    _admin: AdminUser,
    session: DbSession,
) -> CmsPageRead:
    page = await CmsService(session).update_page(page_id, payload)
    return CmsPageRead.model_validate(page)


@router.delete("/pages/{page_id}", status_code=204)
async def delete_cms_page(page_id: int, _admin: AdminUser, session: DbSession) -> None:
    await CmsService(session).delete_page(page_id)
