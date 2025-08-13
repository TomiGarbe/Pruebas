import pytest
from fastapi import HTTPException

from src.services import cuadrillas as cuadrillas_service


def test_get_cuadrillas_empty(db_session):
    assert cuadrillas_service.get_cuadrillas(db_session) == []


def test_get_cuadrilla_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        cuadrillas_service.get_cuadrilla(db_session, 999)
    assert exc.value.status_code == 404

