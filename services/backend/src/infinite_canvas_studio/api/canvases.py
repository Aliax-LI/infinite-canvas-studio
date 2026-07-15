from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Request, status
from pydantic import BaseModel, ConfigDict, Field

from infinite_canvas_studio.modules.canvases import CanvasService

router = APIRouter(
    prefix="/v1/projects/{project_id}/canvases", tags=["canvases"]
)


class CreateCanvasRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    kind: Literal["standard", "smart"]


class CanvasResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, serialize_by_alias=True)

    id: str
    project_id: str = Field(serialization_alias="projectId")
    name: str
    kind: Literal["standard", "smart"]
    sort_order: int = Field(serialization_alias="sortOrder")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


@router.get("", response_model=list[CanvasResponse])
def list_canvases(project_id: str, request: Request) -> list[CanvasResponse]:
    canvases = get_service(request).list_canvases(project_id)
    return [CanvasResponse.model_validate(canvas) for canvas in canvases]


@router.post("", response_model=CanvasResponse, status_code=status.HTTP_201_CREATED)
def create_canvas(
    project_id: str, payload: CreateCanvasRequest, request: Request
) -> CanvasResponse:
    canvas = get_service(request).create_canvas(project_id, payload.name, payload.kind)
    return CanvasResponse.model_validate(canvas)


def get_service(request: Request) -> CanvasService:
    service = getattr(request.app.state, "canvas_service", None)
    if service is None:
        from infinite_canvas_studio.core.exceptions import LibraryUnavailableError

        raise LibraryUnavailableError()
    return service
