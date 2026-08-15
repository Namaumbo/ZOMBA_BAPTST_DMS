"""add nationality and household member fields

Revision ID: a1b2c3d4e5f6
Revises: 7cf5a2a4a974
Create Date: 2026-04-29 23:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '7cf5a2a4a974'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('members', sa.Column('nationality_current', sa.String(length=200), nullable=True))
    op.add_column('members', sa.Column('nationality_at_birth', sa.String(length=200), nullable=True))
    op.add_column('members', sa.Column('household_zbc_members_12plus', sa.JSON(), nullable=True))
    op.add_column('members', sa.Column('household_non_zbc_members_12plus', sa.JSON(), nullable=True))
    op.add_column('members', sa.Column('children_nurtured_by_zbc', sa.JSON(), nullable=True))
    op.add_column('members', sa.Column('children_nurtured_parents_not_zbc', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('members', 'children_nurtured_parents_not_zbc')
    op.drop_column('members', 'children_nurtured_by_zbc')
    op.drop_column('members', 'household_non_zbc_members_12plus')
    op.drop_column('members', 'household_zbc_members_12plus')
    op.drop_column('members', 'nationality_at_birth')
    op.drop_column('members', 'nationality_current')
