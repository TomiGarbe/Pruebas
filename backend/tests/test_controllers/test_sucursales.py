import pytest


def test_create_sucursal(client):
    response = client.post(
        "/sucursales/",
        json={
            "nombre": "Sucursal Controller",
            "zona": "Zona Controller",
            "direccion": {
                "address": "Dirección Controller",
                "lat": 0.0,
                "lng": 0.0,
            },
            "superficie": "80m2",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Sucursal Controller"
    assert "id" in data


def test_listar_sucursales(client):
    response = client.get("/sucursales/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_sucursal(client):
    post_response = client.post(
        "/sucursales/",
        json={
            "nombre": "Sucursal para GET",
            "zona": "Zona GET",
            "direccion": {
                "address": "Dirección GET",
                "lat": 0.0,
                "lng": 0.0,
            },
            "superficie": "85m2",
        },
    )
    sucursal_id = post_response.json()["id"]

    get_response = client.get(f"/sucursales/{sucursal_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == sucursal_id


def test_update_sucursal(client):
    post_response = client.post(
        "/sucursales/",
        json={
            "nombre": "Sucursal para UPDATE",
            "zona": "Zona",
            "direccion": {
                "address": "Dirección",
                "lat": 0.0,
                "lng": 0.0,
            },
            "superficie": "90m2",
        },
    )
    sucursal_id = post_response.json()["id"]

    put_response = client.put(
        f"/sucursales/{sucursal_id}",
        json={
            "nombre": "Sucursal Actualizada",
            "zona": "Zona Actualizada",
            "direccion": {
                "address": "Dirección Actualizada",
                "lat": 1.0,
                "lng": 1.0,
            },
            "superficie": "95m2",
        },
    )
    assert put_response.status_code == 200
    assert put_response.json()["nombre"] == "Sucursal Actualizada"


def test_delete_sucursal(client):
    post_response = client.post(
        "/sucursales/",
        json={
            "nombre": "Sucursal para DELETE",
            "zona": "Zona",
            "direccion": {
                "address": "Dirección",
                "lat": 0.0,
                "lng": 0.0,
            },
            "superficie": "100m2",
        },
    )
    sucursal_id = post_response.json()["id"]

    delete_response = client.delete(f"/sucursales/{sucursal_id}")
    assert delete_response.status_code == 200
    assert "eliminada" in delete_response.json()["message"]

