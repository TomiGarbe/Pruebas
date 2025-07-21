from sqlalchemy.orm import Session
from api.models import FCMToken, Notificacion_Correctivo, Notificacion_Preventivo, Usuario
from firebase_admin import messaging

import logging

# Configure logger for console output
logger = logging.getLogger("fcm")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)
    
def send_push_notification_to_token(token: str, title: str, body: str):
    logger.info("Enviando notificacion push")
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        data={
            'title': title,
            'body': body,
        },
        token=token
    )
    logger.info(f"Mensaje a enviar: {message}")
    response = messaging.send(message)
    logger.info(f"Mensaje enviado, respuesta: {response}")
    return response

def notify_user_token(db_session: Session, firebase_uid: str, title: str, body: str):
    logger.info(f"Buscando token de usuario: {firebase_uid}")
    token = db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).first()
    if token is not None:
        logger.info(f"Token encontrado: {token}")
        send_push_notification_to_token(token.token, title, body)
        
    return {"Notification sent"}

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
    db_notificacion = Notificacion_Correctivo(firebase_uid=firebase_uid, id_mantenimiento=id_mantenimiento, mensaje=mensaje)
    db_session.add(db_notificacion)
    db_session.commit()

def send_notification_preventivo(db_session: Session, firebase_uid: str, id_mantenimiento: int, mensaje: str):
    db_notificacion = Notificacion_Preventivo(firebase_uid=firebase_uid, id_mantenimiento=id_mantenimiento, mensaje=mensaje)
    db_session.add(db_notificacion)
    db_session.commit()

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

def delete_notificaciones(db_session: Session, firebase_uid: str):
    db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.firebase_uid == firebase_uid).delete()
    db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.firebase_uid == firebase_uid).delete()
    db_session.commit()
    return {"message": "Notificaciones eliminadas"}