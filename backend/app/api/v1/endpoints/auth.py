from fastapi import APIRouter

from app.api.deps import AuthServiceDep, CurrentUser
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, auth_service: AuthServiceDep) -> LoginResponse:
    return await auth_service.login(payload)


@router.post("/register", response_model=LoginResponse)
async def register(payload: RegisterRequest, auth_service: AuthServiceDep) -> LoginResponse:
    return await auth_service.register(payload)


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
