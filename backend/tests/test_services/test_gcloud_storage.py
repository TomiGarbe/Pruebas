import importlib
import pytest
from fastapi import HTTPException

from src.services import gcloud_storage


def test_create_folder_requires_credentials(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{}")
    importlib.reload(gcloud_storage)
    with pytest.raises(HTTPException) as exc:
        gcloud_storage.create_folder_if_not_exists("bucket", "folder")
    assert exc.value.status_code == 500

