import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    """Create test client with proper host header"""
    with TestClient(app) as test_client:
        test_client.headers.update({"host": "localhost"})
        yield test_client

@pytest.fixture
def async_client():
    """Create async test client"""
    from httpx import AsyncClient
    client = AsyncClient(app=app, base_url="http://localhost")
    return client
