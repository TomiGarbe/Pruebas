from fastapi import HTTPException 
from firebase_admin import messaging
from api.models import FCMToken
from sqlalchemy.orm import Session

def save_token(db_session: Session, current_entity: dict, token: str, firebase_uid: str, device_info: str = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    existing = db_session.query(FCMToken).filter(FCMToken.token == token).first()
    if existing:
        return {"message": "Token ya registrado"}
    db_token = FCMToken(
        firebase_uid=firebase_uid,
        token=token,
        device_info=device_info
    )
    db_session.add(db_token)
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
    tokens = db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).all()
    for token in tokens:
        try:
            send_push_notification_to_token(token.token, title, body, data)
        except Exception as e:
            print(f"Error enviando push: {e}")