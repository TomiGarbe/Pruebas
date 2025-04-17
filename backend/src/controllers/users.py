from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import SessionLocal
from services.users import get_users, get_user, create_user, update_user, delete_user
from api.schemas import UserCreate, UserUpdate
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def users_get(db: Session = Depends(get_db)):
    users = get_users(db)
    return [{"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol} for user in users]

@router.get("/{user_id}", response_model=dict)
def user_get(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    return {"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol}

@router.post("/", response_model=dict)
def user_create(user: UserCreate, db: Session = Depends(get_db)):
    new_user = create_user(db, user.nombre, user.email, user.contrasena, user.rol)
    return {"id": new_user.id, "nombre": new_user.nombre, "email": new_user.email, "rol": new_user.rol}

@router.put("/{user_id}", response_model=dict)
def user_update(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    updated_user = update_user(db, user_id, user.nombre, user.email, user.contrasena, user.rol)
    return {"id": updated_user.id, "nombre": updated_user.nombre, "email": updated_user.email, "rol": updated_user.rol}

@router.delete("/{user_id}", response_model=dict)
def user_delete(user_id: int, db: Session = Depends(get_db)):
    return delete_user(db, user_id)