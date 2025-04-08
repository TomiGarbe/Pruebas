from sqlalchemy.orm import Session
from src.api.models import Preventivo
from fastapi import HTTPException

def get_preventivos(db: Session):
    return db.query(Preventivo).all()

def get_preventivo(db: Session, preventivo_id: int):
    preventivo = db.query(Preventivo).filter(Preventivo.id == preventivo_id).first()
    if preventivo is None:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    return preventivo

def create_preventivo(db: Session, id_sucursal: int, frecuencia: str):
    preventivo = Preventivo(id_sucursal=id_sucursal, frecuencia=frecuencia)
    db.add(preventivo)
    db.commit()
    db.refresh(preventivo)
    return preventivo

def update_preventivo(db: Session, preventivo_id: int, id_sucursal: int = None, frecuencia: str = None):
    preventivo = db.query(Preventivo).filter(Preventivo.id == preventivo_id).first()
    if preventivo is None:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    if id_sucursal is not None:
        preventivo.id_sucursal = id_sucursal
    if frecuencia is not None:
        preventivo.frecuencia = frecuencia
    db.commit()
    db.refresh(preventivo)
    return preventivo

def delete_preventivo(db: Session, preventivo_id: int):
    preventivo = db.query(Preventivo).filter(Preventivo.id == preventivo_id).first()
    if preventivo is None:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    db.delete(preventivo)
    db.commit()
    return {"message": f"Preventivo con id {preventivo_id} eliminado"}