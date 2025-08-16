from src.api.models import Sucursal, Preventivo
from src.services import preventivos as preventivos_service

def test_get_preventivos_success(db_session):
    sucursal = Sucursal(nombre="Sucursal1", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal1", "mensual", {"type": "usuario"})
    result = preventivos_service.get_preventivos(db_session)
    assert len(result) == 1


def test_get_preventivo_success(db_session):
    sucursal = Sucursal(nombre="Sucursal2", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal2", "mensual", {"type": "usuario"})
    result = preventivos_service.get_preventivo(db_session, created.id)
    assert result.id == created.id


def test_create_preventivo_success(db_session):
    sucursal = Sucursal(nombre="Sucursal3", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal3", "mensual", {"type": "usuario"})
    assert created.id is not None
    assert created.frecuencia == "mensual"


def test_update_preventivo_success(db_session):
    sucursal = Sucursal(nombre="Sucursal4", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal4", "mensual", {"type": "usuario"})
    updated = preventivos_service.update_preventivo(db_session, created.id, {"type": "usuario"}, frecuencia="semanal")
    assert updated.frecuencia == "semanal"


def test_delete_preventivo_success(db_session):
    sucursal = Sucursal(nombre="Sucursal5", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal5", "mensual", {"type": "usuario"})
    response = preventivos_service.delete_preventivo(db_session, created.id, {"type": "usuario"})
    assert response == {"message": f"Preventivo con id {created.id} eliminado"}
    assert db_session.query(Preventivo).count() == 0
