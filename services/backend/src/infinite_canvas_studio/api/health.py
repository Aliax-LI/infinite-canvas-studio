import os

from fastapi import APIRouter, Request

router = APIRouter(prefix="/v1", tags=["system"])


@router.get("/health")
def health(request: Request) -> dict[str, int | str]:
    return {
        "status": "ok",
        "protocolVersion": 1,
        "processId": os.getpid(),
        "libraryStatus": getattr(request.app.state, "library_status", "unconfigured"),
    }
