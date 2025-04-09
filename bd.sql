-- create_tables.sql

-- Eliminar tablas si ya existen (opcional, para evitar errores si las tablas ya están creadas)
DROP TABLE IF EXISTS reporte CASCADE;
DROP TABLE IF EXISTS mantenimiento_preventivo CASCADE;
DROP TABLE IF EXISTS mantenimiento_correctivo CASCADE;
DROP TABLE IF EXISTS preventivo CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS sucursal CASCADE;
DROP TABLE IF EXISTS cuadrilla CASCADE;

-- Crear tabla sucursal
CREATE TABLE sucursal (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    zona TEXT,
    direccion TEXT,
    superficie TEXT
);

-- Crear tabla cuadrilla
CREATE TABLE cuadrilla (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    zona TEXT,
    email TEXT,
    contrasena TEXT,
    rol TEXT
);

-- Crear tabla usuario
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    email TEXT,
    contrasena TEXT,
    rol TEXT
);

-- Crear tabla preventivo
CREATE TABLE preventivo (
    id SERIAL PRIMARY KEY,
    id_sucursal INTEGER,
    frecuencia TEXT,
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id)
);

-- Crear tabla mantenimiento_preventivo
CREATE TABLE mantenimiento_preventivo (
    id SERIAL PRIMARY KEY,
    id_preventivo INTEGER,
    id_cuadrilla INTEGER,
    fecha_apertura DATE,
    fecha_cierre DATE,
    planilla_1 TEXT,
    planilla_2 TEXT,
    planilla_3 TEXT,
    extendido TIMESTAMP,
    FOREIGN KEY (id_preventivo) REFERENCES preventivo(id),
    FOREIGN KEY (id_cuadrilla) REFERENCES cuadrilla(id)
);

-- Crear tabla mantenimiento_correctivo
CREATE TABLE mantenimiento_correctivo (
    id SERIAL PRIMARY KEY,
    id_sucursal INTEGER,
    id_cuadrilla INTEGER,
    fecha_apertura DATE,
    fecha_cierre DATE,
    numero_caso TEXT,
    incidente TEXT,
    rubro TEXT,
    planilla TEXT,
    estado TEXT,
    prioridad TEXT,
    extendido TIMESTAMP,
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id),
    FOREIGN KEY (id_cuadrilla) REFERENCES cuadrilla(id)
);

-- Crear tabla reporte
CREATE TABLE reporte (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER,
    tipo TEXT,
    contenido TEXT,
    fecha DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);