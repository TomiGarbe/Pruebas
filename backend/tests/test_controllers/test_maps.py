from types import SimpleNamespace
from unittest.mock import patch

def test_sucursales_locations(client):
    s = SimpleNamespace(id="1", name="S", lat=1.0, lng=2.0)
    with patch("controllers.maps.get_sucursales_locations", return_value=[s]):
        resp = client.get("/maps/sucursales-locations")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "1", "name": "S", "lat": 1.0, "lng": 2.0}]

def test_users_locations(client):
    s = SimpleNamespace(id="1", tipo="C", name="C", lat=1.0, lng=2.0)
    with patch("controllers.maps.get_users_locations", return_value=[s]):
        resp = client.get("/maps/users-locations")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "1", "tipo": "C", "name": "C", "lat": 1.0, "lng": 2.0}]
