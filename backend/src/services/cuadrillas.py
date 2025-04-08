from sqlalchemy.orm import Session
from src.api.models import Cuadrilla
from fastapi import HTTPException

def get_cuadrillas(db: Session):
    return db.query(Cuadrilla).all()

def get_cuadrilla(db: Session, cuadrilla_id: int):
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if cuadrilla is None:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    return cuadrilla

def create_cuadrilla(db: Session, nombre: str, zona: str, email: str, contrasena: str, rol: str):
    cuadrilla = Cuadrilla(nombre=nombre, zona=zona, email=email, contrasena=contrasena, rol=rol)
    db.add(cuadrilla)
    db.commit()
    db.refresh(cuadrilla)
    return cuadrilla

def update_cuadrilla(db: Session, cuadrilla_id: int, nombre: str = None, zona: str = None, email: str = None, contrasena: str = None, rol: str = None):
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if cuadrilla is None:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    if nombre is not None:
        cuadrilla.nombre = nombre
    if zona is not None:
        cuadrilla.zona = zona
    if email is not None:
        cuadrilla.email = email
    if contrasena is not None:
        cuadrilla.contrasena = contrasena
    if rol is not None:
        cuadrilla.rol = rol
    db.commit()
    db.refresh(cuadrilla)
    return cuadrilla

def delete_cuadrilla(db: Session, cuadrilla_id: int):
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if cuadrilla is None:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    db.delete(cuadrilla)
    db.commit()
    return {"message": f"Cuadrilla con id {cuadrilla_id} eliminada"}