from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6)


class UserRead(ORMModel):
    id: int
    role: UserRole
    name: str | None = None
    email: str | None = None


class LoginResponse(BaseModel):
    user: UserRead
    token: str | None = None


class TokenPayload(BaseModel):
    sub: str
    role: UserRole | None = None
