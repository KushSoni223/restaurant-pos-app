from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.menu import MenuCategory
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.schemas.staff import StaffCreate, StaffUpdate

STAFF_ROLES = (UserRole.CHEF, UserRole.WAITER, UserRole.ADMIN)


class StaffService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)

    async def list_staff(self) -> list[User]:
        result = await self.session.execute(
            select(User).where(User.role.in_(STAFF_ROLES)).order_by(User.name)
        )
        return list(result.scalars().all())

    async def create_staff(self, payload: StaffCreate) -> User:
        if payload.role not in STAFF_ROLES:
            raise ConflictError("Role must be a staff role (CHEF, WAITER, ADMIN)")

        existing = await self.users.get_by_email(payload.email)
        if existing is not None:
            raise ConflictError("Email already registered")

        specialties: list[MenuCategory] = []
        if payload.specialty_category_ids:
            result = await self.session.execute(
                select(MenuCategory).where(MenuCategory.id.in_(payload.specialty_category_ids))
            )
            specialties = list(result.scalars().all())
            missing = set(payload.specialty_category_ids) - {c.id for c in specialties}
            if missing:
                raise NotFoundError(f"Menu categories not found: {sorted(missing)}")

        user = User(
            email=payload.email,
            hashed_password=hash_password(payload.password),
            name=payload.name,
            role=payload.role,
            is_active=True,
            is_available=True,
            specialties=specialties,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def set_availability(self, user_id: int, is_available: bool) -> User:
        user = await self.users.get_by_id(user_id)
        if user is None or user.role not in STAFF_ROLES:
            raise NotFoundError("Staff member not found")

        user.is_available = is_available
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_staff(self, user_id: int, payload: StaffUpdate) -> User:
        user = await self.users.get_by_id(user_id)
        if user is None or user.role not in STAFF_ROLES:
            raise NotFoundError("Staff member not found")

        if payload.role is not None and payload.role not in STAFF_ROLES:
            raise ConflictError("Role must be a staff role (CHEF, WAITER, ADMIN)")

        if payload.email is not None and payload.email != user.email:
            existing = await self.users.get_by_email(payload.email)
            if existing is not None:
                raise ConflictError("Email already registered")
            user.email = payload.email

        if payload.name is not None:
            user.name = payload.name
        if payload.role is not None:
            user.role = payload.role
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.is_available is not None:
            user.is_available = payload.is_available
        if payload.password is not None:
            user.hashed_password = hash_password(payload.password)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete_staff(self, user_id: int) -> None:
        user = await self.users.get_by_id(user_id)
        if user is None or user.role not in STAFF_ROLES:
            raise NotFoundError("Staff member not found")

        await self.session.delete(user)
        await self.session.commit()
