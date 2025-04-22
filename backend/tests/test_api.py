import pytest
from fastapi.testclient import TestClient
from api.routes import app, origins

@pytest.mark.asyncio
async def test_app_initialization():
    client = TestClient(app)
    assert client is not None
    # Verificar que la aplicación responde a una solicitud básica
    response = client.get("/sucursales/")
    assert response.status_code in [200, 404]  # Puede devolver 200 (vacío) o 404 dependiendo de la configuración

@pytest.mark.asyncio
async def test_cors_configuration():
    client = TestClient(app)
    # Simular una solicitud con un origen permitido
    response = client.get("/sucursales/", headers={"Origin": origins[0]})
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" in response.headers
    assert response.headers["Access-Control-Allow-Origin"] == origins[0]

@pytest.mark.asyncio
async def test_routers_included():
    # Verificar que los routers están registrados
    routes = [route.path for route in app.routes]
    assert "/sucursales/" in routes
    assert "/users/" in routes
    assert "/cuadrillas/" in routes
    assert "/preventivos/" in routes
    assert "/mantenimientos_preventivos/" in routes
    assert "/mantenimientos_correctivos/" in routes
    assert "/reportes/" in routes
    assert "/zonas/" in routes