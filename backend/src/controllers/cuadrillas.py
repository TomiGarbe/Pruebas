from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.cuadrillas import get_cuadrillas, get_cuadrilla, create_cuadrilla, update_cuadrilla, delete_cuadrilla
from typing import List

router = APIRouter(prefix="/cuadrillas", tags=["cuadrillas"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_cuadrillas(db: Session = Depends(get_db)):
    cuadrillas = get_cuadrillas(db)
    return [{"id": c.id, "nombre": c.nombre, "zona": c.zona, "email": c.email, "rol": c.rol} for c in cuadrillas]

@router.get("/{cuadrilla_id}", response_model=dict)
def read_cuadrilla(cuadrilla_id: int, db: Session = Depends(get_db)):
    cuadrilla = get_cuadrilla(db, cuadrilla_id)
    return {"id": cuadrilla.id, "nombre": cuadrilla.nombre, "zona": cuadrilla.zona, "email": cuadrilla.email, "rol": cuadrilla.rol}

@router.post("/", response_model=dict)
def create_cuadrilla(nombre: str, zona: str, email: str, contrasena: str, rol: str, db: Session = Depends(get_db)):
    cuadrilla = create_cuadrilla(db, nombre, zona, email, contrasena, rol)
    return {"id": cuadrilla.id, "nombre": cuadrilla.nombre, "zona": cuadrilla.zona, "email": cuadrilla.email, "rol": cuadrilla.rol}

@router.put("/{cuadrilla_id}", response_model=dict)
def update_cuadrilla(cuadrilla_id: int, nombre: str = None, zona: str = None, email: str = None, contrasena: str = None, rol: str = None, db: Session = Depends(get_db)):
    cuadrilla = update_cuadrilla(db, cuadrilla_id, nombre, zona, email, contrasena, rol)
    return {"id": cuadrilla.id, "nombre": cuadrilla.nombre, "zona": cuadrilla.zona, "email": cuadrilla.email, "rol": cuadrilla.rol}

@router.delete("/{cuadrilla_id}")
def delete_cuadrilla(cuadrilla_id: int, db: Session = Depends(get_db)):
    return delete_cuadrilla(db, cuadrilla_id)