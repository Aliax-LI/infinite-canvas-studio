from fastapi.testclient import TestClient

from infinite_canvas_studio.app import create_app


def test_health() -> None:
    response = TestClient(create_app()).get("/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
