from unittest.mock import patch, AsyncMock
import asyncio
from datetime import date
from src.services import mantenimientos_preventivos as mp
from src.api.models import Sucursal, Preventivo, Cuadrilla

@patch("src.services.mantenimientos_preventivos.notify_users_preventivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_preventivos.append_preventivo")
def test_create_preventivo(mock_append, mock_notify, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    db_session.add(sucursal)
    db_session.commit()

    preventivo = Preventivo(id_sucursal=sucursal.id, nombre_sucursal="S", frecuencia="Mensual")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([preventivo, cuadrilla])
    db_session.commit()

    result = asyncio.run(
        mp.create_mantenimiento_preventivo(
            db_session,
            id_sucursal=sucursal.id,
            frecuencia="Mensual",
            id_cuadrilla=cuadrilla.id,
            fecha_apertura=date.today(),
            current_entity={"type": "usuario"},
        )
    )

    assert result.frecuencia == "Mensual"

@patch("src.services.mantenimientos_preventivos.notify_users_preventivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_preventivos.append_preventivo")
@patch("src.services.mantenimientos_preventivos.delete_preventivo")
def test_delete_preventivo(mock_delete_preventivo, mock_append, mock_notify, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    db_session.add(sucursal)
    db_session.commit()

    preventivo = Preventivo(id_sucursal=sucursal.id, nombre_sucursal="S", frecuencia="Mensual")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([preventivo, cuadrilla])
    db_session.commit()

    mantenimiento = asyncio.run(
        mp.create_mantenimiento_preventivo(
            db_session,
            sucursal.id,
            "Mensual",
            cuadrilla.id,
            date.today(),
            {"type": "usuario"},
        )
    )

    result = mp.delete_mantenimiento_preventivo(db_session, mantenimiento.id, {"type": "usuario"})

    assert "eliminado" in result["message"]
