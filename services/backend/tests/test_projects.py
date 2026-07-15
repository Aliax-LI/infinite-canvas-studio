from fastapi.testclient import TestClient
from sqlalchemy import text

from infinite_canvas_studio.app import create_app
from infinite_canvas_studio.infrastructure.database.runtime import create_sqlite_engine


def make_client(tmp_path) -> TestClient:
    return TestClient(create_app(session_token="test-session-token", library_root=tmp_path))


def headers() -> dict[str, str]:
    return {"x-ics-session-token": "test-session-token"}


def test_creates_default_project_and_persists_new_projects(tmp_path) -> None:
    client = make_client(tmp_path)

    initial = client.get("/v1/projects", headers=headers())
    created = client.post("/v1/projects", headers=headers(), json={"name": "概念设计"})
    restored = make_client(tmp_path).get("/v1/projects", headers=headers())

    assert initial.status_code == 200
    assert initial.json()[0]["name"] == "未命名项目"
    assert initial.json()[0]["isDefault"] is True
    assert created.status_code == 201
    assert created.json()["name"] == "概念设计"
    assert [project["name"] for project in restored.json()] == ["未命名项目", "概念设计"]


def test_rejects_blank_project_name(tmp_path) -> None:
    response = make_client(tmp_path).post("/v1/projects", headers=headers(), json={"name": "  "})

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "invalid_project_name"
    assert body["retryable"] is False


def test_rejects_unauthorized_request(tmp_path) -> None:
    client = make_client(tmp_path)
    response = client.get("/v1/projects", headers={"x-ics-session-token": "wrong-token"})

    assert response.status_code == 401
    body = response.json()
    assert body["code"] == "session_unauthorized"


def test_rejects_malformed_request_body(tmp_path) -> None:
    response = make_client(tmp_path).post("/v1/projects", headers=headers(), json={"name": 123})

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "request_invalid"
    assert "details" in body


def test_initialization_enables_sqlite_safety_pragmas_and_migration(tmp_path) -> None:
    make_client(tmp_path)
    database_path = tmp_path / "database" / "studio.sqlite3"

    engine = create_sqlite_engine(database_path)
    with engine.connect() as connection:
        foreign_keys = connection.execute(text("PRAGMA foreign_keys")).scalar_one()
        journal_mode = connection.execute(text("PRAGMA journal_mode")).scalar_one()
        revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
    engine.dispose()

    assert foreign_keys == 1
    assert journal_mode == "wal"
    assert revision == "20260715_01"
