from unittest.mock import MagicMock, patch


def _cliente_mock():
    return MagicMock(id=1, nombre="ACME", contacto="Jane", email="user@example.com")


def test_clientes_get(client):
    cliente = _cliente_mock()
    with patch("controllers.clientes.get_clientes", return_value=[cliente]):
        resp = client.get("/clientes/")
    assert resp.status_code == 200
    assert resp.json()[0]["nombre"] == "ACME"


def test_cliente_get(client):
    cliente = _cliente_mock()
    with patch("controllers.clientes.get_cliente", return_value=cliente):
        resp = client.get("/clientes/1")
    assert resp.status_code == 200
    assert resp.json()["contacto"] == "Jane"


def test_cliente_create(client):
    cliente = _cliente_mock()
    with patch("controllers.clientes.create_cliente", return_value=cliente):
        payload = {"nombre": "ACME", "contacto": "Jane", "email": "user@example.com"}
        resp = client.post("/clientes/", json=payload)
    assert resp.status_code == 200
    assert resp.json()["email"] == "user@example.com"


def test_cliente_update(client):
    cliente = _cliente_mock()
    with patch("controllers.clientes.update_cliente", return_value=cliente):
        payload = {"nombre": "ACME 2"}
        resp = client.put("/clientes/1", json=payload)
    assert resp.status_code == 200
    assert resp.json()["id"] == 1


def test_cliente_delete(client):
    mock_result = {"message": "Cliente con id 1 eliminado"}
    with patch("controllers.clientes.delete_cliente", return_value=mock_result):
        resp = client.delete("/clientes/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
