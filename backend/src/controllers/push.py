from fastapi import APIRouter, Depends, Request, Form
from sqlalchemy.orm import Session
from config.database import get_db
from services.push_subscriptions import save_subscription, get_subscriptions, delete_subscription
from api.schemas import PushSubscriptionCreate
from typing import List

import logging

# Configure logger for console output
logger = logging.getLogger("notifications")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

router = APIRouter(prefix="/push", tags=["push"])

@router.post("/subscribe", response_model=dict)
def push_subscribe(request: Request, sub: PushSubscriptionCreate, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return save_subscription(db, current_entity, sub)

@router.get("/subscriptions/{firebase_uid}", response_model=List[dict])
def push_list(firebase_uid: str, db: Session = Depends(get_db)):
    subs = get_subscriptions(db, firebase_uid)
    return [{"id": s.id, "endpoint": s.endpoint} for s in subs]

@router.delete("/subscription", response_model=dict)
def push_delete(firebase_uid: str = Form(...), device_info: str = Form(...), db: Session = Depends(get_db)):
    logger.warning("delete subscription controller")
    return delete_subscription(db, firebase_uid, device_info)
