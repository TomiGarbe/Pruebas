from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load configuration
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'src', 'env.config'))
DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    # Check if the column already exists
    result = connection.execute(text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='mensaje_correctivo' AND column_name='firebase_uid'
    """))
    exists = result.fetchone() is not None
    if not exists:
        connection.execute(text('ALTER TABLE mensaje_correctivo ADD COLUMN firebase_uid VARCHAR'))
        print("Column 'firebase_uid' added to mensaje_correctivo")
    else:
        print("Column 'firebase_uid' already exists")
