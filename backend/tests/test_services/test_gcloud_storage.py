import importlib
from src.services import gcloud_storage

def test_create_folder(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{\"project_id\": \"test\"}")
    importlib.reload(gcloud_storage)

    class DummyBlob:
        def __init__(self):
            self.uploaded = False

        def exists(self):
            return False

        def upload_from_string(self, content, content_type=None):
            self.uploaded = True

    class DummyBucket:
        def __init__(self):
            self.blob_obj = DummyBlob()

        def blob(self, path):
            return self.blob_obj

    class DummyClient:
        def __init__(self):
            self.bucket_obj = DummyBucket()

        def bucket(self, name):
            return self.bucket_obj
    client = DummyClient()
    monkeypatch.setattr(gcloud_storage.storage.Client, "from_service_account_info", lambda info: client)

    gcloud_storage.create_folder_if_not_exists("bucket", "folder")

    assert client.bucket_obj.blob_obj.uploaded
