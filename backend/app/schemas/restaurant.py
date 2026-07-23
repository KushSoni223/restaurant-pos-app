from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class RestaurantRead(ORMModel):
    id: int
    name: str
    scan_code: str
    tagline: str | None = None
    is_active: bool


class RestaurantCreate(BaseModel):
    name: str = Field(max_length=150)
    scan_code: str = Field(max_length=32)
    tagline: str | None = Field(default=None, max_length=255)


class RestaurantUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=150)
    scan_code: str | None = Field(default=None, max_length=32)
    tagline: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
