from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.mantenimientos_preventivos import (
    get_mantenimientos_preventivos,
    get_mantenimiento_preventivo,
    create_mantenimiento_preventivo,
    update_mantenimiento_preventivo,
    delete_mantenimiento_preventivo
)
from datetime import date, datetime
from typing import List

router = APIRouter(prefix="/mantenimientos-preventivos", tags=["mantenimientos-preventivos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_mantenimientos_preventivos(db: Session = Depends(get_db)):
    mantenimientos = get_mantenimientos_preventivos(db)
    return [
        {
            "id": m.id,
            "id_preventivo": m.id_preventivo,
            "id_cuadrilla": m.id_cuadrilla,
            "fecha_apertura": m.fecha_apertura,
            "fecha_cierre": m.fecha_cierre,
            "extendido": m.extendido
        } for m in mantenimientos
    ]

@router.get("/{mantenimiento_id}", response_model=dict)
def read_mantenimiento_preventivo(mantenimiento_id: int, db: Session = Depends(get_db)):
    mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)
    return {
        "id": mantenimiento.id,
        "id_preventivo": mantenimiento.id_preventivo,
        "id_cuadrilla": mantenimiento.id_cuadrilla,
        "fecha_apertura": mantenimiento.fecha_apertura,
        "fecha_cierre": mantenimiento.fecha_cierre,
        "extendido": mantenimiento.extendido
    }

@router.post("/", response_model=dict)
async def create_mantenimiento_preventivo(
    id_preventivo: int,
    id_cuadrilla: int,
    fecha_apertura: date,
    fecha_cierre: date,
    planilla_1: str,
    planilla_2: str,
    planilla_3: str,
    extendido: datetime = None,
    db: Session = Depends(get_db)
):
    planilla_1_data = await planilla_1.read()
    planilla_2_data = await planilla_2.read()
    planilla_3_data = await planilla_3.read()
    mantenimiento = await create_mantenimiento_preventivo(
        db, id_preventivo, id_cuadrilla, fecha_apertura, fecha_cierre,
        planilla_1_data, planilla_2_data, planilla_3_data, extendido
    )
    return {
        "id": mantenimiento.id,
        "id_preventivo": mantenimiento.id_preventivo,
        "id_cuadrilla": mantenimiento.id_cuadrilla,
        "fecha_apertura": mantenimiento.fecha_apertura,
        "fecha_cierre": mantenimiento.fecha_cierre,
        "extendido": mantenimiento.extendido
    }

@router.put("/{mantenimiento_id}", response_model=dict)
async def update_mantenimiento_preventivo(
    mantenimiento_id: int,
    id_preventivo: int = None,
    id_cuadrilla: int = None,
    fecha_apertura: date = None,
    fecha_cierre: date = None,
    planilla_1: str = None,
    planilla_2: str = None,
    planilla_3: str = None,
    extendido: datetime = None,
    db: Session = Depends(get_db)
):
    planilla_1_data = await planilla_1.read() if planilla_1 else None
    planilla_2_data = await planilla_2.read() if planilla_2 else None
    planilla_3_data = await planilla_3.read() if planilla_3 else None
    mantenimiento = update_mantenimiento_preventivo(
        db, mantenimiento_id, id_preventivo, id_cuadrilla, fecha_apertura, fecha_cierre,
        planilla_1_data, planilla_2_data, planilla_3_data, extendido
    )
    return {
        "id": mantenimiento.id,
        "id_preventivo": mantenimiento.id_preventivo,
        "id_cuadrilla": mantenimiento.id_cuadrilla,
        "fecha_apertura": mantenimiento.fecha_apertura,
        "fecha_cierre": mantenimiento.fecha_cierre,
        "extendido": mantenimiento.extendido
    }

@router.delete("/{mantenimiento_id}")
def delete_mantenimiento_preventivo(mantenimiento_id: int, db: Session = Depends(get_db)):
    return delete_mantenimiento_preventivo(db, mantenimiento_id)