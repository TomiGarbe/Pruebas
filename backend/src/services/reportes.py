from sqlalchemy.orm import Session
from api.models import Reporte, Usuario
from fastapi import HTTPException
from datetime import date
from typing import Optional
from api.schemas import Role

def get_reportes(db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    return db.query(Reporte).all()

def get_reporte(db: Session, reporte_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    reporte = db.query(Reporte).filter(Reporte.id == reporte_id).first()
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return reporte

def create_reporte(db: Session, id_usuario: int, tipo: str, contenido: str, fecha: date, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    # Verifica si el usuario existe
    usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db_reporte = Reporte(id_usuario=id_usuario, tipo=tipo, contenido=contenido, fecha=fecha)
    db.add(db_reporte)
    db.commit()
    db.refresh(db_reporte)
    return db_reporte

def update_reporte(db: Session, reporte_id: int, id_usuario: Optional[int] = None, tipo: Optional[str] = None, contenido: Optional[str] = None, fecha: Optional[date] = None, current_entity: dict = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    db_reporte = db.query(Reporte).filter(Reporte.id == reporte_id).first()
    if not db_reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    if id_usuario:
        usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        db_reporte.id_usuario = id_usuario
    if tipo:
        db_reporte.tipo = tipo
    if contenido:
        db_reporte.contenido = contenido
    if fecha:
        db_reporte.fecha = fecha
    db.commit()
    db.refresh(db_reporte)
    return db_reporte

def delete_reporte(db: Session, reporte_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    db_reporte = db.query(Reporte).filter(Reporte.id == reporte_id).first()
    if not db_reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    db.delete(db_reporte)
    db.commit()
    return {"message": f"Reporte con id {reporte_id} eliminado"}