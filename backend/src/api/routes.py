# backend/src/api/routes.py
from fastapi import FastAPI
from src.controllers import users, cuadrillas, sucursales, preventivos, mantenimientos_preventivos, mantenimientos_correctivos, reportes

app = FastAPI()

app.include_router(users.router)
app.include_router(cuadrillas.router)
app.include_router(sucursales.router)
app.include_router(preventivos.router)
app.include_router(mantenimientos_preventivos.router)
app.include_router(mantenimientos_correctivos.router)
app.include_router(reportes.router)
