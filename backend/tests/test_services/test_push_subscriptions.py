from src.services import push_subscriptions as ps
from src.api.schemas import PushSubscriptionCreate, PushSubscriptionKeys

def test_save_subscription(db_session):
    sub = PushSubscriptionCreate(
        endpoint="e",
        keys=PushSubscriptionKeys(p256dh="p", auth="a"),
        firebase_uid="uid",
        device_info="web",
    )

    result = ps.save_subscription(db_session, {"type": "usuario"}, sub)

    assert result["message"] == "Subscription saved"
    assert len(ps.get_subscriptions(db_session, "uid")) == 1
