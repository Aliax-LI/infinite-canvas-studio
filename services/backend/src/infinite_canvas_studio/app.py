from __future__ import annotations

import os
from pathlib import Path
from secrets import compare_digest

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from infinite_canvas_studio.api.canvases import router as canvases_router
from infinite_canvas_studio.api.events import router as events_router
from infinite_canvas_studio.api.health import router as health_router
from infinite_canvas_studio.api.projects import router as projects_router
from infinite_canvas_studio.core.exceptions import DomainError
from infinite_canvas_studio.core.library import resolve_library_layout
from infinite_canvas_studio.infrastructure.database import DatabaseRuntime
from infinite_canvas_studio.modules.canvases import CanvasService
from infinite_canvas_studio.modules.projects import ProjectService


def create_app(
    *, session_token: str | None = None, library_root: str | Path | None = None
) -> FastAPI:
    token = session_token or os.environ.get("ICS_SESSION_TOKEN")
    if not token:
        raise RuntimeError("ICS_SESSION_TOKEN is required to start the local API.")

    app = FastAPI(
        title="Infinite Canvas Studio Local API",
        version="0.0.0",
        docs_url=None,
        redoc_url=None,
    )
    configured_library = library_root or os.environ.get("ICS_LIBRARY_ROOT")
    app.state.library_status = "unconfigured"
    app.state.database = None
    app.state.project_service = None
    app.state.canvas_service = None

    if configured_library:
        database = DatabaseRuntime.open(resolve_library_layout(configured_library))
        project_service = ProjectService(database)
        project_service.ensure_default_project()
        app.state.database = database
        app.state.project_service = project_service
        app.state.canvas_service = CanvasService(database)
        app.state.library_status = "ready"

    @app.exception_handler(DomainError)
    async def handle_domain_error(_request: Request, error: DomainError):
        return JSONResponse(
            status_code=error.status_code,
            content={"code": error.code, "message": error.message, "retryable": error.retryable},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_request: Request, error: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "code": "request_invalid",
                "message": "Request body failed validation.",
                "retryable": False,
                "details": {"errors": error.errors()},
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_request: Request, error: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "internal_error",
                "message": "An unexpected error occurred.",
                "retryable": True,
            },
        )

    @app.middleware("http")
    async def require_session_token(request: Request, call_next):
        provided_token = request.headers.get("x-ics-session-token", "")
        if not compare_digest(provided_token, token):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "code": "session_unauthorized",
                    "message": "Local session is invalid or expired.",
                    "retryable": False,
                },
            )
        return await call_next(request)

    allowed_origins = [
        origin.strip()
        for origin in os.environ.get("ICS_ALLOWED_ORIGINS", "null").split(",")
        if origin.strip()
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["content-type", "x-ics-session-token"],
    )

    app.include_router(health_router)
    app.include_router(projects_router)
    app.include_router(canvases_router)
    app.include_router(events_router)
    return app
