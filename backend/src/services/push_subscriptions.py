from fastapi import HTTPException
from sqlalchemy.orm import Session
from api.models import PushSubscription
from api.schemas import PushSubscriptionCreate

import logging

# Configure logger for console output
logger = logging.getLogger("notifications")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

def save_subscription(db_session: Session, current_entity: dict, sub: PushSubscriptionCreate):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")

    db_session.query(PushSubscription).filter(PushSubscription.endpoint == sub.endpoint).delete()

    db_sub = PushSubscription(
        firebase_uid=sub.firebase_uid,
        endpoint=sub.endpoint,
        p256dh=sub.keys.p256dh,
        auth=sub.keys.auth,
        device_info=sub.device_info,
    )
    db_session.add(db_sub)
    db_session.commit()
    db_session.refresh(db_sub)

    return {"message": "Subscription saved"}


def get_subscriptions(db_session: Session, firebase_uid: str):
    return db_session.query(PushSubscription).filter(PushSubscription.firebase_uid == firebase_uid).all()


def delete_subscription(db_session: Session, firebase_uid: str, device_info: str):
    logger.warning("delete subscription")
    try:
        subs = db_session.query(PushSubscription).filter(PushSubscription.firebase_uid == firebase_uid and PushSubscription.device_info == device_info).all()
        if not subs:
            raise HTTPException(status_code=404, detail="Subscriptions not found")
        logger.warning("1")
        for sub in subs:
            db_session.delete(sub)
        logger.warning("2")
        db_session.commit()
        return {"message": "Subscription deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
