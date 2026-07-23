"""fix restaurant table number uniqueness per restaurant

Revision ID: f6c31a8d4e02
Revises: e5a93c2f1b08
Create Date: 2026-07-13 14:12:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "f6c31a8d4e02"
down_revision: Union[str, None] = "e5a93c2f1b08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("restaurant_tables_number_key", "restaurant_tables", type_="unique")
    op.create_unique_constraint(
        "uq_restaurant_tables_restaurant_number",
        "restaurant_tables",
        ["restaurant_id", "number"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_restaurant_tables_restaurant_number", "restaurant_tables", type_="unique"
    )
    op.create_unique_constraint("restaurant_tables_number_key", "restaurant_tables", ["number"])
