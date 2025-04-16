from sqlalchemy.orm import Session
from src.api.models import MantenimientoPreventivo, Preventivo, Cuadrilla
from fastapi import HTTPException
from datetime import date, datetime
from typing import Optional

def get_mantenimientos_preventivos(db: Session):
    return db.query(MantenimientoPreventivo).all()

def get_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    return mantenimiento

def create_mantenimiento_preventivo(db: Session, id_preventivo: int, id_cuadrilla: int, fecha_apertura: date, fecha_cierre: Optional[date] = None, planilla_1: Optional[str] = None, planilla_2: Optional[str] = None, planilla_3: Optional[str] = None, extendido: Optional[datetime] = None):
    # Verifica si el preventivo existe
    preventivo = db.query(Preventivo).filter(Preventivo.id == id_preventivo).first()
    if not preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    
    # Verifica si la cuadrilla existe
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    db_mantenimiento = MantenimientoPreventivo(
        id_preventivo=id_preventivo,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura,
        fecha_cierre=fecha_cierre,
        planilla_1=planilla_1,
        planilla_2=planilla_2,
        planilla_3=planilla_3,
        extendido=extendido
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def update_mantenimiento_preventivo(db: Session, mantenimiento_id: int, id_preventivo: Optional[int] = None, id_cuadrilla: Optional[int] = None, fecha_apertura: Optional[date] = None, fecha_cierre: Optional[date] = None, planilla_1: Optional[str] = None, planilla_2: Optional[str] = None, planilla_3: Optional[str] = None, extendido: Optional[datetime] = None):
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    
    if id_preventivo:
        preventivo = db.query(Preventivo).filter(Preventivo.id == id_preventivo).first()
        if not preventivo:
            raise HTTPException(status_code=404, detail="Preventivo no encontrado")
        db_mantenimiento.id_preventivo = id_preventivo
    if id_cuadrilla:
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    if fecha_apertura:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        db_mantenimiento.fecha_cierre = fecha_cierre
    if planilla_1 is not None:
        db_mantenimiento.planilla_1 = planilla_1
    if planilla_2 is not None:
        db_mantenimiento.planilla_2 = planilla_2
    if planilla_3 is not None:
        db_mantenimiento.planilla_3 = planilla_3
    if extendido is not None:
        db_mantenimiento.extendido = extendido
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def delete_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    db.delete(db_mantenimiento)
    db.commit()
    return {"message": f"Mantenimiento preventivo con id {mantenimiento_id} eliminado"}