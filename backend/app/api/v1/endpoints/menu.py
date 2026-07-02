from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.menu import MenuCategoryRead, MenuItemRead

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("/categories", response_model=list[MenuCategoryRead])
async def list_categories(_session: DbSession) -> list[MenuCategoryRead]:
    # TODO: implement via MenuService
    return []


@router.get("/items", response_model=list[MenuItemRead])
async def list_items(_session: DbSession) -> list[MenuItemRead]:
    # TODO: implement via MenuService
    return []
