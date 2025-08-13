from src.services import google_sheets


def test_get_fotos_gallery_url_returns_none():
    assert google_sheets.get_fotos_gallery_url(1, "correctivos") is None

