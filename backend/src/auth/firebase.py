import firebase_admin
from firebase_admin import credentials, auth, db
import os
import json

def initialize_firebase():
    if not firebase_admin._apps:  # Verifica si la app ya está inicializada
        if os.getenv("TESTING") == "true":
            return None  # No inicializar Firebase en tests
        if os.getenv("FIREBASE_CREDENTIALS"):
            cred = credentials.Certificate(json.loads(os.getenv("FIREBASE_CREDENTIALS")))
        firebase_admin.initialize_app(cred, {'databaseURL': os.getenv("FIREBASE_DATABASE_URL")})
    return firebase_admin.get_app()

# Inicializar Firebase al importar el módulo
initialize_firebase()