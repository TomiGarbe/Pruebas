# Configuración de PostgreSQL con SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.models import Base
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'env.config')))
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)