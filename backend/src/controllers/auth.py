from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.services.auth import verify_user_token

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/verify")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    user = verify_user_token(token, db)
    return {"role": user.rol}