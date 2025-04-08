from sqlalchemy.orm import Session
from src.api.models import MantenimientoPreventivo
from fastapi import HTTPException
from datetime import date, datetime

def get_mantenimientos_preventivos(db: Session):
    return db.query(MantenimientoPreventivo).all()

def get_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if mantenimiento is None:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    return mantenimiento

async def create_mantenimiento_preventivo(
    db: Session,
    id_preventivo: int,
    id_cuadrilla: int,
    fecha_apertura: date,
    fecha_cierre: date,
    planilla_1: str,
    planilla_2: str,
    planilla_3: str,
    extendido: datetime = None
):
    mantenimiento = MantenimientoPreventivo(
        id_preventivo=id_preventivo,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura,
        fecha_cierre=fecha_cierre,
        planilla_1=planilla_1,
        planilla_2=planilla_2,
        planilla_3=planilla_3,
        extendido=extendido
    )
    db.add(mantenimiento)
    db.commit()
    db.refresh(mantenimiento)
    return mantenimiento

def update_mantenimiento_preventivo(
    db: Session,
    mantenimiento_id: int,
    id_preventivo: int = None,
    id_cuadrilla: int = None,
    fecha_apertura: date = None,
    fecha_cierre: date = None,
    planilla_1: str = None,
    planilla_2: str = None,
    planilla_3: str = None,
    extendido: datetime = None
):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if mantenimiento is None:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    if id_preventivo is not None:
        mantenimiento.id_preventivo = id_preventivo
    if id_cuadrilla is not None:
        mantenimiento.id_cuadrilla = id_cuadrilla
    if fecha_apertura is not None:
        mantenimiento.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        mantenimiento.fecha_cierre = fecha_cierre
    if planilla_1 is not None:
        mantenimiento.planilla_1 = planilla_1
    if planilla_2 is not None:
        mantenimiento.planilla_2 = planilla_2
    if planilla_3 is not None:
        mantenimiento.planilla_3 = planilla_3
    if extendido is not None:
        mantenimiento.extendido = extendido
    db.commit()
    db.refresh(mantenimiento)
    return mantenimiento

def delete_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if mantenimiento is None:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    db.delete(mantenimiento)
    db.commit()
    return {"message": f"Mantenimiento preventivo con id {mantenimiento_id} eliminado"}