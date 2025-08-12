import os

os.environ["TESTING"] = "true"

import pytest

created_zona_id = None

def test_create_zona(client):
    global created_zona_id
    response = client.post("/zonas/", json={
        "nombre": "Zona Test"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Zona Test"
    assert "id" in data
    created_zona_id = data["id"]

def test_create_zona_already_exists(client):
    response = client.post("/zonas/", json={
        "nombre": "Zona Test"
    })
    assert response.status_code == 400
    assert "ya existe" in response.json()["detail"]

def test_listar_zonas(client):
    response = client.get("/zonas/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_delete_zona(client):
    global created_zona_id
    delete_response = client.delete(f"/zonas/{created_zona_id}")
    assert delete_response.status_code == 200
    assert "eliminada" in delete_response.json()["message"]

def test_delete_zona_not_found(client):
    response = client.delete("/zonas/9999999")
    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"]
