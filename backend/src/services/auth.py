from firebase_admin import auth
from sqlalchemy.orm import Session
from src.api.models import Usuario
from fastapi import HTTPException

def verify_user_token(token: str, db: Session):
    try:
        # Verificar el token con Firebase
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get("email")

        if not email:
            raise HTTPException(status_code=400, detail="No se proporcionó un email en el token")

        # Buscar el usuario en la base de datos
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if not user:
            raise HTTPException(status_code=403, detail="Usuario no registrado")

        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")