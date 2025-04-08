# backend/src/api/controllers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.users import get_users, get_user, create_user, update_user, delete_user
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_users(db: Session = Depends(get_db)):
    users = get_users(db)
    return [{"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol} for user in users]

@router.get("/{user_id}", response_model=dict)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    return {"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol}

@router.post("/", response_model=dict)
def create_user(nombre: str, email: str, contrasena: str, rol: str, db: Session = Depends(get_db)):
    user = create_user(db, nombre, email, contrasena, rol)
    return {"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol}

@router.put("/{user_id}", response_model=dict)
def update_user(user_id: int, nombre: str = None, email: str = None, contrasena: str = None, rol: str = None, db: Session = Depends(get_db)):
    user = update_user(db, user_id, nombre, email, contrasena, rol)
    return {"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return delete_user(db, user_id)