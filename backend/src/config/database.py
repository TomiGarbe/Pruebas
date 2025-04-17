# Configuración de PostgreSQL con SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.api.models import Base
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="src/env.config")
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)