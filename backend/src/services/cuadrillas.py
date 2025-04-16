from sqlalchemy.orm import Session
from src.api.models import Cuadrilla
from fastapi import HTTPException
from passlib.context import CryptContext

# Configuración para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_cuadrillas(db: Session):
    return db.query(Cuadrilla).all()

def get_cuadrilla(db: Session, cuadrilla_id: int):
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    return cuadrilla

def create_cuadrilla(db: Session, nombre: str, zona: str, email: str, contrasena: str):
    existing_cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.email == email).first()
    if existing_cuadrilla:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_password = pwd_context.hash(contrasena)
    db_cuadrilla = Cuadrilla(nombre=nombre, zona=zona, email=email, contrasena=hashed_password)
    db.add(db_cuadrilla)
    db.commit()
    db.refresh(db_cuadrilla)
    return db_cuadrilla

def update_cuadrilla(db: Session, cuadrilla_id: int, nombre: str = None, zona: str = None, email: str = None, contrasena: str = None):
    db_cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not db_cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    if nombre:
        db_cuadrilla.nombre = nombre
    if zona:
        db_cuadrilla.zona = zona
    if email:
        existing_cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.email == email, Cuadrilla.id != cuadrilla_id).first()
        if existing_cuadrilla:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        db_cuadrilla.email = email
    if contrasena:
        db_cuadrilla.contrasena = pwd_context.hash(contrasena)
    db.commit()
    db.refresh(db_cuadrilla)
    return db_cuadrilla

def delete_cuadrilla(db: Session, cuadrilla_id: int):
    db_cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not db_cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    db.delete(db_cuadrilla)
    db.commit()
    return {"message": f"Cuadrilla con id {cuadrilla_id} eliminada"}