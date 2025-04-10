from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.cuadrillas import get_cuadrillas, get_cuadrilla, create_cuadrilla, update_cuadrilla, delete_cuadrilla
from api.schemas import CuadrillaCreate, CuadrillaUpdate
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
def create_new_cuadrilla(cuadrilla: CuadrillaCreate, db: Session = Depends(get_db)):
    new_cuadrilla = create_cuadrilla(db, cuadrilla.nombre, cuadrilla.zona, cuadrilla.email, cuadrilla.contrasena, cuadrilla.rol)
    return {"id": new_cuadrilla.id, "nombre": new_cuadrilla.nombre, "zona": new_cuadrilla.zona, "email": new_cuadrilla.email, "rol": new_cuadrilla.rol}

@router.put("/{cuadrilla_id}", response_model=dict)
def update_cuadrilla(cuadrilla_id: int, cuadrilla: CuadrillaUpdate, db: Session = Depends(get_db)):
    updated_cuadrilla = update_cuadrilla(db, cuadrilla_id, cuadrilla.nombre, cuadrilla.zona, cuadrilla.email, cuadrilla.contrasena, cuadrilla.rol)
    return {"id": updated_cuadrilla.id, "nombre": updated_cuadrilla.nombre, "zona": updated_cuadrilla.zona, "email": updated_cuadrilla.email, "rol": updated_cuadrilla.rol}

@router.delete("/{cuadrilla_id}", response_model=dict)
def delete_cuadrilla(cuadrilla_id: int, db: Session = Depends(get_db)):
    return delete_cuadrilla(db, cuadrilla_id)