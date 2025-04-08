from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.reportes import get_reportes, get_reporte, create_reporte, update_reporte, delete_reporte
from datetime import date
from typing import List

router = APIRouter(prefix="/reportes", tags=["reportes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_reportes(db: Session = Depends(get_db)):
    reportes = get_reportes(db)
    return [{"id": r.id, "id_usuario": r.id_usuario, "tipo": r.tipo, "contenido": r.contenido, "fecha": r.fecha} for r in reportes]

@router.get("/{reporte_id}", response_model=dict)
def read_reporte(reporte_id: int, db: Session = Depends(get_db)):
    reporte = get_reporte(db, reporte_id)
    return {"id": reporte.id, "id_usuario": reporte.id_usuario, "tipo": reporte.tipo, "contenido": reporte.contenido, "fecha": reporte.fecha}

@router.post("/", response_model=dict)
def create_reporte(id_usuario: int, tipo: str, contenido: str, fecha: date, db: Session = Depends(get_db)):
    reporte = create_reporte(db, id_usuario, tipo, contenido, fecha)
    return {"id": reporte.id, "id_usuario": reporte.id_usuario, "tipo": reporte.tipo, "contenido": reporte.contenido, "fecha": reporte.fecha}

@router.put("/{reporte_id}", response_model=dict)
def update_reporte(reporte_id: int, id_usuario: int = None, tipo: str = None, contenido: str = None, fecha: date = None, db: Session = Depends(get_db)):
    reporte = update_reporte(db, reporte_id, id_usuario, tipo, contenido, fecha)
    return {"id": reporte.id, "id_usuario": reporte.id_usuario, "tipo": reporte.tipo, "contenido": reporte.contenido, "fecha": reporte.fecha}

@router.delete("/{reporte_id}")
def delete_reporte(reporte_id: int, db: Session = Depends(get_db)):
    return delete_reporte(db, reporte_id)