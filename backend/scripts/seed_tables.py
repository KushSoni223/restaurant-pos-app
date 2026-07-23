"""Seed restaurant tables for floor layout."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.db.session import dispose_engine, get_session_factory
from app.models.order import RestaurantTable, TableStatus
from app.models.restaurant import Restaurant

TABLE_COUNT = 12


async def seed_tables() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        restaurants = list((await session.execute(select(Restaurant))).scalars().all())
        for restaurant in restaurants:
            print(f"Seeding tables for {restaurant.name}...")
            for index in range(1, TABLE_COUNT + 1):
                number = str(index)
                result = await session.execute(
                    select(RestaurantTable).where(
                        RestaurantTable.restaurant_id == restaurant.id,
                        RestaurantTable.number == number,
                    )
                )
                if result.scalar_one_or_none() is not None:
                    continue
                session.add(
                    RestaurantTable(
                        restaurant_id=restaurant.id,
                        number=number,
                        capacity=4 if index <= 8 else 6,
                        status=TableStatus.AVAILABLE,
                    )
                )
                await session.flush()
                print(f"  Created table {number}")
        await session.commit()
        print("Table seed complete.")


async def main() -> None:
    try:
        await seed_tables()
    finally:
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
