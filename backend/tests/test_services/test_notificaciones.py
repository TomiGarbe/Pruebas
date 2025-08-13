from unittest.mock import patch
import asyncio
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException
from src.api.models import Usuario
from src.services import notificaciones as notif_service


def test_notify_user_sends_webpush(db_session):
    with patch("src.services.notificaciones.send_webpush_notification") as mock_push:
        result = notif_service.notify_user(db_session, "uid", 1, "mensaje", "title", "body")
        assert result == {"message": "Notification sent"}
        mock_push.assert_called_once()

def test_notify_users_correctivo_roles(db_session):
    encargado = Usuario(email="enc@example.com", rol="Encargado de Mantenimiento", firebase_uid="enc")
    admin = Usuario(email="adm@example.com", rol="Administrador", firebase_uid="adm")
    db_session.add_all([encargado, admin])
    db_session.commit()

    with patch("src.services.notificaciones.send_notification_correctivo", new=AsyncMock()) as mock_send:
        asyncio.run(notif_service.notify_users_correctivo(db_session, 1, "Solucionado"))
        assert mock_send.await_count == 2
        mock_send.assert_any_await(db_session, "enc", 1, "Solucionado")
        mock_send.assert_any_await(db_session, "adm", 1, "Solucionado")


def test_notify_users_preventivo_roles(db_session):
    encargado = Usuario(email="encp@example.com", rol="Encargado de Mantenimiento", firebase_uid="encp")
    admin = Usuario(email="admp@example.com", rol="Administrador", firebase_uid="admp")
    db_session.add_all([encargado, admin])
    db_session.commit()

    with patch("src.services.notificaciones.send_notification_preventivo", new=AsyncMock()) as mock_send:
        asyncio.run(notif_service.notify_users_preventivo(db_session, 2, "Solucionado"))
        assert mock_send.await_count == 2
        mock_send.assert_any_await(db_session, "encp", 2, "Solucionado")
        mock_send.assert_any_await(db_session, "admp", 2, "Solucionado")


def test_notify_nearby_maintenances_sends_webpush(db_session):
    current = {"data": {"uid": "user"}}
    mantenimientos = [
        {"id": 1, "mensaje": "mc", "tipo": "correctivo"},
        {"id": 2, "mensaje": "mp", "tipo": "preventivo"},
    ]

    with patch(
        "src.services.notificaciones.send_notification_correctivo",
        new=AsyncMock(return_value=True),
    ) as mock_correctivo, patch(
        "src.services.notificaciones.send_notification_preventivo",
        new=AsyncMock(return_value=True),
    ) as mock_preventivo, patch(
        "src.services.notificaciones.send_webpush_notification"
    ) as mock_push:
        result = asyncio.run(
            notif_service.notify_nearby_maintenances(db_session, current, mantenimientos)
        )
        assert result == {"message": "Notificaciones enviadas"}
        mock_correctivo.assert_awaited_once_with(db_session, "user", 1, "mc")
        mock_preventivo.assert_awaited_once_with(db_session, "user", 2, "mp")
        assert mock_push.call_count == 2


def test_notify_nearby_maintenances_auth_error(db_session):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(notif_service.notify_nearby_maintenances(db_session, {}, []))
    assert exc.value.status_code == 401