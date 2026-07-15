from fastapi.testclient import TestClient

from infinite_canvas_studio.app import create_app


def test_health(tmp_path) -> None:
    response = TestClient(
        create_app(session_token="test-session-token", library_root=tmp_path)
    ).get(
        "/v1/health", headers={"x-ics-session-token": "test-session-token"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["protocolVersion"] == 1
    assert response.json()["libraryStatus"] == "ready"


def test_health_rejects_missing_session_token(tmp_path) -> None:
    response = TestClient(
        create_app(session_token="test-session-token", library_root=tmp_path)
    ).get("/v1/health")

    assert response.status_code == 401
    assert response.json()["code"] == "session_unauthorized"


def test_health_allows_configured_renderer_origin(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("ICS_ALLOWED_ORIGINS", "http://127.0.0.1:5173,null")

    response = TestClient(
        create_app(session_token="test-session-token", library_root=tmp_path)
    ).get(
        "/v1/health",
        headers={
            "origin": "http://127.0.0.1:5173",
            "x-ics-session-token": "test-session-token",
        },
    )

    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
