from fastapi import HTTPException 
from api.models import FCMToken
from sqlalchemy.orm import Session

def save_token(db_session: Session, current_entity: dict, token: str, firebase_uid: str, device_info: str = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    # Remove any existing token for this firebase_uid
    db_session.query(FCMToken).filter(FCMToken.firebase_uid == firebase_uid).delete()
    
    # Check if token is already used by another firebase_uid
    db_session.query(FCMToken).filter(FCMToken.token == token).delete()
    
    db_token = FCMToken(
        firebase_uid=firebase_uid,
        token=token,
        device_info=device_info
    )
    db_session.add(db_token)
    db_session.commit()
    db_session.refresh(db_token)
    
    return {"message": "Token guardado"}