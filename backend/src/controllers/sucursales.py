from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.sucursales import get_sucursales, get_sucursal, create_sucursal, update_sucursal, delete_sucursal
from typing import List

router = APIRouter(prefix="/sucursales", tags=["sucursales"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_sucursales(db: Session = Depends(get_db)):
    sucursales = get_sucursales(db)
    return [{"id": s.id, "nombre": s.nombre, "zona": s.zona, "direccion": s.direccion, "superficie": s.superficie} for s in sucursales]

@router.get("/{sucursal_id}", response_model=dict)
def read_sucursal(sucursal_id: int, db: Session = Depends(get_db)):
    sucursal = get_sucursal(db, sucursal_id)
    return {"id": sucursal.id, "nombre": sucursal.nombre, "zona": sucursal.zona, "direccion": sucursal.direccion, "superficie": sucursal.superficie}

@router.post("/", response_model=dict)
def create_sucursal(nombre: str, zona: str, direccion: str, superficie: str, db: Session = Depends(get_db)):
    sucursal = create_sucursal(db, nombre, zona, direccion, superficie)
    return {"id": sucursal.id, "nombre": sucursal.nombre, "zona": sucursal.zona, "direccion": sucursal.direccion, "superficie": sucursal.superficie}

@router.put("/{sucursal_id}", response_model=dict)
def update_sucursal(sucursal_id: int, nombre: str = None, zona: str = None, direccion: str = None, superficie: str = None, db: Session = Depends(get_db)):
    sucursal = update_sucursal(db, sucursal_id, nombre, zona, direccion, superficie)
    return {"id": sucursal.id, "nombre": sucursal.nombre, "zona": sucursal.zona, "direccion": sucursal.direccion, "superficie": sucursal.superficie}

@router.delete("/{sucursal_id}")
def delete_sucursal(sucursal_id: int, db: Session = Depends(get_db)):
    return delete_sucursal(db, sucursal_id)