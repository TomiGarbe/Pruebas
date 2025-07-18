from sqlalchemy.orm import Session
from api.models import FCMToken
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
    logger.debug("Sending push notification")
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token
    )
    response = messaging.send(message)
    logger.info("Push notification sent successfully")
    return response

def notify_user_token(db_session: Session, firebase_uid: str, title: str, body: str):
    token = db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).first()
    logger.debug("notificaion desde correctivo")
    if token is not None:
        logger.debug("enviando notificaion")
        send_push_notification_to_token(token.token, title, body)
        logger.debug("notificacion enviada")
        
    return {"Notification sent"}