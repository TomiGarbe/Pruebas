from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.mantenimientos_preventivos import get_mantenimientos_preventivos, get_mantenimiento_preventivo, create_mantenimiento_preventivo, update_mantenimiento_preventivo, delete_mantenimiento_preventivo
from api.schemas import MantenimientoPreventivoCreate, MantenimientoPreventivoUpdate
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
            "planilla_1": m.planilla_1,
            "planilla_2": m.planilla_2,
            "planilla_3": m.planilla_3,
            "extendido": m.extendido
        }
        for m in mantenimientos
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
        "planilla_1": mantenimiento.planilla_1,
        "planilla_2": mantenimiento.planilla_2,
        "planilla_3": mantenimiento.planilla_3,
        "extendido": mantenimiento.extendido
    }

@router.post("/", response_model=dict)
def create_new_mantenimiento_preventivo(mantenimiento: MantenimientoPreventivoCreate, db: Session = Depends(get_db)):
    new_mantenimiento = create_mantenimiento_preventivo(
        db,
        mantenimiento.id_preventivo,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura,
        mantenimiento.fecha_cierre,
        mantenimiento.planilla_1,
        mantenimiento.planilla_2,
        mantenimiento.planilla_3,
        mantenimiento.extendido
    )
    return {
        "id": new_mantenimiento.id,
        "id_preventivo": new_mantenimiento.id_preventivo,
        "id_cuadrilla": new_mantenimiento.id_cuadrilla,
        "fecha_apertura": new_mantenimiento.fecha_apertura,
        "fecha_cierre": new_mantenimiento.fecha_cierre,
        "planilla_1": new_mantenimiento.planilla_1,
        "planilla_2": new_mantenimiento.planilla_2,
        "planilla_3": new_mantenimiento.planilla_3,
        "extendido": new_mantenimiento.extendido
    }

@router.put("/{mantenimiento_id}", response_model=dict)
def update_mantenimiento_preventivo(mantenimiento_id: int, mantenimiento: MantenimientoPreventivoUpdate, db: Session = Depends(get_db)):
    updated_mantenimiento = update_mantenimiento_preventivo(
        db,
        mantenimiento_id,
        mantenimiento.id_preventivo,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura,
        mantenimiento.fecha_cierre,
        mantenimiento.planilla_1,
        mantenimiento.planilla_2,
        mantenimiento.planilla_3,
        mantenimiento.extendido
    )
    return {
        "id": updated_mantenimiento.id,
        "id_preventivo": updated_mantenimiento.id_preventivo,
        "id_cuadrilla": updated_mantenimiento.id_cuadrilla,
        "fecha_apertura": updated_mantenimiento.fecha_apertura,
        "fecha_cierre": updated_mantenimiento.fecha_cierre,
        "planilla_1": updated_mantenimiento.planilla_1,
        "planilla_2": updated_mantenimiento.planilla_2,
        "planilla_3": updated_mantenimiento.planilla_3,
        "extendido": updated_mantenimiento.extendido
    }

@router.delete("/{mantenimiento_id}", response_model=dict)
def delete_mantenimiento_preventivo(mantenimiento_id: int, db: Session = Depends(get_db)):
    return delete_mantenimiento_preventivo(db, mantenimiento_id)