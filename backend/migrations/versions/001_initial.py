"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2026-03-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cases",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("event_id", sa.String(), nullable=False),
        sa.Column("machine_id", sa.String(), nullable=True),
        sa.Column("line_id", sa.String(), nullable=True),
        sa.Column("event_type", sa.String(), nullable=True),
        sa.Column("severity", sa.String(), nullable=True),
        sa.Column("priority_score", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("recommendation", sa.String(), nullable=True),
        sa.Column("routing_bucket", sa.String(), nullable=True),
        sa.Column("deterministic_hash", sa.String(), nullable=True),
        sa.Column("downtime_avoided_minutes", sa.Integer(), nullable=True),
        sa.Column("cost_estimate_usd", sa.Integer(), nullable=True),
        sa.Column("risk_level", sa.String(), nullable=True),
        sa.Column("result_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "audit_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("case_id", sa.String(), nullable=False),
        sa.Column("stage_name", sa.String(), nullable=True),
        sa.Column("stage_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("audit_snapshots")
    op.drop_table("cases")
