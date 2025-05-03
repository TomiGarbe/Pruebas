from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from services.reportes import get_reportes, get_reporte, create_reporte, update_reporte, delete_reporte
from api.schemas import ReporteCreate, ReporteUpdate
from typing import List

router = APIRouter(prefix="/reportes", tags=["reportes"])

@router.get("/", response_model=List[dict])
def reportes_get(db: Session = Depends(get_db)):
    reportes = get_reportes(db)
    return [
        {
            "id": r.id,
            "id_usuario": r.id_usuario,
            "tipo": r.tipo,
            "contenido": r.contenido,
            "fecha": r.fecha
        }
        for r in reportes
    ]

@router.get("/{reporte_id}", response_model=dict)
def reporte_get(reporte_id: int, db: Session = Depends(get_db)):
    reporte = get_reporte(db, reporte_id)
    return {
        "id": reporte.id,
        "id_usuario": reporte.id_usuario,
        "tipo": reporte.tipo,
        "contenido": reporte.contenido,
        "fecha": reporte.fecha
    }

@router.post("/", response_model=dict)
def reporte_create(reporte: ReporteCreate, db: Session = Depends(get_db)):
    new_reporte = create_reporte(db, reporte.id_usuario, reporte.tipo, reporte.contenido, reporte.fecha)
    return {
        "id": new_reporte.id,
        "id_usuario": new_reporte.id_usuario,
        "tipo": new_reporte.tipo,
        "contenido": new_reporte.contenido,
        "fecha": new_reporte.fecha
    }

@router.put("/{reporte_id}", response_model=dict)
def reporte_update(reporte_id: int, reporte: ReporteUpdate, db: Session = Depends(get_db)):
    updated_reporte = update_reporte(db, reporte_id, reporte.id_usuario, reporte.tipo, reporte.contenido, reporte.fecha)
    return {
        "id": updated_reporte.id,
        "id_usuario": updated_reporte.id_usuario,
        "tipo": updated_reporte.tipo,
        "contenido": updated_reporte.contenido,
        "fecha": updated_reporte.fecha
    }

@router.delete("/{reporte_id}", response_model=dict)
def reporte_delete(reporte_id: int, db: Session = Depends(get_db)):
    return delete_reporte(db, reporte_id)