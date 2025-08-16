from src.services import google_sheets

def test_get_fotos_gallery_url():
    expected = (
        "https://storage.googleapis.com/test-bucket/"
        "mantenimientos_correctivos/1/fotos/index.html"
    )
    assert google_sheets.get_fotos_gallery_url(1, "correctivos") == expected

def test_get_planillas_gallery_url():
    expected = (
        "https://storage.googleapis.com/test-bucket/"
        "mantenimientos_preventivos/1/planillas/index.html"
    )
    assert google_sheets.get_planillas_gallery_url(1) == expected
