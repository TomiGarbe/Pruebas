import pytest
from src.services.push_subscriptions import save_subscription, get_subscriptions, delete_subscription
from src.api.schemas import PushSubscriptionCreate, PushSubscriptionKeys


def test_save_and_get_subscription(db_session):
    sub = PushSubscriptionCreate(
        endpoint="https://example.com",
        keys=PushSubscriptionKeys(p256dh="p", auth="a"),
        firebase_uid="uid1"
    )
    save_subscription(db_session, {"type": "usuario"}, sub)
    subs = get_subscriptions(db_session, "uid1")
    assert len(subs) == 1
    assert subs[0].endpoint == "https://example.com"


def test_delete_subscription(db_session):
    sub = PushSubscriptionCreate(
        endpoint="https://delete.com",
        keys=PushSubscriptionKeys(p256dh="p2", auth="a2"),
        firebase_uid="uid2"
    )
    save_subscription(db_session, {"type": "usuario"}, sub)
    subs = get_subscriptions(db_session, "uid2")
    response = delete_subscription(db_session, subs[0].id)
    assert response["message"] == "Subscription deleted"
    assert get_subscriptions(db_session, "uid2") == []
