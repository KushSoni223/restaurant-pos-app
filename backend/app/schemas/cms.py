import re

from pydantic import BaseModel, Field, field_validator

from app.models.cms import CmsPageType
from app.schemas.common import ORMModel

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class CmsPageCreate(BaseModel):
    slug: str = Field(max_length=100)
    title: str = Field(max_length=200)
    content: str = ""
    page_type: CmsPageType = CmsPageType.CUSTOM
    is_published: bool = False
    sort_order: int = 0

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        slug = value.strip().lower()
        if not SLUG_PATTERN.match(slug):
            raise ValueError("Slug must be lowercase letters, numbers, and hyphens only")
        return slug


class CmsPageUpdate(BaseModel):
    slug: str | None = Field(default=None, max_length=100)
    title: str | None = Field(default=None, max_length=200)
    content: str | None = None
    page_type: CmsPageType | None = None
    is_published: bool | None = None
    sort_order: int | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is None:
            return None
        slug = value.strip().lower()
        if not SLUG_PATTERN.match(slug):
            raise ValueError("Slug must be lowercase letters, numbers, and hyphens only")
        return slug


class CmsPageRead(ORMModel):
    id: int
    restaurant_id: int
    slug: str
    title: str
    content: str
    page_type: CmsPageType
    is_published: bool
    sort_order: int
