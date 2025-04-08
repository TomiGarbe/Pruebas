from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.mantenimientos_correctivos import (
    get_mantenimientos_correctivos,
    get_mantenimiento_correctivo,
    create_mantenimiento_correctivo,
    update_mantenimiento_correctivo,
    delete_mantenimiento_correctivo
)
from datetime import date, datetime
from typing import List

router = APIRouter(prefix="/mantenimientos-correctivos", tags=["mantenimientos-correctivos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_mantenimientos_correctivos(db: Session = Depends(get_db)):
    correctivos = get_mantenimientos_correctivos(db)
    return [
        {
            "id": c.id,
            "id_sucursal": c.id_sucursal,
            "id_cuadrilla": c.id_cuadrilla,
            "fecha_apertura": c.fecha_apertura,
            "fecha_cierre": c.fecha_cierre,
            "numero_caso": c.numero_caso,
            "incidente": c.incidente,
            "rubro": c.rubro,
            "estado": c.estado,
            "prioridad": c.prioridad,
            "extendido": c.extendido
        } for c in correctivos
    ]

@router.get("/{correctivo_id}", response_model=dict)
def read_mantenimiento_correctivo(correctivo_id: int, db: Session = Depends(get_db)):
    correctivo = get_mantenimiento_correctivo(db, correctivo_id)
    return {
        "id": correctivo.id,
        "id_sucursal": correctivo.id_sucursal,
        "id_cuadrilla": correctivo.id_cuadrilla,
        "fecha_apertura": correctivo.fecha_apertura,
        "fecha_cierre": correctivo.fecha_cierre,
        "numero_caso": correctivo.numero_caso,
        "incidente": correctivo.incidente,
        "rubro": correctivo.rubro,
        "estado": correctivo.estado,
        "prioridad": correctivo.prioridad,
        "extendido": correctivo.extendido
    }

@router.post("/", response_model=dict)
async def create_mantenimiento_correctivo(
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
    extendido: datetime = None,
    db: Session = Depends(get_db)
):
    planilla_data = await planilla.read()
    correctivo = await create_mantenimiento_correctivo(
        db, id_sucursal, id_cuadrilla, fecha_apertura, fecha_cierre,
        numero_caso, incidente, rubro, planilla_data, estado, prioridad, extendido
    )
    return {
        "id": correctivo.id,
        "id_sucursal": correctivo.id_sucursal,
        "id_cuadrilla": correctivo.id_cuadrilla,
        "fecha_apertura": correctivo.fecha_apertura,
        "fecha_cierre": correctivo.fecha_cierre,
        "numero_caso": correctivo.numero_caso,
        "incidente": correctivo.incidente,
        "rubro": correctivo.rubro,
        "estado": correctivo.estado,
        "prioridad": correctivo.prioridad,
        "extendido": correctivo.extendido
    }

@router.put("/{correctivo_id}", response_model=dict)
async def update_mantenimiento_correctivo(
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
    extendido: datetime = None,
    db: Session = Depends(get_db)
):
    planilla_data = await planilla.read() if planilla else None
    correctivo = update_mantenimiento_correctivo(
        db, correctivo_id, id_sucursal, id_cuadrilla, fecha_apertura, fecha_cierre,
        numero_caso, incidente, rubro, planilla_data, estado, prioridad, extendido
    )
    return {
        "id": correctivo.id,
        "id_sucursal": correctivo.id_sucursal,
        "id_cuadrilla": correctivo.id_cuadrilla,
        "fecha_apertura": correctivo.fecha_apertura,
        "fecha_cierre": correctivo.fecha_cierre,
        "numero_caso": correctivo.numero_caso,
        "incidente": correctivo.incidente,
        "rubro": correctivo.rubro,
        "estado": correctivo.estado,
        "prioridad": correctivo.prioridad,
        "extendido": correctivo.extendido
    }

@router.delete("/{correctivo_id}")
def delete_mantenimiento_correctivo(correctivo_id: int, db: Session = Depends(get_db)):
    return delete_mantenimiento_correctivo(db, correctivo_id)