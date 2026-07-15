import os

import uvicorn

from infinite_canvas_studio.app import create_app


def run() -> None:
    if not os.environ.get("ICS_SESSION_TOKEN"):
        raise RuntimeError("ICS_SESSION_TOKEN is required to start the local API.")
    if not os.environ.get("ICS_LIBRARY_ROOT"):
        raise RuntimeError("ICS_LIBRARY_ROOT is required to start the local API.")

    uvicorn.run(
        create_app(),
        host="127.0.0.1",
        port=int(os.environ.get("ICS_BACKEND_PORT", "8765")),
        access_log=False,
    )


if __name__ == "__main__":
    run()
