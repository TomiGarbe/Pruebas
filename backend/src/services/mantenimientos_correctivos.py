from sqlalchemy.orm import Session
from api.models import MantenimientoCorrectivo, Sucursal, Cuadrilla
from fastapi import HTTPException
from datetime import date, datetime
from typing import Optional

def get_mantenimientos_correctivos(db: Session):
    return db.query(MantenimientoCorrectivo).all()

def get_mantenimiento_correctivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    return mantenimiento

def create_mantenimiento_correctivo(db: Session, id_sucursal: int, id_cuadrilla: int, fecha_apertura: date, fecha_cierre: Optional[date] = None, numero_caso: str = None, incidente: str = None, rubro: str = None, planilla: Optional[str] = None, estado: str = None, prioridad: str = None, extendido: Optional[datetime] = None, current_entity: dict = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    # Verifica si la sucursal existe
    sucursal = db.query(Sucursal).filter(Sucursal.id == id_sucursal).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    if id_cuadrilla:
        # Verifica si la cuadrilla existe
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    db_mantenimiento = MantenimientoCorrectivo(
        id_sucursal=id_sucursal,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura,
        fecha_cierre=fecha_cierre,
        numero_caso=numero_caso,
        incidente=incidente,
        rubro=rubro,
        planilla=planilla,
        estado=estado,
        prioridad=prioridad,
        extendido=extendido
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def update_mantenimiento_correctivo(db: Session, mantenimiento_id: int, id_sucursal: Optional[int] = None, id_cuadrilla: Optional[int] = None, fecha_apertura: Optional[date] = None, fecha_cierre: Optional[date] = None, numero_caso: Optional[str] = None, incidente: Optional[str] = None, rubro: Optional[str] = None, planilla: Optional[str] = None, estado: Optional[str] = None, prioridad: Optional[str] = None, extendido: Optional[datetime] = None):
    db_mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    
    if id_sucursal:
        sucursal = db.query(Sucursal).filter(Sucursal.id == id_sucursal).first()
        if not sucursal:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada")
        db_mantenimiento.id_sucursal = id_sucursal
    if id_cuadrilla:
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    if fecha_apertura:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        db_mantenimiento.fecha_cierre = fecha_cierre
    if numero_caso:
        db_mantenimiento.numero_caso = numero_caso
    if incidente:
        db_mantenimiento.incidente = incidente
    if rubro:
        db_mantenimiento.rubro = rubro
    if planilla is not None:
        db_mantenimiento.planilla = planilla
    if estado:
        db_mantenimiento.estado = estado
    if prioridad:
        db_mantenimiento.prioridad = prioridad
    if extendido is not None:
        db_mantenimiento.extendido = extendido
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def delete_mantenimiento_correctivo(db: Session, mantenimiento_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    db.delete(db_mantenimiento)
    db.commit()
    return {"message": f"Mantenimiento correctivo con id {mantenimiento_id} eliminado"}