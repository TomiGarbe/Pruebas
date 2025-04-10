from sqlalchemy.orm import Session
from api.models import Usuario
from fastapi import HTTPException
from passlib.context import CryptContext

# Configuración para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_users(db: Session):
    return db.query(Usuario).all()

def get_user(db: Session, user_id: int):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def create_user(db: Session, nombre: str, email: str, contrasena: str, rol: str):
    # Verifica si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Hashea la contraseña antes de guardarla
    hashed_password = pwd_context.hash(contrasena)
    db_user = Usuario(nombre=nombre, email=email, contrasena=hashed_password, rol=rol)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, nombre: str = None, email: str = None, contrasena: str = None, rol: str = None):
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
    if contrasena:
        db_user.contrasena = pwd_context.hash(contrasena)
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