import os

import uvicorn

from infinite_canvas_studio.app import create_app


def run() -> None:
    uvicorn.run(
        create_app(),
        host="127.0.0.1",
        port=int(os.environ.get("ICS_BACKEND_PORT", "8765")),
        access_log=False,
    )


if __name__ == "__main__":
    run()
