from fastapi import HTTPException
from sqlalchemy.orm import Session
from api.models import Notificacion_Correctivo, Notificacion_Preventivo, Usuario
from .webpush import send_webpush_notification
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
    
def notify_user(db_session: Session, firebase_uid: str, id_mantenimiento: int, mensaje: str, title: str, body: str):
    # Define the start and end of the current day in Argentina timezone
    start_of_day = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day.replace(hour=23, minute=59, second=59, microsecond=999999)
    time_threshold = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")) - timedelta(seconds=60)

    # Check for existing Notificacion_Correctivo
    existing_notification = db_session.query(Notificacion_Correctivo).filter(
        Notificacion_Correctivo.firebase_uid == firebase_uid,
        Notificacion_Correctivo.id_mantenimiento == id_mantenimiento,
        Notificacion_Correctivo.mensaje == mensaje,
        Notificacion_Correctivo.created_at >= start_of_day,
        Notificacion_Correctivo.created_at <= end_of_day,
        Notificacion_Correctivo.created_at >= time_threshold
    ).first()

    if not existing_notification:
        # Check for existing Notificacion_Preventivo
        existing_notification = db_session.query(Notificacion_Preventivo).filter(
            Notificacion_Preventivo.firebase_uid == firebase_uid,
            Notificacion_Preventivo.id_mantenimiento == id_mantenimiento,
            Notificacion_Preventivo.mensaje == mensaje,
            Notificacion_Preventivo.created_at >= start_of_day,
            Notificacion_Preventivo.created_at <= end_of_day,
            Notificacion_Preventivo.created_at >= time_threshold
        ).first()

        if not existing_notification:
            send_webpush_notification(db_session, firebase_uid, title, body)
            return {"message": "Notification sent"}
    return {"message": "Notification already sent"}

def get_notification_correctivo(db_session: Session, firebase_uid: str):
    return db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.firebase_uid == firebase_uid).all()

def get_notification_preventivo(db_session: Session, firebase_uid: str):
    return db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.firebase_uid == firebase_uid).all()

def notificacion_correctivo_leida(db_session: Session, id_notificacion: int):
    db_notificacion = db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.id == id_notificacion).first()
    db_notificacion.leida = True
    db_session.commit()
    db_session.refresh(db_notificacion)
    return db_notificacion

def notificacion_preventivo_leida(db_session: Session, id_notificacion: int):
    db_notificacion = db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.id == id_notificacion).first()
    db_notificacion.leida = True
    db_session.commit()
    db_session.refresh(db_notificacion)
    return db_notificacion

def send_notification_correctivo(db_session: Session, firebase_uid: str, id_mantenimiento: int, mensaje: str):
    existing_notification = db_session.query(Notificacion_Correctivo).filter(
        Notificacion_Correctivo.firebase_uid == firebase_uid, 
        Notificacion_Correctivo.id_mantenimiento == id_mantenimiento, 
        Notificacion_Correctivo.mensaje == mensaje,
        Notificacion_Correctivo.created_at >= datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).replace(hour=0, minute=0, second=0, microsecond=0),
        Notificacion_Correctivo.created_at < datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).replace(hour=23, minute=59, second=59, microsecond=999999)
    ).first()
    if not existing_notification:
        db_notificacion = Notificacion_Correctivo(firebase_uid=firebase_uid, id_mantenimiento=id_mantenimiento, mensaje=mensaje)
        db_session.add(db_notificacion)
        db_session.commit()
        return True
    return False

def send_notification_preventivo(db_session: Session, firebase_uid: str, id_mantenimiento: int, mensaje: str):
    existing_notification = db_session.query(Notificacion_Preventivo).filter(
        Notificacion_Preventivo.firebase_uid == firebase_uid, 
        Notificacion_Preventivo.id_mantenimiento == id_mantenimiento, 
        Notificacion_Preventivo.mensaje == mensaje, 
        Notificacion_Preventivo.created_at >= datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).replace(hour=0, minute=0, second=0, microsecond=0),
        Notificacion_Preventivo.created_at < datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).replace(hour=23, minute=59, second=59, microsecond=999999)
    ).first()
    if not existing_notification:
        db_notificacion = Notificacion_Preventivo(firebase_uid=firebase_uid, id_mantenimiento=id_mantenimiento, mensaje=mensaje)
        db_session.add(db_notificacion)
        db_session.commit()
        return True
    return False

def notify_users_correctivo(db_session: Session, id_mantenimiento: int, mensaje: str, firebase_uid: str = None):
    if firebase_uid is not None:
        send_notification_correctivo(db_session, firebase_uid, id_mantenimiento, mensaje)
    else:
        encargados = db_session.query(Usuario).filter(Usuario.rol == "Encargado de Mantenimiento").all()
        for encargado in encargados:
            send_notification_correctivo(db_session, encargado.firebase_uid, id_mantenimiento, mensaje)

def notify_users_preventivo(db_session: Session, id_mantenimiento: int, mensaje: str, firebase_uid: str = None):
    if firebase_uid is not None:
        send_notification_preventivo(db_session, firebase_uid, id_mantenimiento, mensaje)
    else:
        encargados = db_session.query(Usuario).filter(Usuario.rol == "Encargado de Mantenimiento").all()
        for encargado in encargados:
            send_notification_preventivo(db_session, encargado.firebase_uid, id_mantenimiento, mensaje)

def notify_nearby_maintenances(db_session: Session, current_entity: dict, mantenimientos: list[dict]):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    firebase_uid = current_entity["data"]["uid"]
    for m in mantenimientos:
        if m.get('tipo') == 'correctivo':
            created = send_notification_correctivo(db_session, firebase_uid, m['id'], m.get('mensaje', ''))
        else:
            created = send_notification_preventivo(db_session, firebase_uid, m['id'], m.get('mensaje', ''))
        if created:
            send_webpush_notification(db_session, firebase_uid, 'Mantenimiento cercano', m.get('mensaje', ''))
    return {"message": "Notificaciones enviadas"}

def delete_notificaciones(db_session: Session, firebase_uid: str):
    db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.firebase_uid == firebase_uid).delete()
    db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.firebase_uid == firebase_uid).delete()
    db_session.commit()
    return {"message": "Notificaciones eliminadas"}

def delete_notificacion(db_session: Session, id_notificacion: int):
    # Buscar en correctivos
    noti = db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.id == id_notificacion).first()
    if noti:
        db_session.delete(noti)
        db_session.commit()
        return True

    # Buscar en preventivos
    noti = db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.id == id_notificacion).first()
    if noti:
        db_session.delete(noti)
        db_session.commit()
        return True

    return False  # No encontrada