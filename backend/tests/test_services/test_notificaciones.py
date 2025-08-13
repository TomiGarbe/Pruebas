from unittest.mock import patch

from src.services import notificaciones as notif_service


def test_notify_user_sends_webpush(db_session):
    with patch("src.services.notificaciones.send_webpush_notification") as mock_push:
        result = notif_service.notify_user(db_session, "uid", 1, "mensaje", "title", "body")
        assert result == {"message": "Notification sent"}
        mock_push.assert_called_once()

