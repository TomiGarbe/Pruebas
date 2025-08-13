from unittest.mock import patch, MagicMock, AsyncMock


def test_list_mantenimientos_correctivos(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        id_cuadrilla=1,
        fecha_apertura="2023-01-01",
        fecha_cierre=None,
        numero_caso="1",
        incidente="i",
        rubro="r",
        planilla=None,
        fotos=[],
        estado="e",
        prioridad="p",
        extendido=None,
    )
    with patch("controllers.mantenimientos_correctivos.get_mantenimientos_correctivos", return_value=[m]):
        resp = client.get("/mantenimientos-correctivos/")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == 1


def test_create_mantenimiento_correctivo(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        id_cuadrilla=1,
        fecha_apertura="2023-01-01",
        numero_caso="1",
        incidente="i",
        rubro="r",
        estado="e",
        prioridad="p",
    )
    with patch("controllers.mantenimientos_correctivos.create_mantenimiento_correctivo", AsyncMock(return_value=m)):
        payload = {
            "id_sucursal": 1,
            "id_cuadrilla": 1,
            "fecha_apertura": "2023-01-01",
            "numero_caso": "1",
            "incidente": "Incidente",
            "rubro": "Otros",
            "estado": "Pendiente",
            "prioridad": "Baja",
        }
        resp = client.post("/mantenimientos-correctivos/", json=payload)
    assert resp.status_code == 200
    assert resp.json()["id"] == 1

