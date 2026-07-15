from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, patch

from httpx import ASGITransport, AsyncClient

from infinite_canvas_studio.app import create_app


def headers() -> dict[str, str]:
    return {"x-ics-session-token": "test-session-token"}


def test_unconfigured_library_returns_503(tmp_path) -> None:
    """When library_root is not set, service endpoints return 503."""
    from fastapi.testclient import TestClient

    client = TestClient(create_app(session_token="test-session-token"))
    response = client.get("/v1/projects", headers=headers())

    assert response.status_code == 503
    body = response.json()
    assert body["code"] == "library_unavailable"
    assert body["retryable"] is True


def test_health_reports_library_status(tmp_path) -> None:
    from fastapi.testclient import TestClient

    ready = TestClient(create_app(session_token="test-session-token", library_root=tmp_path))
    unconfigured = TestClient(create_app(session_token="test-session-token"))

    ready_response = ready.get("/v1/health", headers=headers())
    unconfigured_response = unconfigured.get("/v1/health", headers=headers())

    assert ready_response.status_code == 200
    assert ready_response.json()["libraryStatus"] == "ready"
    assert unconfigured_response.status_code == 200
    assert unconfigured_response.json()["libraryStatus"] == "unconfigured"


def test_events_endpoint_streams_sse(tmp_path) -> None:
    """SSE endpoint returns streaming headers without hanging on the infinite stream."""

    async def run() -> None:
        app = create_app(session_token="test-session-token", library_root=tmp_path)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            request = client.build_request("GET", "/v1/events", headers=headers())
            # Mock asyncio.sleep to break the SSE loop after the first event
            with patch("asyncio.sleep", new=AsyncMock(side_effect=asyncio.CancelledError)):
                response = await client.send(request, stream=True)
                try:
                    assert response.status_code == 200
                    assert "text/event-stream" in response.headers["content-type"]
                    assert response.headers.get("cache-control") == "no-cache"
                    assert response.headers.get("x-accel-buffering") == "no"
                finally:
                    await response.aclose()

    asyncio.run(run())
