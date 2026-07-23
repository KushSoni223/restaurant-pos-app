"""tax settings and cms pages

Revision ID: e5a93c2f1b08
Revises: d4f82b9e1c07
Create Date: 2026-07-13 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5a93c2f1b08"
down_revision: Union[str, None] = "d4f82b9e1c07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "restaurant_tax_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("restaurant_id", sa.Integer(), nullable=False),
        sa.Column("tax_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("tax_rate", sa.Numeric(precision=5, scale=4), nullable=False, server_default="0.0800"),
        sa.Column("tax_label", sa.String(length=50), nullable=False, server_default="Sales Tax"),
        sa.Column("service_charge_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("service_charge_rate", sa.Numeric(precision=5, scale=4), nullable=False, server_default="0.0000"),
        sa.Column("service_charge_label", sa.String(length=50), nullable=False, server_default="Service Charge"),
        sa.Column("prices_include_tax", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("restaurant_id"),
    )

    op.create_table(
        "cms_pages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("restaurant_id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "page_type",
            sa.Enum("ABOUT", "TERMS", "PRIVACY", "FAQ", "CUSTOM", name="cms_page_type", native_enum=False),
            nullable=False,
        ),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("restaurant_id", "slug", name="uq_cms_pages_restaurant_slug"),
    )


def downgrade() -> None:
    op.drop_table("cms_pages")
    op.drop_table("restaurant_tax_settings")
