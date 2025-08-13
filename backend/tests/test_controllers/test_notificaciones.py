from unittest.mock import patch, MagicMock, AsyncMock


def test_notificaciones_correctivos_get(client):
    n = MagicMock(id=1, firebase_uid="uid", id_mantenimiento=1, mensaje="m", leida=False, created_at="now")
    with patch("controllers.notificaciones.get_notification_correctivo", return_value=[n]):
        resp = client.get("/notificaciones/correctivos/uid")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == 1


def test_notificaciones_nearby(client):
    with patch("controllers.notificaciones.notify_nearby_maintenances", AsyncMock(return_value={"message": "ok"})):
        payload = {"mantenimientos": [{"id": 1, "tipo": "correctivo", "mensaje": "hola"}]}
        resp = client.post("/notificaciones/nearby", json=payload)
    assert resp.status_code == 200
    assert resp.json()["message"] == "ok"

