from sqlalchemy.orm import Session
from src.api.models import Reporte
from fastapi import HTTPException
from datetime import date

def get_reportes(db: Session):
    return db.query(Reporte).all()

def get_reporte(db: Session, reporte_id: int):
    reporte = db.query(Reporte).filter(Reporte.id == reporte_id).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return reporte

def create_reporte(db: Session, id_usuario: int, tipo: str, contenido: str, fecha: date):
    reporte = Reporte(id_usuario=id_usuario, tipo=tipo, contenido=contenido, fecha=fecha)
    db.add(reporte)
    db.commit()
    db.refresh(reporte)
    return reporte

def update_reporte(db: Session, reporte_id: int, id_usuario: int = None, tipo: str = None, contenido: str = None, fecha: date = None):
    reporte = db.query(Reporte).filter(Reporte.id == reporte_id).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if id_usuario is not None:
        reporte.id_usuario = id_usuario
    if tipo is not None:
        reporte.tipo = tipo
    if contenido is not None:
        reporte.contenido = contenido
    if fecha is not None:
        reporte.fecha = fecha
    db.commit()
    db.refresh(reporte)
    return reporte

def delete_reporte(db: Session, reporte_id: int):
    reporte = db.query(Reporte).filter(Reporte.id == reporte_id).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    db.delete(reporte)
    db.commit()
    return {"message": f"Reporte con id {reporte_id} eliminado"}