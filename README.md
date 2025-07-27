# Inversur App
Sistema de gestión de cuadrillas para obras de mantenimiento.

## Tecnologías
- Backend: Python (FastAPI)
- Frontend: React
- Bases de datos: PostgreSQL, Firebase
- CI/CD: GitHub Actions
- Despliegue: Azure

## Instalación
1. Clona el repositorio: git clone <url>
2. Configura las variables de entorno en Backend/src/env.config y Frontend/.env
3. Docker: docker-compose up -d
4. Backend: cd backend && pip install -r requirements.txt && cd src && uvicorn main:app --host 0.0.0.0 --port 8000
5. Frontend: cd frontend && npm install && npm run dev

## Tests con code coverage
1. Backend: cd backend && pytest -v --cov=src --cov-report=xml --junitxml=pytest-report.xml
2. Frontend: cd frontend && npm test -- --coverage --ci
3. Cypress (Necesita estar corriendo el backend y frontend en local): cd frontend && npx cypress run --reporter mocha-junit-reporter --reporter-options "mochaFile=cypress/results.xml"

## Notificaciones web
1. Genera claves VAPID con `npx web-push generate-vapid-keys`.
2. Coloca las claves en `backend/src/env.config` y `frontend/.env` (variables `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VITE_WEB_PUSH_PUBLIC_KEY_*`).
3. Habilita el servicio worker en el navegador y acepta las notificaciones cuando la aplicación lo solicite.

## Actualización de la base de datos
Si al enviar o recibir mensajes en los chats se obtiene un error similar a:
`psycopg2.errors.UndefinedColumn: column "firebase_uid" of relation "mensaje_correctivo" does not exist`
es necesario agregar la columna faltante en la base de datos. Ejecuta el script:

```bash
python backend/scripts/add_firebase_uid_column.py
```

El script comprueba si la columna existe y, de no existir, la crea.
