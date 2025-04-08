from sqlalchemy.orm import Session
from src.api.models import Sucursal
from fastapi import HTTPException

def get_sucursales(db: Session):
    return db.query(Sucursal).all()

def get_sucursal(db: Session, sucursal_id: int):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if sucursal is None:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal

def create_sucursal(db: Session, nombre: str, zona: str, direccion: str, superficie: str):
    sucursal = Sucursal(nombre=nombre, zona=zona, direccion=direccion, superficie=superficie)
    db.add(sucursal)
    db.commit()
    db.refresh(sucursal)
    return sucursal

def update_sucursal(db: Session, sucursal_id: int, nombre: str = None, zona: str = None, direccion: str = None, superficie: str = None):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if sucursal is None:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    if nombre is not None:
        sucursal.nombre = nombre
    if zona is not None:
        sucursal.zona = zona
    if direccion is not None:
        sucursal.direccion = direccion
    if superficie is not None:
        sucursal.superficie = superficie
    db.commit()
    db.refresh(sucursal)
    return sucursal

def delete_sucursal(db: Session, sucursal_id: int):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if sucursal is None:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    db.delete(sucursal)
    db.commit()
    return {"message": f"Sucursal con id {sucursal_id} eliminada"}