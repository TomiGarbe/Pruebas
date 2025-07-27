import pytest
from src.services import chats as chats_service


def test_get_chat_correctivo_empty(db_session):
    current_entity = {"user": "test"}
    chat = chats_service.get_chat_correctivo(db_session, 1, current_entity)
    assert chat == []


def test_get_chat_preventivo_empty(db_session):
    current_entity = {"user": "test"}
    chat = chats_service.get_chat_preventivo(db_session, 1, current_entity)
    assert chat == []
