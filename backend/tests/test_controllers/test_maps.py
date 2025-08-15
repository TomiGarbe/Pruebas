from types import SimpleNamespace
from unittest.mock import patch, AsyncMock

def test_sucursales_locations(client):
    s = SimpleNamespace(id="1", name="S", lat=1.0, lng=2.0)
    with patch("controllers.maps.get_sucursales_locations", return_value=[s]):
        resp = client.get("/maps/sucursales-locations")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "1", "name": "S", "lat": 1.0, "lng": 2.0}]

def test_users_locations(client):
    c = SimpleNamespace(id="1", tipo="C", name="C", lat=1.0, lng=2.0)
    with patch("controllers.maps.get_users_locations", return_value=[c]):
        resp = client.get("/maps/users-locations")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "1", "tipo": "C", "name": "C", "lat": 1.0, "lng": 2.0}]

def test_correctivos_selection(client):
    c = SimpleNamespace(id_mantenimiento="1", id_sucursal="1")
    with patch("controllers.maps.get_correctivos", return_value=[c]):
        resp = client.get("/maps/correctivo-selection/1")
    assert resp.status_code == 200
    assert resp.json() == [{"id_mantenimiento": "1", "id_sucursal": "1"}]

def test_preventivos_selection(client):
    p = SimpleNamespace(id_mantenimiento="1", id_sucursal="1")
    with patch("controllers.maps.get_preventivos", return_value=[p]):
        resp = client.get("/maps/preventivo-selection/1")
    assert resp.status_code == 200
    assert resp.json() == [{"id_mantenimiento": "1", "id_sucursal": "1"}]

def test_update_user_location(client):
    current_entity_mock = {
        "type": "usuario",
        "data": {
            "uid": "UID123",
            "id": "1",
            "rol": "admin"
        }
    }
    payload = {
        "name": "N", 
        "lat": 1.0, 
        "lng": 2.0
    }
    with patch("controllers.maps.update_user_location", AsyncMock(return_value={"message": "Ubicación actualizada para 1"})):
        client.app.state.current_entity = current_entity_mock
        resp = client.post("/maps/update-user-location", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"message": "Ubicación actualizada para 1"}
