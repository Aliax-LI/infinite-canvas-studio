from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal, cast
from uuid import uuid4

from sqlalchemy import func, select

from infinite_canvas_studio.infrastructure.database import DatabaseRuntime
from infinite_canvas_studio.infrastructure.database.models import CanvasRecord, ProjectRecord

CanvasKind = Literal["standard", "smart"]


class ProjectNotFoundError(ValueError):
    pass


class CanvasNotFoundError(ValueError):
    pass


@dataclass(frozen=True)
class CanvasSummary:
    id: str
    project_id: str
    name: str
    kind: CanvasKind
    sort_order: int
    created_at: datetime
    updated_at: datetime


class CanvasService:
    def __init__(self, database: DatabaseRuntime) -> None:
        self._database = database

    def list_canvases(self, project_id: str) -> list[CanvasSummary]:
        with self._database.session() as session:
            self._require_project(session, project_id)
            records = session.scalars(
                select(CanvasRecord)
                .where(
                    CanvasRecord.project_id == project_id,
                    CanvasRecord.deleted_at.is_(None),
                )
                .order_by(CanvasRecord.sort_order, CanvasRecord.created_at)
            ).all()
        return [to_summary(record) for record in records]

    def create_canvas(
        self, project_id: str, name: str, kind: CanvasKind
    ) -> CanvasSummary:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("画布名称不能为空。")
        if len(normalized_name) > 160:
            raise ValueError("画布名称不能超过 160 个字符。")

        with self._database.transaction() as session:
            self._require_project(session, project_id)
            next_sort_order = (
                session.scalar(
                    select(func.coalesce(func.max(CanvasRecord.sort_order), -1)).where(
                        CanvasRecord.project_id == project_id,
                        CanvasRecord.deleted_at.is_(None),
                    )
                )
                + 1
            )
            record = CanvasRecord(
                id=str(uuid4()),
                project_id=project_id,
                name=normalized_name,
                kind=kind,
                sort_order=next_sort_order,
                viewport_json='{"x":0,"y":0,"zoom":1}',
            )
            session.add(record)
            session.flush()
            return to_summary(record)

    @staticmethod
    def _require_project(session, project_id: str) -> None:
        project = session.scalar(
            select(ProjectRecord.id).where(
                ProjectRecord.id == project_id,
                ProjectRecord.deleted_at.is_(None),
            )
        )
        if project is None:
            raise ProjectNotFoundError("项目不存在或已被移至回收站。")


def to_summary(record: CanvasRecord) -> CanvasSummary:
    return CanvasSummary(
        id=record.id,
        project_id=record.project_id,
        name=record.name,
        kind=cast(CanvasKind, record.kind),
        sort_order=record.sort_order,
        created_at=ensure_utc(record.created_at),
        updated_at=ensure_utc(record.updated_at),
    )


def ensure_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value
