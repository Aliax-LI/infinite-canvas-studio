from datetime import datetime

from fastapi import APIRouter, Request, status
from pydantic import BaseModel, ConfigDict, Field

from infinite_canvas_studio.core.exceptions import ValidationError
from infinite_canvas_studio.modules.projects import ProjectService

router = APIRouter(prefix="/v1/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, serialize_by_alias=True)

    id: str
    name: str
    is_default: bool = Field(serialization_alias="isDefault")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


@router.get("", response_model=list[ProjectResponse])
def list_projects(request: Request) -> list[ProjectResponse]:
    projects = get_service(request).list_projects()
    return [ProjectResponse.model_validate(project) for project in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: CreateProjectRequest, request: Request) -> ProjectResponse:
    try:
        project = get_service(request).create_project(payload.name)
    except ValueError as error:
        raise ValidationError(str(error), code="invalid_project_name") from error
    return ProjectResponse.model_validate(project)


def get_service(request: Request) -> ProjectService:
    service = getattr(request.app.state, "project_service", None)
    if service is None:
        from infinite_canvas_studio.core.exceptions import LibraryUnavailableError

        raise LibraryUnavailableError()
    return service
