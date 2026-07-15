from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["system"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.0.0"}
