from fastapi.testclient import TestClient

from infinite_canvas_studio.app import create_app


def test_creates_lists_and_persists_project_canvases(tmp_path) -> None:
    token = "test-session-token"
    app = create_app(session_token=token, library_root=tmp_path)
    client = TestClient(app)
    headers = {"x-ics-session-token": token}
    project = client.get("/v1/projects", headers=headers).json()[0]
    url = f"/v1/projects/{project['id']}/canvases"

    standard = client.post(
        url,
        headers=headers,
        json={"name": "产品草图", "kind": "standard"},
    )
    smart = client.post(
        url,
        headers=headers,
        json={"name": "感兴借借", "kind": "smart"},
    )

    assert standard.status_code == 201
    assert standard.json()["sortOrder"] == 0
    assert smart.status_code == 201
    assert smart.json()["sortOrder"] == 1

    listed = client.get(url, headers=headers)
    assert listed.status_code == 200
    assert [(canvas["name"], canvas["kind"]) for canvas in listed.json()] == [
        ("产品草图", "standard"),
        ("感兴借借", "smart"),
    ]

    restarted_client = TestClient(create_app(session_token=token, library_root=tmp_path))
    persisted = restarted_client.get(url, headers=headers)
    assert [canvas["id"] for canvas in persisted.json()] == [
        standard.json()["id"],
        smart.json()["id"],
    ]


def test_rejects_invalid_or_missing_canvas_parent(tmp_path) -> None:
    token = "test-session-token"
    client = TestClient(create_app(session_token=token, library_root=tmp_path))
    headers = {"x-ics-session-token": token}

    missing = client.get("/v1/projects/missing/canvases", headers=headers)
    invalid = client.post(
        "/v1/projects/missing/canvases",
        headers=headers,
        json={"name": "画布", "kind": "standard"},
    )

    assert missing.status_code == 404
    assert missing.json()["code"] == "project_not_found"
    assert invalid.status_code == 404
    assert invalid.json()["code"] == "project_not_found"


def test_rejects_blank_canvas_name(tmp_path) -> None:
    token = "test-session-token"
    client = TestClient(create_app(session_token=token, library_root=tmp_path))
    headers = {"x-ics-session-token": token}
    project = client.get("/v1/projects", headers=headers).json()[0]
    url = f"/v1/projects/{project['id']}/canvases"

    response = client.post(url, headers=headers, json={"name": "  ", "kind": "standard"})

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "invalid_canvas_name"
    assert body["retryable"] is False
