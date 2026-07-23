"""offers table

Revision ID: d4f82b9e1c07
Revises: c8e52a1d3b04
Create Date: 2026-07-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4f82b9e1c07"
down_revision: Union[str, None] = "c8e52a1d3b04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "offers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("restaurant_id", sa.Integer(), nullable=False),
        sa.Column("badge_text", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("subtitle", sa.String(length=300), nullable=True),
        sa.Column(
            "discount_type",
            sa.Enum("PERCENTAGE", "FIXED", name="discount_type", native_enum=False),
            nullable=False,
        ),
        sa.Column("discount_value", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "scope",
            sa.Enum("RESTAURANT", "CATEGORY", "ITEM", name="offer_scope", native_enum=False),
            nullable=False,
        ),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("menu_item_id", sa.Integer(), nullable=True),
        sa.Column("valid_until_time", sa.String(length=5), nullable=True),
        sa.Column("applies_dine_in", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("applies_takeaway", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.ForeignKeyConstraint(["category_id"], ["menu_categories.id"]),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("offers")
