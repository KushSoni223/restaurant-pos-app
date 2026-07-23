"""Seed the default admin user for the admin panel."""

import asyncio
import sys
from pathlib import Path

# Allow running as: python scripts/seed_admin.py
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import dispose_engine, get_session_factory
from app.models.user import User, UserRole

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Test@123"
ADMIN_NAME = "Admin"


async def seed_admin() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                name=ADMIN_NAME,
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(user)
            await session.commit()
            print(f"Created admin user: {ADMIN_EMAIL}")
            return

        user.hashed_password = hash_password(ADMIN_PASSWORD)
        user.role = UserRole.ADMIN
        user.name = ADMIN_NAME
        user.is_active = True
        await session.commit()
        print(f"Updated existing user to admin: {ADMIN_EMAIL}")


async def main() -> None:
    try:
        await seed_admin()
    finally:
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
