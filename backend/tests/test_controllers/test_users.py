import pytest
from api.models import Usuario
from api.schemas import Role


def test_list_users(client, db_session):
    db_session.add(Usuario(nombre="User1", email="u1@example.com", rol=Role.ENCARGADO))
    db_session.commit()
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(user["email"] == "u1@example.com" for user in data)


def test_get_user(client, db_session):
    user = Usuario(nombre="User2", email="u2@example.com", rol=Role.ENCARGADO)
    db_session.add(user)
    db_session.commit()
    response = client.get(f"/users/{user.id}")
    assert response.status_code == 200
    assert response.json()["email"] == "u2@example.com"


def test_get_user_not_found(client):
    response = client.get("/users/999")
    assert response.status_code == 404
