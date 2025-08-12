import pytest


def test_create_zona(client):
    response = client.post("/zonas/", json={"nombre": "Zona Test"})
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Zona Test"
    assert "id" in data


def test_create_zona_already_exists(client):
    client.post("/zonas/", json={"nombre": "Zona Test"})
    response = client.post("/zonas/", json={"nombre": "Zona Test"})
    assert response.status_code == 400
    assert "ya existe" in response.json()["detail"]


def test_listar_zonas(client):
    client.post("/zonas/", json={"nombre": "Zona A"})
    response = client.get("/zonas/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_delete_zona(client):
    create_resp = client.post("/zonas/", json={"nombre": "Zona Delete"})
    zona_id = create_resp.json()["id"]
    delete_resp = client.delete(f"/zonas/{zona_id}")
    assert delete_resp.status_code == 200
    assert "eliminada" in delete_resp.json()["message"]


def test_delete_zona_not_found(client):
    response = client.delete("/zonas/9999999")
    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"]

