from unittest.mock import patch
import importlib
import src.services.webpush as webpush_service
from src.api.models import PushSubscription

def test_send_webpush_success(monkeypatch, db_session):
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "test-key")
    importlib.reload(webpush_service)
    db_session.add(
        PushSubscription(firebase_uid="uid", endpoint="e", p256dh="p", auth="a")
    )
    db_session.commit()

    with patch("src.services.webpush.webpush") as mock_push:
        result = webpush_service.send_webpush_notification(
            db_session, "uid", "title", "body"
        )
        assert result == {"message": "Web push sent"}
        mock_push.assert_called_once()
