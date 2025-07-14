from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.fcm import save_token
from api.schemas import FCMTokenCreate

router = APIRouter(prefix="/fcm-token", tags=["fcm-token"])

@router.post("/", response_model=dict)
def save_fcm_token(request: Request, token_data: FCMTokenCreate, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return save_token(db_session, current_entity, token_data.token, token_data.firebase_uid, token_data.device_info)