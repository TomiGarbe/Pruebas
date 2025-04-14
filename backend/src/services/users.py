from sqlalchemy.orm import Session
from src.api.models import Usuario
from fastapi import HTTPException

def get_users(db: Session):
    return db.query(Usuario).all()

def get_user(db: Session, user_id: int):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def create_user(db: Session, nombre: str, email: str, rol: str):
    # Verifica si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    db_user = Usuario(nombre=nombre, email=email, rol=rol)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, nombre: str = None, email: str = None, rol: str = None):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if nombre:
        db_user.nombre = nombre
    if email:
        existing_user = db.query(Usuario).filter(Usuario.email == email, Usuario.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        db_user.email = email
    if rol:
        db_user.rol = rol
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(db_user)
    db.commit()
    return {"message": f"Usuario con id {user_id} eliminado"}