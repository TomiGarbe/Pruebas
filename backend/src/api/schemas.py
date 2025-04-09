from pydantic import BaseModel, EmailStr
from enum import Enum

class Role(str, Enum):
    ADMIN = "Administrador"
    USER = "Usuario"
    SUPERADMIN = "SuperAdmin"

class UserCreate(BaseModel):
    nombre: str
    email: EmailStr
    contrasena: str
    rol: Role

class UserUpdate(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    contrasena: str | None = None
    rol: Role | None = None