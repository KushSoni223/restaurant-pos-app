"""menu item filter fields

Revision ID: a1b2c3d4e5f6
Revises: f6c31a8d4e02
Create Date: 2026-07-13 17:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f6c31a8d4e02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "menu_items",
        sa.Column("dietary_tags", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "menu_items",
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("menu_items", sa.Column("prep_time_minutes", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("menu_items", "prep_time_minutes")
    op.drop_column("menu_items", "is_featured")
    op.drop_column("menu_items", "dietary_tags")
