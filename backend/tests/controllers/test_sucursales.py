import pytest
from api.models import Sucursal

@pytest.mark.asyncio
async def test_get_sucursales_empty(client):
    response = client.get("/sucursales/")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_create_sucursal(client, db_session):
    sucursal_data = {
        "nombre": "Sucursal 1",
        "zona": "Zona A",
        "direccion": "Calle 123",
        "superficie": "100 m²"
    }
    response = client.post("/sucursales/", json=sucursal_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Sucursal 1"
    assert data["zona"] == "Zona A"
    assert data["direccion"] == "Calle 123"
    assert data["superficie"] == "100 m²"
    assert "id" in data

@pytest.mark.asyncio
async def test_get_sucursal(client, db_session):
    # Crear una sucursal en la base de datos
    db_sucursal = Sucursal(nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    db_session.add(db_sucursal)
    db_session.commit()
    db_session.refresh(db_sucursal)
    
    response = client.get(f"/sucursales/{db_sucursal.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == db_sucursal.id
    assert data["nombre"] == "Sucursal 1"

@pytest.mark.asyncio
async def test_get_sucursal_not_found(client):
    response = client.get("/sucursales/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Sucursal no encontrada"}

@pytest.mark.asyncio
async def test_update_sucursal(client, db_session):
    # Crear una sucursal
    db_sucursal = Sucursal(nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    db_session.add(db_sucursal)
    db_session.commit()
    db_session.refresh(db_sucursal)
    
    update_data = {
        "nombre": "Sucursal Actualizada",
        "zona": "Zona B",
        "direccion": "Calle 456",
        "superficie": "200 m²"
    }
    response = client.put(f"/sucursales/{db_sucursal.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Sucursal Actualizada"
    assert data["zona"] == "Zona B"

@pytest.mark.asyncio
async def test_delete_sucursal(client, db_session):
    # Crear una sucursal
    db_sucursal = Sucursal(nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    db_session.add(db_sucursal)
    db_session.commit()
    db_session.refresh(db_sucursal)
    
    response = client.delete(f"/sucursales/{db_sucursal.id}")
    assert response.status_code == 200
    assert response.json() == {"message": f"Sucursal con id {db_sucursal.id} eliminada"}
    
    # Verificar que la sucursal fue eliminada
    response = client.get(f"/sucursales/{db_sucursal.id}")
    assert response.status_code == 404