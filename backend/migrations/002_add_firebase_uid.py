import os
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Load environment configuration
env_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'env.config')
load_dotenv(env_path)
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./test.db')

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite') else {}
)

def add_column_if_not_exists(connection, table_name, column_def):
    inspector = inspect(connection)
    if table_name in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns(table_name)]
        col_name = column_def.split()[0]
        if col_name not in columns:
            connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_def}'))

with engine.begin() as connection:
    add_column_if_not_exists(connection, 'mensaje_correctivo', 'firebase_uid VARCHAR')
    add_column_if_not_exists(connection, 'mensaje_preventivo', 'firebase_uid VARCHAR')

