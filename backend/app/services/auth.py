from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserRead


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)

    async def login(self, payload: LoginRequest) -> LoginResponse:
        user = await self.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        token = create_access_token(user.id, extra_claims={"role": user.role.value})
        return LoginResponse(
            user=UserRead.model_validate(user),
            token=token,
        )

    async def register(self, payload: RegisterRequest) -> LoginResponse:
        existing = await self.users.get_by_email(payload.email)
        if existing is not None:
            raise ConflictError("Email already registered")

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            name=payload.name,
            role=UserRole.CUSTOMER,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        token = create_access_token(user.id, extra_claims={"role": user.role.value})
        return LoginResponse(
            user=UserRead.model_validate(user),
            token=token,
        )
