from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select

from infinite_canvas_studio.infrastructure.database import DatabaseRuntime
from infinite_canvas_studio.infrastructure.database.models import ProjectRecord


@dataclass(frozen=True)
class ProjectSummary:
    id: str
    name: str
    is_default: bool
    created_at: datetime
    updated_at: datetime


class ProjectService:
    def __init__(self, database: DatabaseRuntime) -> None:
        self._database = database

    def list_projects(self) -> list[ProjectSummary]:
        with self._database.session() as session:
            records = session.scalars(
                select(ProjectRecord)
                .where(ProjectRecord.deleted_at.is_(None))
                .order_by(ProjectRecord.is_default.desc(), ProjectRecord.updated_at.desc())
            ).all()
        return [to_summary(record) for record in records]

    def create_project(self, name: str) -> ProjectSummary:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("项目名称不能为空。")
        if len(normalized_name) > 160:
            raise ValueError("项目名称不能超过 160 个字符。")

        with self._database.transaction() as session:
            record = ProjectRecord(
                id=str(uuid4()),
                name=normalized_name,
                is_default=False,
            )
            session.add(record)
            session.flush()
            return to_summary(record)

    def ensure_default_project(self) -> ProjectSummary:
        with self._database.transaction() as session:
            record = session.scalar(
                select(ProjectRecord).where(
                    ProjectRecord.is_default.is_(True), ProjectRecord.deleted_at.is_(None)
                )
            )
            if record is None:
                record = ProjectRecord(
                    id=str(uuid4()),
                    name="未命名项目",
                    is_default=True,
                )
                session.add(record)
                session.flush()
            return to_summary(record)


def to_summary(record: ProjectRecord) -> ProjectSummary:
    return ProjectSummary(
        id=record.id,
        name=record.name,
        is_default=record.is_default,
        created_at=ensure_utc(record.created_at),
        updated_at=ensure_utc(record.updated_at),
    )


def ensure_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value
