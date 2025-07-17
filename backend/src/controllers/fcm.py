from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.fcm import save_token
from api.schemas import FCMTokenCreate
import logging

logger = logging.getLogger("fcm")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)

router = APIRouter(prefix="/fcm-token", tags=["fcm-token"])

@router.post("/", response_model=dict)
def save_fcm_token(request: Request, token_data: FCMTokenCreate, db_session: Session = Depends(get_db)):
    logger.debug(f"Request: {request.method} {request.url} Headers: {dict(request.headers)} Body: {token_data.dict()}")
    current_entity = request.state.current_entity
    result = save_token(db_session, current_entity, token_data.token, token_data.firebase_uid, token_data.device_info)
    logger.info(f"Response: {result}")
    return result