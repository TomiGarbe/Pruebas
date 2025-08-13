from unittest.mock import patch, MagicMock


def test_push_subscribe(client):
    with patch("controllers.push.save_subscription", return_value={"message": "saved"}):
        payload = {
            "endpoint": "e",
            "keys": {"p256dh": "p", "auth": "a"},
            "firebase_uid": "uid",
            "device_info": "d",
        }
        resp = client.post("/push/subscribe", json=payload)
    assert resp.status_code == 200
    assert resp.json()["message"] == "saved"


def test_push_list(client):
    sub = MagicMock(id=1, endpoint="e")
    with patch("controllers.push.get_subscriptions", return_value=[sub]):
        resp = client.get("/push/subscriptions/uid")
    assert resp.status_code == 200
    assert resp.json()[0]["endpoint"] == "e"

