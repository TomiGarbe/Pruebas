from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.auth.firebase import *
from src.controllers import users, cuadrillas, sucursales, preventivos, mantenimientos_preventivos, mantenimientos_correctivos, reportes, zonas, auth

app = FastAPI()

# Configuración de CORS
origins = [
    "http://localhost:5173",  # Origen del frontend (Vite)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(cuadrillas.router)
app.include_router(sucursales.router)
app.include_router(preventivos.router)
app.include_router(mantenimientos_preventivos.router)
app.include_router(mantenimientos_correctivos.router)
app.include_router(reportes.router)
app.include_router(zonas.router)
app.include_router(auth.router)