import pytest
import asyncio
import pytest
from datetime import date
from fastapi import HTTPException

from src.services import mantenimientos_correctivos as mc


def test_create_correctivo_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mc.create_mantenimiento_correctivo(
                db_session,
                id_sucursal=1,
                id_cuadrilla=1,
                fecha_apertura=date.today(),
                numero_caso="1",
                incidente="inc",
                rubro="rubro",
                estado="abierto",
                prioridad="baja",
                current_entity=None,
            )
        )
    assert exc.value.status_code == 401

