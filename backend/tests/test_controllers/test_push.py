from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)


def test_push_subscribe_and_list(client):
    data = {
        "endpoint": "https://example.com",
        "keys": {"p256dh": "k", "auth": "a"},
        "firebase_uid": "uid1"
    }
    r = client.post("/push/subscribe", json=data)
    assert r.status_code == 200
    r = client.get("/push/subscriptions/uid1")
    assert r.status_code == 200
    assert len(r.json()) == 1

