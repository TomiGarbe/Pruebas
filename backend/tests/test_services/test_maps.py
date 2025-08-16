from datetime import date
from src.services import maps as maps_service
from src.api.models import Sucursal, Cuadrilla, MantenimientoCorrectivo, CorrectivoSeleccionado

def test_get_correctivos(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    seleccion = CorrectivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mantenimiento.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(seleccion)
    db_session.commit()

    result = maps_service.get_correctivos(db_session, cuadrilla.id, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].id_mantenimiento == mantenimiento.id
