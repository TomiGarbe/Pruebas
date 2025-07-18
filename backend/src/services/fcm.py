from fastapi import HTTPException 
from api.models import FCMToken
from sqlalchemy.orm import Session
import logging

# Configure logger for console output
logger = logging.getLogger("fcm")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

def save_token(db_session: Session, current_entity: dict, token: str, firebase_uid: str, device_info: str = None):
    logger.debug(f"Saving token for firebase_uid: {firebase_uid}, token: {token}")
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    existing = db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).first()
    if existing:
        existing.token = token
        existing.device_info = device_info
        db_session.commit()
        db_session.refresh(existing)
    else:
        db_token = FCMToken(
            firebase_uid=firebase_uid,
            token=token,
            device_info=device_info
        )
        db_session.add(db_token)
        db_session.commit()
        db_session.refresh(db_token)
        logger.info(f"Token saved for firebase_uid: {firebase_uid}")
        
    return {"message": "Token guardado"}