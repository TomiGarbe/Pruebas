import pytest
from fastapi import HTTPException

from src.services import preventivos as preventivos_service


def test_get_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.get_preventivo(db_session, 999)
    assert exc.value.status_code == 404


def test_create_preventivo_requires_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.create_preventivo(db_session, 1, "Sucursal", "mensual", None)
    assert exc.value.status_code == 401

