from __future__ import annotations

from datetime import datetime
from typing import Annotated

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


PrimaryKey = Annotated[str, mapped_column(String(36), primary_key=True)]
Timestamp = Annotated[
    datetime,
    mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now()),
]


class ProjectRecord(Base):
    __tablename__ = "projects"

    id: Mapped[PrimaryKey]
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    is_default: Mapped[bool] = mapped_column(nullable=False, default=False)
    created_at: Mapped[Timestamp]
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    canvases: Mapped[list[CanvasRecord]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class CanvasRecord(Base):
    __tablename__ = "canvases"

    id: Mapped[PrimaryKey]
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    kind: Mapped[str] = mapped_column(String(24), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    viewport_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[Timestamp]
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    project: Mapped[ProjectRecord] = relationship(back_populates="canvases")
