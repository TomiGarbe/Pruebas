import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="/home/site/wwwroot/env.config")
print(f"Loaded env: FIREBASE_CREDENTIALS={os.getenv('FIREBASE_CREDENTIALS')}")
def initialize_firebase():
    if not firebase_admin._apps:  # Verifica si la app ya está inicializada
        if os.getenv("TESTING") == "true":
            return None  # No inicializar Firebase en tests
        if os.getenv("FIREBASE_CREDENTIALS"):
            cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS"))
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()

# Inicializar Firebase al importar el módulo
initialize_firebase()