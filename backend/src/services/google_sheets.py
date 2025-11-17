import os
import json
import hashlib
from datetime import date, datetime

import gspread
from gspread.exceptions import APIError
try:
    from gspread.exceptions import CellNotFound
except ImportError:
    class CellNotFound(Exception):
        """Fallback when gspread does not expose CellNotFound."""
        pass
from oauth2client.service_account import ServiceAccountCredentials
from google.cloud import storage

from api.models import MantenimientoCorrectivo, MantenimientoPreventivo

GOOGLE_CREDENTIALS = os.getenv("GOOGLE_CREDENTIALS")
GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_SHEETS_TRACKING_SALT = os.getenv("GOOGLE_SHEETS_TRACKING_SALT", "inversur-sheet")
GOOGLE_CREDENTIALS_DICT = json.loads(GOOGLE_CREDENTIALS) if GOOGLE_CREDENTIALS else None
storage_client = (
    storage.Client.from_service_account_info(GOOGLE_CREDENTIALS_DICT)
    if GOOGLE_CREDENTIALS_DICT
    else None
)

TRACKING_COLUMN_NAME = "_tracking_token"

CORRECTIVO_HEADER = [
    "cliente",
    "sucursal",
    "cuadrilla",
    "fecha_apertura",
    "fecha_cierre",
    "numero_caso",
    "incidente",
    "rubro",
    "planilla",
    "estado",
    "prioridad",
    "extendido",
    "fotos_gallery_url",
    TRACKING_COLUMN_NAME,
]
CORRECTIVO_VISIBLE_COLUMNS = len(CORRECTIVO_HEADER) - 1

PREVENTIVO_HEADER = [
    "cliente",
    "sucursal",
    "frecuencia",
    "cuadrilla",
    "fecha_apertura",
    "fecha_cierre",
    "extendido",
    "planillas_gallery_url",
    "fotos_gallery_url",
    TRACKING_COLUMN_NAME,
]
PREVENTIVO_VISIBLE_COLUMNS = len(PREVENTIVO_HEADER) - 1

def get_client():
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_dict(GOOGLE_CREDENTIALS_DICT, scope)
    return gspread.authorize(creds)

def _blob_exists(path: str) -> bool:
    if not storage_client or not GOOGLE_CLOUD_BUCKET_NAME:
        return False
    bucket = storage_client.bucket(GOOGLE_CLOUD_BUCKET_NAME)
    return bucket.blob(path).exists()

def get_fotos_gallery_url(mantenimiento_id, tipo):
    blob_path = f"mantenimientos_{tipo}/{mantenimiento_id}/fotos/index.html"
    if not _blob_exists(blob_path):
        return None
    return f"https://storage.googleapis.com/{GOOGLE_CLOUD_BUCKET_NAME}/{blob_path}"

def get_planillas_gallery_url(mantenimiento_id):
    blob_path = f"mantenimientos_preventivos/{mantenimiento_id}/planillas/index.html"
    if not _blob_exists(blob_path):
        return None
    return f"https://storage.googleapis.com/{GOOGLE_CLOUD_BUCKET_NAME}/{blob_path}"

def _column_letter(index: int) -> str:
    if index <= 0:
        return "A"
    result = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result

def _apply_filters(worksheet, visible_columns: int):
    if visible_columns <= 0:
        return
    last_col_letter = _column_letter(visible_columns)
    try:
        worksheet.set_basic_filter(f"A1:{last_col_letter}1")
    except APIError:
        pass
    except Exception:
        pass

def _hide_column(worksheet, column_index: int):
    if column_index <= 0:
        return
    if not hasattr(worksheet, "hide_columns"):
        return
    try:
        worksheet.hide_columns(column_index)
    except APIError:
        pass
    except Exception:
        pass

def _ensure_header(worksheet, header, visible_columns: int):
    if not worksheet.row_values(1):
        worksheet.append_row(header)
    _apply_filters(worksheet, visible_columns)
    _hide_column(worksheet, visible_columns + 1)

def _tracking_token(source) -> str:
    mantenimiento_id = source if isinstance(source, int) else getattr(source, "id", None)
    if not mantenimiento_id:
        return ""
    payload = f"{GOOGLE_SHEETS_TRACKING_SALT}:{mantenimiento_id}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def _format_datetime_value(value):
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)

def _resolve_related_name(mantenimiento, attr: str) -> str:
    related = getattr(mantenimiento, attr, None)
    if related and getattr(related, "nombre", None):
        return related.nombre
    fallback = getattr(mantenimiento, f"{attr}_nombre", None)
    return fallback or ""

def _build_correctivo_row(mantenimiento: MantenimientoCorrectivo, include_links: bool = False):
    foto_url = ""
    if include_links:
        foto_url = get_fotos_gallery_url(mantenimiento.id, "correctivos") or ""
    return [
        _resolve_related_name(mantenimiento, "cliente"),
        _resolve_related_name(mantenimiento, "sucursal"),
        _resolve_related_name(mantenimiento, "cuadrilla"),
        _format_datetime_value(getattr(mantenimiento, "fecha_apertura", None)),
        _format_datetime_value(getattr(mantenimiento, "fecha_cierre", None)),
        getattr(mantenimiento, "numero_caso", "") or "",
        getattr(mantenimiento, "incidente", "") or "",
        getattr(mantenimiento, "rubro", "") or "",
        getattr(mantenimiento, "planilla", "") or "",
        getattr(mantenimiento, "estado", "") or "",
        getattr(mantenimiento, "prioridad", "") or "",
        _format_datetime_value(getattr(mantenimiento, "extendido", None)),
        foto_url,
        _tracking_token(mantenimiento),
    ]

def _build_preventivo_row(mantenimiento: MantenimientoPreventivo, include_links: bool = False):
    planillas_url = ""
    fotos_url = ""
    if include_links:
        planillas_url = get_planillas_gallery_url(mantenimiento.id) or ""
        fotos_url = get_fotos_gallery_url(mantenimiento.id, "preventivos") or ""
    return [
        _resolve_related_name(mantenimiento, "cliente"),
        _resolve_related_name(mantenimiento, "sucursal"),
        getattr(mantenimiento, "frecuencia", "") or "",
        _resolve_related_name(mantenimiento, "cuadrilla"),
        _format_datetime_value(getattr(mantenimiento, "fecha_apertura", None)),
        _format_datetime_value(getattr(mantenimiento, "fecha_cierre", None)),
        _format_datetime_value(getattr(mantenimiento, "extendido", None)),
        planillas_url,
        fotos_url,
        _tracking_token(mantenimiento),
    ]

def append_correctivo(mantenimiento: MantenimientoCorrectivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosCorrectivos")
    _ensure_header(worksheet, CORRECTIVO_HEADER, CORRECTIVO_VISIBLE_COLUMNS)
    worksheet.append_row(_build_correctivo_row(mantenimiento, include_links=False))

def update_correctivo(mantenimiento: MantenimientoCorrectivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosCorrectivos")
    _ensure_header(worksheet, CORRECTIVO_HEADER, CORRECTIVO_VISIBLE_COLUMNS)
    token = _tracking_token(mantenimiento)
    if not token:
        return append_correctivo(mantenimiento)
    try:
        cell = worksheet.find(token, in_column=len(CORRECTIVO_HEADER))
    except CellNotFound:
        return append_correctivo(mantenimiento)
    row = _build_correctivo_row(mantenimiento, include_links=True)
    worksheet.update(f"A{cell.row}:N{cell.row}", [row])

def delete_correctivo(mantenimiento_id: int):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosCorrectivos")
    _ensure_header(worksheet, CORRECTIVO_HEADER, CORRECTIVO_VISIBLE_COLUMNS)
    token = _tracking_token(mantenimiento_id)
    if not token:
        return
    try:
        cell = worksheet.find(token, in_column=len(CORRECTIVO_HEADER))
    except CellNotFound:
        return
    worksheet.delete_rows(cell.row)

def append_preventivo(mantenimiento: MantenimientoPreventivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosPreventivos")
    _ensure_header(worksheet, PREVENTIVO_HEADER, PREVENTIVO_VISIBLE_COLUMNS)
    worksheet.append_row(_build_preventivo_row(mantenimiento, include_links=False))

def update_preventivo(mantenimiento: MantenimientoPreventivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosPreventivos")
    _ensure_header(worksheet, PREVENTIVO_HEADER, PREVENTIVO_VISIBLE_COLUMNS)
    token = _tracking_token(mantenimiento)
    if not token:
        return append_preventivo(mantenimiento)
    try:
        cell = worksheet.find(token, in_column=len(PREVENTIVO_HEADER))
    except CellNotFound:
        return append_preventivo(mantenimiento)
    row = _build_preventivo_row(mantenimiento, include_links=True)
    worksheet.update(f"A{cell.row}:J{cell.row}", [row])

def delete_preventivo(mantenimiento_id: int):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosPreventivos")
    _ensure_header(worksheet, PREVENTIVO_HEADER, PREVENTIVO_VISIBLE_COLUMNS)
    token = _tracking_token(mantenimiento_id)
    if not token:
        return
    try:
        cell = worksheet.find(token, in_column=len(PREVENTIVO_HEADER))
    except CellNotFound:
        return
    worksheet.delete_rows(cell.row)
