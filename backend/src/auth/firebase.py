import firebase_admin
from firebase_admin import credentials, auth
import os

def initialize_firebase():
    if not firebase_admin._apps:  # Verifica si la app ya está inicializada
        if os.getenv("TESTING") == "true":
            return None  # No inicializar Firebase en tests
        cred = credentials.Certificate("../credentials/firebase_credentials.json")
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()

# Inicializar Firebase al importar el módulo
initialize_firebase()