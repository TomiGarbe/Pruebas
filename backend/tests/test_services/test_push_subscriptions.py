import pytest
from fastapi import HTTPException

from src.services import push_subscriptions as ps
from api.schemas import PushSubscriptionCreate, PushSubscriptionKeys


def test_save_subscription_requires_auth(db_session):
    sub = PushSubscriptionCreate(
        endpoint="e",
        keys=PushSubscriptionKeys(p256dh="p", auth="a"),
        firebase_uid="uid",
    )
    with pytest.raises(HTTPException) as exc:
        ps.save_subscription(db_session, None, sub)
    assert exc.value.status_code == 401

