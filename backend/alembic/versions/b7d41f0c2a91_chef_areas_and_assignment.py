"""chef areas and order assignment

Revision ID: b7d41f0c2a91
Revises: 9ab1162c1d32
Create Date: 2026-07-13 12:06:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d41f0c2a91'
down_revision: Union[str, None] = '9ab1162c1d32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_table(
        'chef_specialties',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['menu_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'category_id'),
    )
    op.add_column('order_items', sa.Column('chef_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_order_items_chef_id_users',
        'order_items',
        'users',
        ['chef_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_order_items_chef_id_users', 'order_items', type_='foreignkey')
    op.drop_column('order_items', 'chef_id')
    op.drop_table('chef_specialties')
    op.drop_column('users', 'is_available')
