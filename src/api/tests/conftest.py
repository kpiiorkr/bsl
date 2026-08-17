import httpx
import pytest

from app.config import Settings
from app.factory import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(
        neis_api_key="test-key",
        neis_base_url="https://neis.test",
        allowed_origins=["http://localhost:5173"],
        http_timeout_seconds=1,
    )


@pytest.fixture
async def api_client(settings: Settings):
    transport = httpx.ASGITransport(app=create_app(settings), raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
