from sqlalchemy.orm import Session
from api.models import Usuario
from fastapi import HTTPException, Depends
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

# Configuración para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración para JWT
SECRET_KEY = "tu_clave_secreta"  # ¡Cambia esto por una clave segura en producción!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuración de OAuth2 para validar el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

def get_users(db: Session):
    return db.query(Usuario).all()

def get_user(db: Session, user_id: int):
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def create_user(db: Session, nombre: str, email: str, contrasena: str, rol: str):
    # Verifica si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Hashea la contraseña antes de guardarla
    hashed_password = pwd_context.hash(contrasena)
    db_user = Usuario(nombre=nombre, email=email, contrasena=hashed_password, rol=rol)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, nombre: str = None, email: str = None, contrasena: str = None, rol: str = None):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if nombre:
        db_user.nombre = nombre
    if email:
        existing_user = db.query(Usuario).filter(Usuario.email == email, Usuario.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        db_user.email = email
    if contrasena:
        db_user.contrasena = pwd_context.hash(contrasena)
    if rol:
        db_user.rol = rol
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(db_user)
    db.commit()
    return {"message": f"Usuario con id {user_id} eliminado"}

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        return None
    if not pwd_context.verify(password, user.contrasena):
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(db: Session, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")