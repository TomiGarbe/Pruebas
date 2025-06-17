from sqlalchemy.orm import Session
from config.database import SessionLocal
from api.models import Usuario
from api.schemas import Role
from fastapi import HTTPException
from firebase_admin import auth
import logging
logging.basicConfig(level=logging.DEBUG, filename='/tmp/app.log')
logger = logging.getLogger(__name__)

def init_admin(email: str, nombre: str, password: str, rol: Role = Role.ADMIN):
    logger.debug("init_admin called")
    db: Session = SessionLocal()
    try:
        # Verificar si ya existe un administrador
        existing_admin = db.query(Usuario).filter(Usuario.rol == Role.ADMIN).first()
        if existing_admin:
            logger.debug(f"Admin exists: {existing_admin.email}")
            print(f"Ya existe un administrador: {existing_admin.email}")
            return
        logger.debug(f"Creating Firebase user: {email}")
        try:
            existing_user = auth.get_user_by_email(email)
            firebase_uid = existing_user.uid
        except auth.UserNotFoundError:
            print(f"Creating admin user in Firebase")
            firebase_user = auth.create_user(email=email, password=password)
            firebase_uid = firebase_user.uid
        
        db_user = Usuario(
            nombre=nombre,
            email=email,
            rol=rol,
            firebase_uid=firebase_uid
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.debug(f"Admin created: {email}")
        print(f"Administrador creado: {email}")
    except HTTPException as e:
        print(f"Error al crear administrador: {e.detail}")
    except Exception as e:
        logger.error(f"Error in init_admin: {str(e)}")
        print(f"Error inesperado: {str(e)}")
    finally:
        db.close()