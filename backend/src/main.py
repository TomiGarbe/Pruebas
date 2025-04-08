# backend/src/main.py
from fastapi import FastAPI
from src.api.routes import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, debug=True)