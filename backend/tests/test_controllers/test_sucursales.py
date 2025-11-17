from unittest.mock import MagicMock, patch


def _sucursal_mock():
    return MagicMock(
        id=1,
        nombre="N",
        zona="Z",
        direccion="D",
        superficie="1",
        cliente_id=2,
        frecuencia_preventivo="Mensual",
    )


def test_sucursales_get_by_cliente(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.get_sucursales_by_cliente", return_value=[sucursal]):
        resp = client.get("/clientes/2/sucursales")
    assert resp.status_code == 200
    assert resp.json()[0] == {
        "id": 1,
        "nombre": "N",
        "zona": "Z",
        "direccion": "D",
        "superficie": "1",
        "cliente_id": 2,
        "frecuencia_preventivo": "Mensual",
    }


def test_sucursal_get(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.get_sucursal", return_value=sucursal):
        resp = client.get("/sucursales/1")
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "nombre": "N",
        "zona": "Z",
        "direccion": "D",
        "superficie": "1",
        "cliente_id": 2,
        "frecuencia_preventivo": "Mensual",
    }


def test_sucursal_create(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.create_sucursal", return_value=sucursal):
        payload = {
            "nombre": "N",
            "zona": "Z",
            "direccion": {"address": "A", "lat": 1.0, "lng": 1.0},
            "superficie": "1",
            "cliente_id": 2,
            "frecuencia_preventivo": "Mensual",
        }
        resp = client.post("/clientes/2/sucursales", json=payload)
    assert resp.status_code == 200
    assert resp.json()["cliente_id"] == 2


def test_sucursal_update(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.update_sucursal", return_value=sucursal):
        payload = {
            "nombre": "N",
            "zona": "Z",
            "direccion": {"address": "A", "lat": 1.0, "lng": 1.0},
            "superficie": "1",
            "frecuencia_preventivo": "Mensual",
        }
        resp = client.put("/sucursales/1", json=payload)
    assert resp.status_code == 200
    assert resp.json()["frecuencia_preventivo"] == "Mensual"


def test_sucursal_delete(client):
    mock_result = {"message": "Sucursal con id 1 eliminada"}
    with patch("controllers.sucursales.delete_sucursal", return_value=mock_result):
        resp = client.delete("/sucursales/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
