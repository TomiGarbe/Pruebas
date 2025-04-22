import pytest
from unittest.mock import Mock
from services.sucursales import get_sucursales, get_sucursal, create_sucursal, update_sucursal, delete_sucursal
from api.models import Sucursal
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_get_sucursales():
    # Mock de la sesión de base de datos
    db = Mock()
    db.query.return_value.all.return_value = [
        Sucursal(id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²"),
        Sucursal(id=2, nombre="Sucursal 2", zona="Zona B", direccion="Calle 456", superficie="200 m²")
    ]
    
    result = get_sucursales(db)
    assert len(result) == 2
    assert result[0].nombre == "Sucursal 1"
    assert result[1].nombre == "Sucursal 2"

@pytest.mark.asyncio
async def test_get_sucursal_found():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = Sucursal(
        id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²"
    )
    
    result = get_sucursal(db, 1)
    assert result.id == 1
    assert result.nombre == "Sucursal 1"

@pytest.mark.asyncio
async def test_get_sucursal_not_found():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        get_sucursal(db, 999)
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"

@pytest.mark.asyncio
async def test_create_sucursal():
    db = Mock()
    db.add = Mock()
    db.commit = Mock()
    db.refresh = Mock()
    
    result = create_sucursal(db, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²")
    assert result.nombre == "Sucursal 1"
    assert db.add.called
    assert db.commit.called
    assert db.refresh.called

@pytest.mark.asyncio
async def test_update_sucursal():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = Sucursal(
        id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²"
    )
    db.commit = Mock()
    db.refresh = Mock()
    
    result = update_sucursal(db, 1, nombre="Sucursal Actualizada", zona="Zona B")
    assert result.nombre == "Sucursal Actualizada"
    assert result.zona == "Zona B"
    assert db.commit.called
    assert db.refresh.called

@pytest.mark.asyncio
async def test_update_sucursal_not_found():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        update_sucursal(db, 999, nombre="Sucursal Actualizada")
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"

@pytest.mark.asyncio
async def test_delete_sucursal():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = Sucursal(
        id=1, nombre="Sucursal 1", zona="Zona A", direccion="Calle 123", superficie="100 m²"
    )
    db.delete = Mock()
    db.commit = Mock()
    
    result = delete_sucursal(db, 1)
    assert result == {"message": "Sucursal con id 1 eliminada"}
    assert db.delete.called
    assert db.commit.called

@pytest.mark.asyncio
async def test_delete_sucursal_not_found():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    
    with pytest.raises(HTTPException) as exc:
        delete_sucursal(db, 999)
    assert exc.value.status_code == 404
    assert exc.value.detail == "Sucursal no encontrada"