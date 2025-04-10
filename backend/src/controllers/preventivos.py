from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.preventivos import get_preventivos, get_preventivo, create_preventivo, update_preventivo, delete_preventivo
from src.api.schemas import PreventivoCreate, PreventivoUpdate
from typing import List

router = APIRouter(prefix="/preventivos", tags=["preventivos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def preventivos_get(db: Session = Depends(get_db)):
    preventivos = get_preventivos(db)
    return [{"id": p.id, "id_sucursal": p.id_sucursal, "frecuencia": p.frecuencia} for p in preventivos]

@router.get("/{preventivo_id}", response_model=dict)
def preventivo_get(preventivo_id: int, db: Session = Depends(get_db)):
    preventivo = get_preventivo(db, preventivo_id)
    return {"id": preventivo.id, "id_sucursal": preventivo.id_sucursal, "frecuencia": preventivo.frecuencia}

@router.post("/", response_model=dict)
def preventivo_create(preventivo: PreventivoCreate, db: Session = Depends(get_db)):
    new_preventivo = create_preventivo(db, preventivo.id_sucursal, preventivo.frecuencia)
    return {"id": new_preventivo.id, "id_sucursal": new_preventivo.id_sucursal, "frecuencia": new_preventivo.frecuencia}

@router.put("/{preventivo_id}", response_model=dict)
def preventivo_update(preventivo_id: int, preventivo: PreventivoUpdate, db: Session = Depends(get_db)):
    updated_preventivo = update_preventivo(db, preventivo_id, preventivo.id_sucursal, preventivo.frecuencia)
    return {"id": updated_preventivo.id, "id_sucursal": updated_preventivo.id_sucursal, "frecuencia": updated_preventivo.frecuencia}

@router.delete("/{preventivo_id}", response_model=dict)
def preventivo_delete(preventivo_id: int, db: Session = Depends(get_db)):
    return delete_preventivo(db, preventivo_id)