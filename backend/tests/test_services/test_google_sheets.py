from unittest.mock import Mock
from datetime import date
from src.services import google_sheets
from src.api.models import MantenimientoCorrectivo, MantenimientoPreventivo

def _mock_client_with_worksheet(worksheet):
    spreadsheet = Mock()
    spreadsheet.worksheet.return_value = worksheet
    client = Mock()
    client.open_by_key.return_value = spreadsheet
    return client

def _sample_correctivo():
    return MantenimientoCorrectivo(
        id=1,
        id_sucursal=1,
        id_cuadrilla=2,
        fecha_apertura=date(2024, 1, 1),
        fecha_cierre=None,
        numero_caso="NC",
        incidente="Inc",
        rubro="Rubro",
        planilla=None,
        estado="open",
        prioridad="alta",
        extendido=None,
    )

def _sample_preventivo():
    return MantenimientoPreventivo(
        id=1,
        id_sucursal=1,
        frecuencia="mensual",
        id_cuadrilla=2,
        fecha_apertura=date(2024, 1, 1),
        fecha_cierre=None,
        extendido=None,
    )

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

def test_append_correctivo(monkeypatch):
    worksheet = Mock()
    worksheet.row_values.return_value = ["id"]
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.append_correctivo(None, _sample_correctivo())

    worksheet.append_row.assert_called_once_with(
        [
            1,
            1,
            2,
            "2024-01-01",
            "",
            "NC",
            "Inc",
            "Rubro",
            "",
            "open",
            "alta",
            "",
        ]
    )

def test_update_correctivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    mantenimiento = _sample_correctivo()
    google_sheets.update_correctivo(None, mantenimiento)

    worksheet.update.assert_called_once_with(
        "A2:M2",
        [
            [
                1,
                1,
                2,
                "2024-01-01",
                "",
                "NC",
                "Inc",
                "Rubro",
                "",
                "open",
                "alta",
                "",
                google_sheets.get_fotos_gallery_url(1, "correctivos"),
            ]
        ],
    )

def test_delete_correctivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.delete_correctivo(None, 1)

    worksheet.delete_rows.assert_called_once_with(2)

def test_append_preventivo(monkeypatch):
    worksheet = Mock()
    worksheet.row_values.return_value = ["id"]
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.append_preventivo(None, _sample_preventivo())

    worksheet.append_row.assert_called_once_with(
        [1, 1, "mensual", 2, "2024-01-01", "", ""]
    )

def test_update_preventivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.update_preventivo(None, _sample_preventivo())

    worksheet.update.assert_called_once_with(
        "A2:I2",
        [
            [
                1,
                1,
                "mensual",
                2,
                "2024-01-01",
                "",
                "",
                google_sheets.get_planillas_gallery_url(1),
                google_sheets.get_fotos_gallery_url(1, "preventivos"),
            ]
        ],
    )

def test_delete_preventivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.delete_preventivo(None, 1)

    worksheet.delete_rows.assert_called_once_with(2)
