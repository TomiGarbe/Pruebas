import pytest
from fastapi import HTTPException
from unittest.mock import patch

from src.services import auth as auth_service


def test_verify_user_token_invalid(db_session):
    with patch.object(auth_service.auth, "verify_id_token", side_effect=Exception("bad")):
        with pytest.raises(HTTPException) as exc:
            auth_service.verify_user_token("token", db_session)
    assert exc.value.status_code == 401

