from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.controllers import users, cuadrillas, sucursales, preventivos, mantenimientos_preventivos, mantenimientos_correctivos, reportes, zonas
from dotenv import load_dotenv
import os

app = FastAPI()

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL")

# Configuración de CORS
origins = [
    FRONTEND_URL,  # Origen del frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Permitir solicitudes desde estos orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)

app.include_router(users.router)
app.include_router(cuadrillas.router)
app.include_router(sucursales.router)
app.include_router(preventivos.router)
app.include_router(mantenimientos_preventivos.router)
app.include_router(mantenimientos_correctivos.router)
app.include_router(reportes.router)
app.include_router(zonas.router)