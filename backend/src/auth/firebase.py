import firebase_admin
from firebase_admin import credentials, auth
import os
import json

# Cargar las credenciales desde el archivo o una variable de entorno
if os.getenv("FIREBASE_CREDENTIALS"):
    firebase_creds = json.loads(os.getenv("FIREBASE_CREDENTIALS"))
    cred = credentials.Certificate(firebase_creds)
else:
    cred = credentials.Certificate("firebase-adminsdk.json")

firebase_admin.initialize_app(cred)