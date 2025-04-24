import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.sucursales import get_sucursales, get_sucursal, create_sucursal, update_sucursal, delete_sucursal
from src.api.models import Sucursal
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_get_sucursales():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    query_mock.all.return_value = [
        Sucursal(id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²"),
        Sucursal(id=2, nombre="Sucursal 2", zona="Zona B", direccion="Calle 456", superficie="200 m²")
    ]
    
    # Llamar a la función
    result = await get_sucursales(db)
    
    assert len(result) == 2
    assert result[0].nombre == "Sucursal 1"
    assert result[1].nombre == "Sucursal 2"
    db.query.assert_called_once_with(Sucursal)
    query_mock.all.assert_called_once()

@pytest.mark.asyncio
async def test_get_sucursal_found():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    mock_sucursal = Sucursal(id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    query_mock.filter.return_value.first.return_value = mock_sucursal
    
    # Llamar a la función
    result = await get_sucursal(db, 1)
    
    assert result.id == 1
    assert result.nombre == "Sucursal 1"
    db.query.assert_called_once_with(Sucursal)
    query_mock.filter.assert_called_once()
    query_mock.filter.return_value.first.assert_called_once()

@pytest.mark.asyncio
async def test_get_sucursal_not_found():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    query_mock.filter.return_value.first.return_value = None
    
    # Llamar a la función
    with pytest.raises(HTTPException) as exc:
        await get_sucursal(db, 999)
    
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"
    db.query.assert_called_once_with(Sucursal)
    query_mock.filter.assert_called_once()
    query_mock.filter.return_value.first.assert_called_once()

@pytest.mark.asyncio
async def test_create_sucursal():
    # Simular la sesión de base de datos
    db = MagicMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    
    # Llamar a la función
    result = await create_sucursal(db, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    
    assert result.nombre == "Sucursal 1"
    assert result.zona == "Zona A"
    assert result.direccion == "Calle 123"
    assert result.superficie == "100 m²"
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_update_sucursal():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    mock_sucursal = Sucursal(id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    query_mock.filter.return_value.first.return_value = mock_sucursal
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    
    # Llamar a la función
    result = await update_sucursal(db, 1, nombre="Sucursal Actualizada", zona="Zona B", direccion="Calle 456", superficie="200 m²")
    
    assert result.nombre == "Sucursal Actualizada"
    assert result.zona == "Zona B"
    assert result.direccion == "Calle 456"
    assert result.superficie == "200 m²"
    db.query.assert_called_once_with(Sucursal)
    query_mock.filter.assert_called_once()
    query_mock.filter.return_value.first.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_update_sucursal_not_found():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    query_mock.filter.return_value.first.return_value = None
    
    # Llamar a la función
    with pytest.raises(HTTPException) as exc:
        await update_sucursal(db, 999, nombre="Sucursal Actualizada", zona="Zona B", direccion="Calle 456", superficie="200 m²")
    
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"
    db.query.assert_called_once_with(Sucursal)
    query_mock.filter.assert_called_once()
    query_mock.filter.return_value.first.assert_called_once()

@pytest.mark.asyncio
async def test_delete_sucursal():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    mock_sucursal = Sucursal(id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    query_mock.filter.return_value.first.return_value = mock_sucursal
    db.delete = MagicMock()
    db.commit = AsyncMock()
    
    # Llamar a la función
    result = await delete_sucursal(db, 1)
    
    assert result == {"message": "Sucursal con id 1 eliminada"}
    db.query.assert_called_once_with(Sucursal)
    query_mock.filter.assert_called_once()
    query_mock.filter.return_value.first.assert_called_once()
    db.delete.assert_called_once_with(mock_sucursal)
    db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_delete_sucursal_not_found():
    # Simular la sesión de base de datos
    db = MagicMock()
    query_mock = MagicMock()
    db.query.return_value = query_mock
    query_mock.filter.return_value.first.return_value = None
    
    # Llamar a la función
    with pytest.raises(HTTPException) as exc:
        await delete_sucursal(db, 999)
    
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"
    db.query.assert_called_once_with(Sucursal)
    query_mock.filter.assert_called_once()
    query_mock.filter.return_value.first.assert_called_once()