import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

os.environ["TESTING"] = "true"

from src.services import sucursales as sucursales_service


@pytest.fixture(autouse=True)
def mock_firebase():
    with patch("auth.firebase.initialize_firebase"), \
         patch("src.services.sucursales.initialize_firebase"), \
         patch("firebase_admin.db.reference", return_value=MagicMock()):
        yield

def test_create_sucursal(db_session):
    sucursal = sucursales_service.create_sucursal(
        db_session=db_session,
        nombre="Sucursal Test",
        zona="Zona Norte",
        direccion={"address": "Av. Test 123", "lat": 0, "lng": 0},
        superficie="100m2",
        current_entity={"type": "usuario"},
    )
    assert sucursal.id is not None
    assert sucursal.nombre == "Sucursal Test"
    assert sucursal.zona == "Zona Norte"
    assert sucursal.direccion == "Av. Test 123"
    assert sucursal.superficie == "100m2"

def test_get_sucursales(db_session):
    # Crear dos sucursales
    sucursales_service.create_sucursal(
        db_session,
        "Sucursal 1",
        "Zona 1",
        {"address": "Dirección 1", "lat": 0, "lng": 0},
        "50m2",
        {"type": "usuario"},
    )
    sucursales_service.create_sucursal(
        db_session,
        "Sucursal 2",
        "Zona 2",
        {"address": "Dirección 2", "lat": 0, "lng": 0},
        "70m2",
        {"type": "usuario"},
    )

    sucursales = sucursales_service.get_sucursales(db_session)
    assert len(sucursales) == 2

def test_get_sucursal(db_session):
    nueva_sucursal = sucursales_service.create_sucursal(
        db_session,
        "Sucursal Única",
        "Zona Única",
        {"address": "Dirección Única", "lat": 0, "lng": 0},
        "150m2",
        {"type": "usuario"},
    )
    sucursal = sucursales_service.get_sucursal(db_session, nueva_sucursal.id)
    assert sucursal.nombre == "Sucursal Única"

def test_update_sucursal(db_session):
    nueva_sucursal = sucursales_service.create_sucursal(
        db_session,
        "Sucursal vieja",
        "Zona vieja",
        {"address": "Dirección vieja", "lat": 0, "lng": 0},
        "90m2",
        {"type": "usuario"},
    )
    actualizada = sucursales_service.update_sucursal(
        db_session,
        nueva_sucursal.id,
        {"type": "usuario"},
        nombre="Sucursal actualizada",
        zona="Zona actualizada",
        direccion={"address": "Dirección actualizada", "lat": 0, "lng": 0},
        superficie="95m2"
    )
    assert actualizada.nombre == "Sucursal actualizada"
    assert actualizada.zona == "Zona actualizada"

def test_delete_sucursal(db_session):
    nueva_sucursal = sucursales_service.create_sucursal(
        db_session,
        "Sucursal para borrar",
        "Zona X",
        {"address": "Dirección X", "lat": 0, "lng": 0},
        "60m2",
        {"type": "usuario"},
    )
    response = sucursales_service.delete_sucursal(db_session, nueva_sucursal.id, {"type": "usuario"})
    assert response["message"] == f"Sucursal con id {nueva_sucursal.id} eliminada"

    # Verificar que no existe más
    with pytest.raises(Exception):
        sucursales_service.get_sucursal(db_session, nueva_sucursal.id)


def test_create_sucursal_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            "Sucursal Fail",
            "Zona",
            {"address": "Dirección", "lat": 0, "lng": 0},
            "100m2",
            None,
        )
    assert exc.value.status_code == 401


def test_create_sucursal_invalid_direccion(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            "Sucursal Fail",
            "Zona",
            "no es un dict",
            "100m2",
            {"type": "usuario"},
        )
    assert exc.value.status_code == 400


def test_update_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.update_sucursal(
            db_session,
            999,
            {"type": "usuario"},
            nombre="Nueva",
        )
    assert exc.value.status_code == 404


def test_delete_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.delete_sucursal(
            db_session,
            999,
            {"type": "usuario"},
        )
    assert exc.value.status_code == 404
