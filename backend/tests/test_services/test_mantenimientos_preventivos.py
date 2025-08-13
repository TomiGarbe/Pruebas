import asyncio
import pytest
from datetime import date
from fastapi import HTTPException

from src.services import mantenimientos_preventivos as mp


def test_create_preventivo_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mp.create_mantenimiento_preventivo(
                db_session,
                id_sucursal=1,
                frecuencia="Mensual",
                id_cuadrilla=1,
                fecha_apertura=date.today(),
                current_entity=None,
            )
        )
    assert exc.value.status_code == 401

