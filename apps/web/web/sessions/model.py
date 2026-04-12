import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from web.models.base import Base


class TranscriptEntryStatus(str, enum.Enum):
    waiting_to_be_processed = "waiting_to_be_processed"
    processed = "processed"


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        UniqueConstraint(
            "customer_id", "session_number", name="uq_sessions_customer_session_number"
        ),
        Index("ix_sessions_customer_id", "customer_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    therapist_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    session_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    customer: Mapped["Customer"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Customer", back_populates="sessions"
    )
    transcript_entries: Mapped[list["SessionTranscriptEntry"]] = relationship(
        "SessionTranscriptEntry",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class SessionTranscriptEntry(Base):
    __tablename__ = "session_transcript_entries"
    __table_args__ = (Index("ix_session_transcript_entries_session_id", "session_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[TranscriptEntryStatus] = mapped_column(
        Enum(TranscriptEntryStatus, name="transcriptentrystatus"),
        nullable=False,
        default=TranscriptEntryStatus.waiting_to_be_processed,
    )
    audio_files: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    session: Mapped[Session] = relationship(
        "Session", back_populates="transcript_entries"
    )
