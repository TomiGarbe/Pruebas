import json
import os
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from api.models import PushSubscription

import logging

# Configure logger for console output
logger = logging.getLogger("notifications")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

load_dotenv(dotenv_path="./env.config")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")


def send_webpush_notification(db_session: Session, firebase_uid: str, title: str, body: str):
    logger.info("Notificacion push a usuario: %s", firebase_uid)
    
    if not VAPID_PRIVATE_KEY:
        logger.error("VAPID keys not configured; skipping webpush")
        return {"message": "Web push not configured"}
    
    subscriptions = db_session.query(PushSubscription).filter(PushSubscription.firebase_uid == firebase_uid).all()
    logger.info("suscripciones: %s", subscriptions)
    payload = json.dumps({"title": title, "body": body})
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
        }
        try:
            webpush(
                subscription_info,
                payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": "mailto:admin@example.com"}
            )
            logger.info("webpush enviado")
        except Exception as exc:
            logger.exception("webpush error: %s", exc)
            continue
    return {"message": "Web push sent"}
