import pytest
from fastapi import HTTPException

from src.services import chats as chat_service


def test_get_chat_correctivo_empty(db_session):
    result = chat_service.get_chat_correctivo(db_session, 1, {"type": "usuario"})
    assert result == {"message": "No hay mensajes"}


def test_get_chat_correctivo_requires_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        chat_service.get_chat_correctivo(db_session, 1, None)
    assert exc.value.status_code == 401

