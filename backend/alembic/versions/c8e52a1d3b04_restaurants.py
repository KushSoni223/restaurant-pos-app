"""restaurants and restaurant-scoped menu

Revision ID: c8e52a1d3b04
Revises: b7d41f0c2a91
Create Date: 2026-07-13 13:18:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8e52a1d3b04'
down_revision: Union[str, None] = 'b7d41f0c2a91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'restaurants',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('scan_code', sa.String(length=32), nullable=False),
        sa.Column('tagline', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_restaurants_scan_code'), 'restaurants', ['scan_code'], unique=True)

    # Default restaurant for existing rows
    op.execute(
        "INSERT INTO restaurants (name, scan_code, tagline, is_active) "
        "VALUES ('TableTap Bistro', 'TABLETAP', 'Fresh food, fast service', true)"
    )

    op.add_column('menu_categories', sa.Column('restaurant_id', sa.Integer(), nullable=True))
    op.add_column('menu_items', sa.Column('restaurant_id', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('restaurant_id', sa.Integer(), nullable=True))
    op.add_column('restaurant_tables', sa.Column('restaurant_id', sa.Integer(), nullable=True))

    op.execute("UPDATE menu_categories SET restaurant_id = 1")
    op.execute("UPDATE menu_items SET restaurant_id = 1")
    op.execute("UPDATE restaurant_tables SET restaurant_id = 1 WHERE restaurant_id IS NULL")

    op.alter_column('menu_categories', 'restaurant_id', nullable=False)
    op.alter_column('menu_items', 'restaurant_id', nullable=False)

    op.create_foreign_key(
        'fk_menu_categories_restaurant_id',
        'menu_categories',
        'restaurants',
        ['restaurant_id'],
        ['id'],
    )
    op.create_foreign_key(
        'fk_menu_items_restaurant_id',
        'menu_items',
        'restaurants',
        ['restaurant_id'],
        ['id'],
    )
    op.create_foreign_key(
        'fk_orders_restaurant_id',
        'orders',
        'restaurants',
        ['restaurant_id'],
        ['id'],
    )
    op.create_foreign_key(
        'fk_restaurant_tables_restaurant_id',
        'restaurant_tables',
        'restaurants',
        ['restaurant_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_restaurant_tables_restaurant_id', 'restaurant_tables', type_='foreignkey')
    op.drop_constraint('fk_orders_restaurant_id', 'orders', type_='foreignkey')
    op.drop_constraint('fk_menu_items_restaurant_id', 'menu_items', type_='foreignkey')
    op.drop_constraint('fk_menu_categories_restaurant_id', 'menu_categories', type_='foreignkey')
    op.drop_column('restaurant_tables', 'restaurant_id')
    op.drop_column('orders', 'restaurant_id')
    op.drop_column('menu_items', 'restaurant_id')
    op.drop_column('menu_categories', 'restaurant_id')
    op.drop_index(op.f('ix_restaurants_scan_code'), table_name='restaurants')
    op.drop_table('restaurants')
