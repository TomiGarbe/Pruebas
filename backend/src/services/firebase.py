# Ejemplo de integración con Firebase
import pyrebase

def init_firebase():
    config = {
        "apiKey": "AIzaSyCfCip81COg2TK4FxGdNXGrG1njTLf6m_E",
        "authDomain": "proyecto-inversur.firebaseapp.com",
        "databaseURL": "https://proyecto-inversur-default-rtdb.firebaseio.com",
        "projectId": "proyecto-inversur",
        "storageBucket": "proyecto-inversur.firebasestorage.app",
        "messagingSenderId": "212242094333",
        "appId": "1:212242094333:web:7f4b0804feab71eeb4c694",
    }
    return pyrebase.initialize_app(config)
