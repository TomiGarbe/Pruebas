from unittest.mock import patch, MagicMock, AsyncMock


def test_list_mantenimientos_preventivos(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        frecuencia="m",
        id_cuadrilla=1,
        fecha_apertura="2023-01-01",
        fecha_cierre=None,
        planillas=[],
        fotos=[],
        extendido=None,
    )
    with patch("controllers.mantenimientos_preventivos.get_mantenimientos_preventivos", return_value=[m]):
        resp = client.get("/mantenimientos-preventivos/")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == 1


def test_create_mantenimiento_preventivo(client):
    m = MagicMock(id=1, id_sucursal=1, frecuencia="Mensual", id_cuadrilla=1, fecha_apertura="2023-01-01")
    with patch("controllers.mantenimientos_preventivos.create_mantenimiento_preventivo", AsyncMock(return_value=m)):
        payload = {"id_sucursal": 1, "frecuencia": "Mensual", "id_cuadrilla": 1, "fecha_apertura": "2023-01-01"}
        resp = client.post("/mantenimientos-preventivos/", json=payload)
    assert resp.status_code == 200
    assert resp.json()["id"] == 1

