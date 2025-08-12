import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

# Configurar variables de entorno antes de importar la aplicación
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["TESTING"] = "true"
os.environ.setdefault("GOOGLE_CREDENTIALS", "{}")

# Asegurar que los paquetes del backend sean importables
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "src"))

from src.api.routes import app
from src.api.models import Base
from src.config.database import SessionLocal as AppSessionLocal, engine as app_engine, get_db

engine = app_engine
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def prepare_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    return TestClient(app)

