from unittest.mock import patch


def test_verify_token_endpoint(client):
    with patch("controllers.auth.verify_user_token", return_value={"ok": True}):
        response = client.post("/auth/verify", headers={"Authorization": "Bearer token"})
    assert response.status_code == 200
    assert response.json() == {"ok": True}

