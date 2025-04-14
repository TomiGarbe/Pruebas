# Mi Proyecto
Sistema de gestión de cuadrillas para obras de mantenimiento.

## Tecnologías
- Backend: Python FastAPI (Python 3.12.10)
- Frontend: React
- Bases de datos: PostgreSQL, Firebase
- CI/CD: GitHub Actions
- Despliegue: Heroku

## Instalación
1. Clona el repositorio: git clone <url>
2. Configura las variables de entorno en Backend/.env y Frontend/.env.
3. Docker: docker-compose up -d
4. Backend: cd backend && pip install -r requirements.txt && uvicorn src.main:app --host 0.0.0.0 --port 8000
5. Frontend: cd frontend && npm install && npm run dev

