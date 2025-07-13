from fastapi import HTTPException 
from firebase_admin import messaging
from api.models import FCMToken
from api.schemas import FCMTokenCreate
from sqlalchemy.orm import Session

def save_token(db_session: Session, token_data: FCMTokenCreate, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    existing = db_session.query(FCMToken).filter_by(token=token_data.token).first()
    if existing:
        return {"message": "Token ya registrado"}
    token = FCMToken(
        firebase_uid=token_data.firebase_uid,
        token=token_data.token,
        device_info=token_data.device_info
    )
    db_session.add(token)
    db_session.commit()
    return {"message": "Token guardado"}

def send_push_notification_to_token(token: str, title: str, body: str, data: dict = None):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token,
        data=data or {}
    )
    response = messaging.send(message)
    return response

def notify_user_token(db_session: Session, firebase_uid: str, title: str, body: str, data: dict = None):
    token = db_session.query(FCMToken).filter_by(firebase_uid=firebase_uid).first()
    if token is not None:
        try:
            send_push_notification_to_token(token.token, title, body, data)
        except Exception as e:
            print(f"Error enviando push: {e}")