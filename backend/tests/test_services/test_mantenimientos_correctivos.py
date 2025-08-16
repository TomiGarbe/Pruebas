from unittest.mock import patch, AsyncMock
import asyncio
from datetime import date
from src.services import mantenimientos_correctivos as mc
from src.api.models import Sucursal, Cuadrilla

@patch("src.services.mantenimientos_correctivos.notify_user")
@patch("src.services.mantenimientos_correctivos.notify_users_correctivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_correctivos.append_correctivo")
def test_create_correctivo(mock_append, mock_notify_users, mock_notify_user, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    result = asyncio.run(
        mc.create_mantenimiento_correctivo(
            db_session,
            id_sucursal=sucursal.id,
            id_cuadrilla=cuadrilla.id,
            fecha_apertura=date.today(),
            numero_caso="1",
            incidente="inc",
            rubro="rubro",
            estado="abierto",
            prioridad="baja",
            current_entity={"type": "usuario"},
        )
    )

    assert result.numero_caso == "1"

@patch("src.services.mantenimientos_correctivos.notify_user")
@patch("src.services.mantenimientos_correctivos.notify_users_correctivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_correctivos.append_correctivo")
@patch("src.services.mantenimientos_correctivos.delete_correctivo")
def test_delete_correctivo(mock_delete_correctivo, mock_append, mock_notify_users, mock_notify_user, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = asyncio.run(
        mc.create_mantenimiento_correctivo(
            db_session,
            sucursal.id,
            cuadrilla.id,
            date.today(),
            "1",
            "inc",
            "rubro",
            "abierto",
            "baja",
            {"type": "usuario"},
        )
    )

    result = mc.delete_mantenimiento_correctivo(db_session, mantenimiento.id, {"type": "usuario"})

    assert "eliminado" in result["message"]
