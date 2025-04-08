# backend/src/api/services/users.py
from sqlalchemy.orm import Session
from src.api.models import Usuario
from fastapi import HTTPException

def get_users(db: Session):
    return db.query(Usuario).all()

def get_user(db: Session, user_id: int):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def create_user(db: Session, nombre: str, email: str, contrasena: str, rol: str):
    user = Usuario(nombre=nombre, email=email, contrasena=contrasena, rol=rol)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, nombre: str = None, email: str = None, contrasena: str = None, rol: str = None):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if nombre is not None:
        user.nombre = nombre
    if email is not None:
        user.email = email
    if contrasena is not None:
        user.contrasena = contrasena
    if rol is not None:
        user.rol = rol
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"message": f"Usuario con id {user_id} eliminado"}