# Ejemplo con FastAPI (ajusta según tu framework)
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}
