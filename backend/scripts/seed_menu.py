"""Seed restaurants, menu categories and items."""

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.db.session import dispose_engine, get_session_factory
from app.models.menu import MenuCategory, MenuItem
from app.models.restaurant import Restaurant

RESTAURANTS = [
    {
        "name": "TableTap Bistro",
        "scan_code": "TABLETAP",
        "tagline": "Fresh food, fast service",
    },
    {
        "name": "Harbor Grill",
        "scan_code": "HARBOR",
        "tagline": "Seafood & sunset views",
    },
]

CATEGORIES = [
    {"name": "Starters", "description": "Light bites to begin", "sort_order": 1},
    {"name": "Mains", "description": "Hearty plates", "sort_order": 2},
    {"name": "Drinks", "description": "Refreshments", "sort_order": 3},
    {"name": "Desserts", "description": "Sweet finishes", "sort_order": 4},
]

# category, name, description, price, is_available, dietary_tags, is_featured, prep_time
ITEMS = [
    ("Starters", "Crispy Calamari", "Lightly fried squid with lemon aioli", "8.99", True, [], True, 12),
    ("Starters", "Bruschetta Trio", "Tomato basil, olive tapenade, and ricotta", "7.50", True, ["VEGETARIAN"], False, 10),
    ("Starters", "Soup of the Day", "Chef's seasonal selection", "5.99", True, ["VEGETARIAN", "GLUTEN_FREE"], False, 8),
    ("Mains", "Grilled Salmon", "Atlantic salmon, herb butter, seasonal greens", "18.99", True, ["GLUTEN_FREE"], True, 20),
    ("Mains", "Truffle Mushroom Pasta", "Tagliatelle, wild mushrooms, parmesan", "16.50", True, ["VEGETARIAN"], True, 18),
    ("Mains", "Classic Cheeseburger", "Angus beef, cheddar, pickles, brioche bun", "14.25", True, [], False, 15),
    ("Mains", "Veggie Buddha Bowl", "Quinoa, roasted veggies, tahini dressing", "13.75", True, ["VEGAN", "GLUTEN_FREE"], True, 14),
    ("Drinks", "Fresh Lime Mojito", "Mint, lime, sparkling water", "5.50", True, ["VEGAN"], False, 5),
    ("Drinks", "Cold Brew Iced Coffee", "Slow-steeped, served over ice", "4.25", True, ["VEGAN"], False, 3),
    ("Drinks", "Seasonal Smoothie", "Blended fruits with yogurt", "6.00", False, ["VEGETARIAN"], False, 4),
    ("Desserts", "Chocolate Lava Cake", "Warm center, vanilla bean gelato", "7.99", True, ["VEGETARIAN"], True, 12),
    ("Desserts", "Tiramisu", "Espresso-soaked ladyfingers, mascarpone", "6.75", True, ["VEGETARIAN"], False, 8),
]

HARBOR_ITEMS = [
    ("Starters", "Oysters on Ice", "Half dozen with mignonette", "14.99", True, ["GLUTEN_FREE"], True, 5),
    ("Mains", "Fish & Chips", "Beer-battered cod, tartar sauce", "16.99", True, [], True, 18),
    ("Drinks", "Harbor Lemonade", "House-made citrus cooler", "4.99", True, ["VEGAN"], False, 3),
]


async def seed_restaurant_menu(session, restaurant: Restaurant, items: list) -> None:
    categories: dict[str, MenuCategory] = {}
    for data in CATEGORIES:
        result = await session.execute(
            select(MenuCategory).where(
                MenuCategory.restaurant_id == restaurant.id,
                MenuCategory.name == data["name"],
            )
        )
        category = result.scalar_one_or_none()
        if category is None:
            category = MenuCategory(**data, restaurant_id=restaurant.id, is_active=True)
            session.add(category)
            await session.flush()
            print(f"  Created category: {category.name}")
        categories[category.name] = category

    for row in items:
        (
            category_name,
            name,
            description,
            price,
            is_available,
            dietary_tags,
            is_featured,
            prep_time,
        ) = row
        result = await session.execute(
            select(MenuItem).where(
                MenuItem.restaurant_id == restaurant.id,
                MenuItem.name == name,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            existing.dietary_tags = dietary_tags
            existing.is_featured = is_featured
            existing.prep_time_minutes = prep_time
            existing.is_available = is_available
            continue
        session.add(
            MenuItem(
                restaurant_id=restaurant.id,
                category_id=categories[category_name].id,
                name=name,
                description=description,
                price=Decimal(price),
                is_available=is_available,
                dietary_tags=dietary_tags,
                is_featured=is_featured,
                prep_time_minutes=prep_time,
            )
        )
        print(f"  Created item: {name}")


async def seed_menu() -> None:
    session_factory = get_session_factory()
    async with session_factory() as session:
        for data in RESTAURANTS:
            result = await session.execute(
                select(Restaurant).where(Restaurant.scan_code == data["scan_code"])
            )
            restaurant = result.scalar_one_or_none()
            if restaurant is None:
                restaurant = Restaurant(**data, is_active=True)
                session.add(restaurant)
                await session.flush()
                print(f"Created restaurant: {restaurant.name} (code: {restaurant.scan_code})")
            else:
                print(f"Restaurant exists: {restaurant.name}")

            print(f"Seeding menu for {restaurant.name}...")
            menu_items = ITEMS if restaurant.scan_code == "TABLETAP" else HARBOR_ITEMS
            await seed_restaurant_menu(session, restaurant, menu_items)

        await session.commit()
        print("Menu seed complete.")
        print("QR codes: TABLETAP, HARBOR")


async def main() -> None:
    try:
        await seed_menu()
    finally:
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
