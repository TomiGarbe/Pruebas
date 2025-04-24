import pytest
from unittest.mock import AsyncMock, MagicMock
from src.controllers.sucursales import router
from src.api.schemas import SucursalCreate, SucursalUpdate
from fastapi import HTTPException

# Mock de las funciones de servicio
@pytest.fixture
def mock_services():
    from src.services import sucursales
    sucursales.get_sucursales = AsyncMock()
    sucursales.get_sucursal = AsyncMock()
    sucursales.create_sucursal = AsyncMock()
    sucursales.update_sucursal = AsyncMock()
    sucursales.delete_sucursal = AsyncMock()
    return sucursales

@pytest.mark.asyncio
async def test_get_sucursales_empty(mock_services):
    # Configurar el mock para devolver una lista vacía
    mock_services.get_sucursales.return_value = []
    
    # Simular la dependencia get_db
    db = MagicMock()
    
    # Llamar a la función del controlador
    result = await router.routes[0].endpoint(db=db)
    
    assert result == []
    mock_services.get_sucursales.assert_called_once_with(db)

@pytest.mark.asyncio
async def test_create_sucursal(mock_services):
    # Configurar el mock para devolver un objeto Sucursal
    mock_sucursal = MagicMock(id=1, nombre="Sucursal Test", zona="Zona Norte", direccion="Calle Falsa 123", superficie="100 m2")
    mock_services.create_sucursal.return_value = mock_sucursal
    
    # Datos de entrada
    sucursal_data = SucursalCreate(
        nombre="Sucursal Test",
        zona="Zona Norte",
        direccion="Calle Falsa 123",
        superficie="100 m2"
    )
    
    # Simular la dependencia get_db
    db = MagicMock()
    
    # Llamar a la función del controlador
    result = await router.routes[2].endpoint(sucursal_data, db=db)
    
    assert result == {
        "id": 1,
        "nombre": "Sucursal Test",
        "zona": "Zona Norte",
        "direccion": "Calle Falsa 123",
        "superficie": "100 m2"
    }
    mock_services.create_sucursal.assert_called_once_with(db, "Sucursal Test", "Zona Norte", "Calle Falsa 123", "100 m2")

@pytest.mark.asyncio
async def test_get_sucursal(mock_services):
    # Configurar el mock para devolver un objeto Sucursal
    mock_sucursal = MagicMock(id=1, nombre="Sucursal Test", zona="Zona Norte", direccion="Calle Falsa 123", superficie="100 m2")
    mock_services.get_sucursal.return_value = mock_sucursal
    
    # Simular la dependencia get_db
    db = MagicMock()
    
    # Llamar a la función del controlador
    result = await router.routes[1].endpoint(1, db=db)
    
    assert result == {
        "id": 1,
        "nombre": "Sucursal Test",
        "zona": "Zona Norte",
        "direccion": "Calle Falsa 123",
        "superficie": "100 m2"
    }
    mock_services.get_sucursal.assert_called_once_with(db, 1)

@pytest.mark.asyncio
async def test_get_sucursal_not_found(mock_services):
    # Configurar el mock para devolver None
    mock_services.get_sucursal.return_value = None
    
    # Simular la dependencia get_db
    db = MagicMock()
    
    # Verificar que se lanza HTTPException
    with pytest.raises(HTTPException) as exc:
        await router.routes[1].endpoint(999, db=db)
    
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"
    mock_services.get_sucursal.assert_called_once_with(db, 999)

@pytest.mark.asyncio
async def test_update_sucursal(mock_services):
    # Configurar el mock para devolver un objeto Sucursal actualizado
    mock_sucursal = MagicMock(id=1, nombre="Sucursal Actualizada", zona="Zona Sur", direccion="Calle Verdadera 456", superficie="200 m2")
    mock_services.update_sucursal.return_value = mock_sucursal
    
    # Datos de entrada
    update_data = SucursalUpdate(
        nombre="Sucursal Actualizada",
        zona="Zona Sur",
        direccion="Calle Verdadera 456",
        superficie="200 m2"
    )
    
    # Simular la dependencia get_db
    db = MagicMock()
    
    # Llamar a la función del controlador
    result = await router.routes[3].endpoint(1, update_data, db=db)
    
    assert result == {
        "id": 1,
        "nombre": "Sucursal Actualizada",
        "zona": "Zona Sur",
        "direccion": "Calle Verdadera 456",
        "superficie": "200 m2"
    }
    mock_services.update_sucursal.assert_called_once_with(db, 1, "Sucursal Actualizada", "Zona Sur", "Calle Verdadera 456", "200 m2")

@pytest.mark.asyncio
async def test_delete_sucursal(mock_services):
    # Configurar el mock para devolver un diccionario
    mock_services.delete_sucursal.return_value = {"message": "Sucursal con id 1 eliminada"}
    
    # Simular la dependencia get_db
    db = MagicMock()
    
    # Llamar a la función del controlador
    result = await router.routes[4].endpoint(1, db=db)
    
    assert result == {"message": "Sucursal con id 1 eliminada"}
    mock_services.delete_sucursal.assert_called_once_with(db, 1)