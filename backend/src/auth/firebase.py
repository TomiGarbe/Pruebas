import json
import os

import firebase_admin
from firebase_admin import auth, credentials, db

from config.env_loader import load_environment

load_environment()


def initialize_firebase():
    if firebase_admin._apps:
        return firebase_admin.get_app()

    if os.getenv("TESTING") == "true" or os.getenv("E2E_TESTING") == "true":
        return None  # Evitar inicializar Firebase durante los tests

    credentials_raw = os.getenv("FIREBASE_CREDENTIALS")
    if not credentials_raw:
        raise RuntimeError(
            "FIREBASE_CREDENTIALS no está configurado; no se puede inicializar Firebase."
        )

    cred = credentials.Certificate(json.loads(credentials_raw))
    firebase_admin.initialize_app(cred, {"databaseURL": os.getenv("FIREBASE_DATABASE_URL")})
    return firebase_admin.get_app()


# Inicializar Firebase al importar el módulo
initialize_firebase()
