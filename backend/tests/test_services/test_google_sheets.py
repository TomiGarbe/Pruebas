from src.services import google_sheets


def test_get_fotos_gallery_url_returns_url():
    expected = (
        "https://storage.googleapis.com/test-bucket/"
        "mantenimientos_correctivos/1/fotos/index.html"
    )
    assert google_sheets.get_fotos_gallery_url(1, "correctivos") == expected
