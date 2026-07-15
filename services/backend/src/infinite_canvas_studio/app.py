from fastapi import FastAPI

from infinite_canvas_studio.api.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Infinite Canvas Studio Local API",
        version="0.0.0",
        docs_url=None,
        redoc_url=None,
    )
    app.include_router(health_router)
    return app
