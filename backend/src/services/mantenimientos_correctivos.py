from sqlalchemy.orm import Session
from src.api.models import MantenimientoCorrectivo
from fastapi import HTTPException
from datetime import date, datetime

def get_mantenimientos_correctivos(db: Session):
    return db.query(MantenimientoCorrectivo).all()

def get_mantenimiento_correctivo(db: Session, correctivo_id: int):
    correctivo = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == correctivo_id).first()
    if correctivo is None:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    return correctivo

async def create_mantenimiento_correctivo(
    db: Session,
    id_sucursal: int,
    id_cuadrilla: int,
    fecha_apertura: date,
    fecha_cierre: date,
    numero_caso: str,
    incidente: str,
    rubro: str,
    planilla: str,
    estado: str,
    prioridad: str,
    extendido: datetime = None
):
    correctivo = MantenimientoCorrectivo(
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
    db.add(correctivo)
    db.commit()
    db.refresh(correctivo)
    return correctivo

def update_mantenimiento_correctivo(
    db: Session,
    correctivo_id: int,
    id_sucursal: int = None,
    id_cuadrilla: int = None,
    fecha_apertura: date = None,
    fecha_cierre: date = None,
    numero_caso: str = None,
    incidente: str = None,
    rubro: str = None,
    planilla: str = None,
    estado: str = None,
    prioridad: str = None,
    extendido: datetime = None
):
    correctivo = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == correctivo_id).first()
    if correctivo is None:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    if id_sucursal is not None:
        correctivo.id_sucursal = id_sucursal
    if id_cuadrilla is not None:
        correctivo.id_cuadrilla = id_cuadrilla
    if fecha_apertura is not None:
        correctivo.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        correctivo.fecha_cierre = fecha_cierre
    if numero_caso is not None:
        correctivo.numero_caso = numero_caso
    if incidente is not None:
        correctivo.incidente = incidente
    if rubro is not None:
        correctivo.rubro = rubro
    if planilla is not None:
        correctivo.planilla = planilla
    if estado is not None:
        correctivo.estado = estado
    if prioridad is not None:
        correctivo.prioridad = prioridad
    if extendido is not None:
        correctivo.extendido = extendido
    db.commit()
    db.refresh(correctivo)
    return correctivo

def delete_mantenimiento_correctivo(db: Session, correctivo_id: int):
    correctivo = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == correctivo_id).first()
    if correctivo is None:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    db.delete(correctivo)
    db.commit()
    return {"message": f"Mantenimiento correctivo con id {correctivo_id} eliminado"}