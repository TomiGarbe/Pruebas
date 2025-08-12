import pytest
from src.services import zonas as zonas_service
from fastapi import HTTPException
from api.models import Sucursal, Cuadrilla

def test_create_zona(db_session):
    zona = zonas_service.create_zona(
        db_session, nombre="Zona Test", current_entity={"type": "usuario"}
    )
    assert zona.id is not None
    assert zona.nombre == "Zona Test"

def test_create_zona_already_exists(db_session):
    zonas_service.create_zona(
        db_session, nombre="Zona Duplicada", current_entity={"type": "usuario"}
    )
    with pytest.raises(HTTPException) as exc:
        zonas_service.create_zona(
            db_session, nombre="Zona Duplicada", current_entity={"type": "usuario"}
        )
    assert exc.value.status_code == 400
    assert "ya existe" in exc.value.detail

def test_get_zonas(db_session):
    zonas_service.create_zona(
        db_session, nombre="Zona 1", current_entity={"type": "usuario"}
    )
    zonas_service.create_zona(
        db_session, nombre="Zona 2", current_entity={"type": "usuario"}
    )
    zonas = zonas_service.get_zonas(db_session)
    assert len(zonas) == 2

def test_delete_zona(db_session):
    nueva_zona = zonas_service.create_zona(
        db_session, nombre="Zona para borrar", current_entity={"type": "usuario"}
    )
    response = zonas_service.delete_zona(
        db_session, nueva_zona.id, current_entity={"type": "usuario"}
    )
    assert response["message"] == "Zona eliminada"

    # Verificar que no existe más
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(
            db_session, nueva_zona.id, current_entity={"type": "usuario"}
        )
    assert exc.value.status_code == 404

def test_delete_zona_in_use(db_session, mocker):
    # Crear una zona
    nueva_zona = zonas_service.create_zona(
        db_session, nombre="Zona en uso", current_entity={"type": "usuario"}
    )

    # Mockear solo la consulta específica para simular que la zona está en uso
    original_query = db_session.query

    def query_side_effect(model):
        query = original_query(model)
        if model in (Sucursal, Cuadrilla):
            original_filter = query.filter

            def filter_side_effect(*args, **kwargs):
                filtered_query = original_filter(*args, **kwargs)
                mocker.patch.object(filtered_query, "count", return_value=1)
                return filtered_query

            query.filter = filter_side_effect
        return query

    mocker.patch.object(db_session, "query", side_effect=query_side_effect)

    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(
            db_session, nueva_zona.id, current_entity={"type": "usuario"}
        )
    assert exc.value.status_code == 400
    assert "está en uso" in exc.value.detail
