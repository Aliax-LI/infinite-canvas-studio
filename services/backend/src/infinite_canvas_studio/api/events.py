from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/v1/events", tags=["events"])


@router.get("")
async def stream_events(request: Request) -> StreamingResponse:
    """Server-Sent Events stream for real-time product updates."""

    async def event_generator() -> AsyncIterator[bytes]:
        while True:
            if await request.is_disconnected():
                break
            payload = {
                "timestamp": datetime.now(UTC).isoformat(),
                "libraryStatus": request.app.state.library_status,
            }
            yield f"data: {json.dumps(payload)}\n\n".encode()
            await asyncio.sleep(5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
