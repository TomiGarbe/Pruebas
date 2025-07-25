from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from services.notificaciones import get_notification_correctivo, get_notification_preventivo, notificacion_correctivo_leida, notificacion_preventivo_leida, delete_notificaciones
from typing import List

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])

@router.get("/correctivos/{firebase_uid}", response_model=List[dict])
def notificaciones_correctivos_get(firebase_uid: str, db: Session = Depends(get_db)):
    notificaciones = get_notification_correctivo(db, firebase_uid)
    return [{"id": n.id, "firebase_uid": n.firebase_uid, "id_mantenimiento": n.id_mantenimiento, "mensaje": n.mensaje, "leida": n.leida, "created_at": n.created_at} for n in notificaciones]

@router.get("/preventivos/{firebase_uid}", response_model=List[dict])
def notificaciones_preventivos_get(firebase_uid: str, db: Session = Depends(get_db)):
    notificaciones = get_notification_preventivo(db, firebase_uid)
    return [{"id": n.id, "firebase_uid": n.firebase_uid, "id_mantenimiento": n.id_mantenimiento, "mensaje": n.mensaje, "leida": n.leida, "created_at": n.created_at} for n in notificaciones]

@router.put("/correctivos/{id_notificacion}", response_model=dict)
def notificacion_correctivo_put(id_notificacion: int, db: Session = Depends(get_db)):
    notificacion = notificacion_correctivo_leida(db, id_notificacion)
    return {"id": notificacion.id, "firebase_uid": notificacion.firebase_uid, "id_mantenimiento": notificacion.id_mantenimiento, "mensaje": notificacion.mensaje, "leida": notificacion.leida, "created_at": notificacion.created_at}

@router.put("/preventivos/{id_notificacion}", response_model=dict)
def notificacion_preventivo_put(id_notificacion: int, db: Session = Depends(get_db)):
    notificacion = notificacion_preventivo_leida(db, id_notificacion)
    return {"id": notificacion.id, "firebase_uid": notificacion.firebase_uid, "id_mantenimiento": notificacion.id_mantenimiento, "mensaje": notificacion.mensaje, "leida": notificacion.leida, "created_at": notificacion.created_at}

@router.delete("/{firebase_uid}", response_model=dict)
def notificaciones_delete(firebase_uid: str, db: Session = Depends(get_db)):
    return delete_notificaciones(db, firebase_uid)