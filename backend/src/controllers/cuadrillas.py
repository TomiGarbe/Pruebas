from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import SessionLocal
from services.cuadrillas import get_cuadrillas, get_cuadrilla, create_cuadrilla, update_cuadrilla, delete_cuadrilla
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
def cuadrillas_get(db: Session = Depends(get_db)):
    cuadrillas = get_cuadrillas(db)
    return [{"id": c.id, "nombre": c.nombre, "zona": c.zona, "email": c.email} for c in cuadrillas]

@router.get("/{cuadrilla_id}", response_model=dict)
def cuadrilla_get(cuadrilla_id: int, db: Session = Depends(get_db)):
    cuadrilla = get_cuadrilla(db, cuadrilla_id)
    return {"id": cuadrilla.id, "nombre": cuadrilla.nombre, "zona": cuadrilla.zona, "email": cuadrilla.email}

@router.post("/", response_model=dict)
def cuadrilla_create(cuadrilla: CuadrillaCreate, db: Session = Depends(get_db)):
    new_cuadrilla = create_cuadrilla(db, cuadrilla.nombre, cuadrilla.zona, cuadrilla.email, cuadrilla.contrasena)
    return {"id": new_cuadrilla.id, "nombre": new_cuadrilla.nombre, "zona": new_cuadrilla.zona, "email": new_cuadrilla.email}

@router.put("/{cuadrilla_id}", response_model=dict)
def cuadrilla_update(cuadrilla_id: int, cuadrilla: CuadrillaUpdate, db: Session = Depends(get_db)):
    updated_cuadrilla = update_cuadrilla(db, cuadrilla_id, cuadrilla.nombre, cuadrilla.zona, cuadrilla.email, cuadrilla.contrasena)
    return {"id": updated_cuadrilla.id, "nombre": updated_cuadrilla.nombre, "zona": updated_cuadrilla.zona, "email": updated_cuadrilla.email}

@router.delete("/{cuadrilla_id}", response_model=dict)
def cuadrilla_delete(cuadrilla_id: int, db: Session = Depends(get_db)):
    return delete_cuadrilla(db, cuadrilla_id)