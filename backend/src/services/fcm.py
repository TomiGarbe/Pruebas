from fastapi import HTTPException 
from firebase_admin import messaging
from api.models import FCMToken
from sqlalchemy.orm import Session
import logging

# Configure logger for console output
logger = logging.getLogger("fcm")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)

def save_token(db_session: Session, current_entity: dict, token: str, firebase_uid: str, device_info: str = None):
    logger.debug(f"Saving token for firebase_uid: {firebase_uid}, token: {token}")
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    existing = db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).first()
    if existing:
        db_session.delete(existing)
        db_session.commit()

    db_token = FCMToken(
        firebase_uid=firebase_uid,
        token=token,
        device_info=device_info
    )
    db_session.add(db_token)
    db_session.commit()
    logger.info(f"Token saved for firebase_uid: {firebase_uid}")
    return {"message": "Token guardado"}

def send_push_notification_to_token(token: str, title: str, body: str, data: dict = None):
    logger.debug(f"Sending push notification to token: {token}, title: {title}, body: {body}")
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token,
        data=data or {}
    )
    response = messaging.send(message)
    logger.info(f"Push notification sent successfully to token: {token}, response: {response}")
    return response

def notify_user_token(db_session: Session, firebase_uid: str, title: str, body: str, data: dict = None):
    token = db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).first()

    if token is not None:
        logger.debug(f"Sending notification to token: {token.token}")
        try:
            send_push_notification_to_token(token.token, title, body, data)
        except Exception as e:
            logger.error(f"Error sending push to token {token.token}: {e}")
            print(f"Error enviando push: {e}")