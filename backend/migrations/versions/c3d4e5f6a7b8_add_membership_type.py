"""add membership_type to members

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    membership_type_enum = sa.Enum('full', 'associate', name='membership_type_enum')
    membership_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('members', sa.Column('membership_type', membership_type_enum, nullable=True))


def downgrade():
    op.drop_column('members', 'membership_type')
    op.execute("DROP TYPE IF EXISTS membership_type_enum")
