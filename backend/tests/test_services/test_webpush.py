import importlib

import src.services.webpush as webpush_service


def test_send_webpush_not_configured(monkeypatch, db_session):
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    importlib.reload(webpush_service)
    result = webpush_service.send_webpush_notification(db_session, "uid", "title", "body")
    assert result == {"message": "Web push not configured"}

