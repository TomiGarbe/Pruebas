from src.services import chats as chat_service
from src.api.models import MensajeCorrectivo, MensajePreventivo

def test_get_chat_correctivo(db_session):
    msg = MensajeCorrectivo(firebase_uid="uid", nombre_usuario="N", id_mantenimiento=1, texto="hola")
    db_session.add(msg)
    db_session.commit()

    result = chat_service.get_chat_correctivo(db_session, 1, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].texto == "hola"

def test_get_chat_preventivo(db_session):
    msg = MensajePreventivo(firebase_uid="uid", nombre_usuario="N", id_mantenimiento=1, texto="hola")
    db_session.add(msg)
    db_session.commit()

    result = chat_service.get_chat_preventivo(db_session, 1, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].texto == "hola"
