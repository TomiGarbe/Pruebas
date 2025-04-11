from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.controllers import users, cuadrillas, sucursales, preventivos, mantenimientos_preventivos, mantenimientos_correctivos, reportes

app = FastAPI()

# Configuración de CORS
origins = [
    "http://localhost:5173",  # Origen del frontend (Vite)
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