import os
from dotenv import load_dotenv
from api.routes import app

load_dotenv('env.config')

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8000))  # Usa PORT de Azure o 8000 por defecto
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)

#from src.api.routes import app
#
#if __name__ == "__main__":
#    import uvicorn
#    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)