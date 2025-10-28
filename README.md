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
3. Cypress (Necesita estar corriendo el backend y frontend en local): cd frontend && npm run cy:run --reporter mocha-junit-reporter --reporter-options "mochaFile=cypress/results.xml"

## Notificaciones web
1. Genera claves VAPID con `npx web-push generate-vapid-keys`.
2. Coloca las claves en `backend/src/env.config` y `frontend/.env` (variables `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VITE_WEB_PUSH_PUBLIC_KEY_*`).
3. Habilita el servicio worker en el navegador y acepta las notificaciones cuando la aplicación lo solicite.

## Gestión de entornos
- El backend detecta automáticamente el archivo de configuración según las variables `APP_ENV` (`default`, `test`, `qa`, `prod`) o `ENV_CONFIG_FILE`. Por defecto usa `backend/src/env.config`.
- Para ejecutar pruebas (unitarias o de integración) en modo test en local genera un archivo dedicado y activa el modo con:  
  `python backend/scripts/render_env_file.py --output backend/src/env.config.test --keys DATABASE_URL FRONTEND_URL ... --append TESTING=true E2E_TESTING=true`  
  `APP_ENV=test ENV_CONFIG_FILE=backend/src/env.config.test TESTING=true E2E_TESTING=true <comando>`
- El script `backend/scripts/render_env_file.py` permite construir archivos `.env` a partir de variables de entorno, ideal para pipelines y CI.

## Configuración de pipeline CI/CD
- El job `integration-tests` genera archivos de entorno específicos para test antes de lanzar Cypress y los limpia al finalizar.
- Define los secretos de GitHub Actions tanto para QA/PROD como para TEST (ej.: `DATABASE_TEST_URL`, `FRONTEND_TEST_URL`, `FIREBASE_CREDENTIALS_JSON_TEST`, etc.).
- Durante las pruebas la pipeline exporta `APP_ENV=test` y `ENV_CONFIG_FILE=backend/src/env.config.test` para el backend y usa un `.env.test` generado dinámicamente para Cypress; al terminar todo vuelve al modo normal.
