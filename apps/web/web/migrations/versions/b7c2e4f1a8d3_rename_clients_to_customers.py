"""rename clients to customers

Revision ID: b7c2e4f1a8d3
Revises: a3f5c8d2e1b9
Create Date: 2026-04-11 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "b7c2e4f1a8d3"
down_revision: Union[str, None] = "a3f5c8d2e1b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename the clients table to customers
    op.rename_table("clients", "customers")

    # Rename the FK column in sessions
    op.alter_column("sessions", "client_id", new_column_name="customer_id")

    # Rename indexes
    op.drop_index("ix_sessions_client_id", table_name="sessions")
    op.create_index("ix_sessions_customer_id", "sessions", ["customer_id"])

    # Rename unique constraint
    op.drop_constraint("uq_sessions_client_session_number", "sessions")
    op.create_unique_constraint(
        "uq_sessions_customer_session_number",
        "sessions",
        ["customer_id", "session_number"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_sessions_customer_session_number", "sessions")
    op.create_unique_constraint(
        "uq_sessions_client_session_number", "sessions", ["client_id", "session_number"]
    )

    op.drop_index("ix_sessions_customer_id", table_name="sessions")
    op.create_index("ix_sessions_client_id", "sessions", ["client_id"])

    op.alter_column("sessions", "customer_id", new_column_name="client_id")

    op.rename_table("customers", "clients")
