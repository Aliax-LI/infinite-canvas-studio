from datetime import datetime
from typing import Literal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field

from infinite_canvas_studio.modules.canvases import CanvasService, ProjectNotFoundError

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
    try:
        canvases = get_service(request).list_canvases(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return [CanvasResponse.model_validate(canvas) for canvas in canvases]


@router.post("", response_model=CanvasResponse, status_code=status.HTTP_201_CREATED)
def create_canvas(
    project_id: str, payload: CreateCanvasRequest, request: Request
) -> CanvasResponse:
    try:
        canvas = get_service(request).create_canvas(project_id, payload.name, payload.kind)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "invalid_canvas", "message": str(error), "retryable": False},
        ) from error
    return CanvasResponse.model_validate(canvas)


def get_service(request: Request) -> CanvasService:
    service = getattr(request.app.state, "canvas_service", None)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "library_unavailable",
                "message": "资料库尚未配置。",
                "retryable": True,
            },
        )
    return service
