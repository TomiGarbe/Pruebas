import asyncio

from src.services import maps as maps_service


def test_get_sucursales_locations_testing_env():
    result = asyncio.run(maps_service.get_sucursales_locations({"type": "usuario"}))
    assert result == []


def test_update_user_location_message():
    current = {"type": "usuario", "data": {"id": "1", "uid": "u", "rol": "Admin"}}
    result = asyncio.run(maps_service.update_user_location(current, "u", "1", "usuario", "User", 1.0, 2.0))
    assert "message" in result

