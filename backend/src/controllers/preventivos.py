from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.preventivos import get_preventivos, get_preventivo, create_preventivo, update_preventivo, delete_preventivo
from typing import List

router = APIRouter(prefix="/preventivos", tags=["preventivos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_preventivos(db: Session = Depends(get_db)):
    preventivos = get_preventivos(db)
    return [{"id": p.id, "id_sucursal": p.id_sucursal, "frecuencia": p.frecuencia} for p in preventivos]

@router.get("/{preventivo_id}", response_model=dict)
def read_preventivo(preventivo_id: int, db: Session = Depends(get_db)):
    preventivo = get_preventivo(db, preventivo_id)
    return {"id": preventivo.id, "id_sucursal": preventivo.id_sucursal, "frecuencia": preventivo.frecuencia}

@router.post("/", response_model=dict)
def create_preventivo(id_sucursal: int, frecuencia: str, db: Session = Depends(get_db)):
    preventivo = create_preventivo(db, id_sucursal, frecuencia)
    return {"id": preventivo.id, "id_sucursal": preventivo.id_sucursal, "frecuencia": preventivo.frecuencia}

@router.put("/{preventivo_id}", response_model=dict)
def update_preventivo(preventivo_id: int, id_sucursal: int = None, frecuencia: str = None, db: Session = Depends(get_db)):
    preventivo = update_preventivo(db, preventivo_id, id_sucursal, frecuencia)
    return {"id": preventivo.id, "id_sucursal": preventivo.id_sucursal, "frecuencia": preventivo.frecuencia}

@router.delete("/{preventivo_id}")
def delete_preventivo(preventivo_id: int, db: Session = Depends(get_db)):
    return delete_preventivo(db, preventivo_id)