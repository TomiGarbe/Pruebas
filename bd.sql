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
    id_sucursal SERIAL PRIMARY KEY,
    nombre VARCHAR,
    zona VARCHAR,
    direccion VARCHAR,
    superficie INTEGER
);

-- Crear tabla cuadrilla
CREATE TABLE cuadrilla (
    id_cuadrilla SERIAL PRIMARY KEY,
    nombre VARCHAR,
    zona VARCHAR,
    email VARCHAR,
    contrasena VARCHAR,
    rol VARCHAR
);

-- Crear tabla usuario
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR,
    email VARCHAR,
    contrasena VARCHAR,
    rol VARCHAR
);

-- Crear tabla preventivo
CREATE TABLE preventivo (
    id_preventivo SERIAL PRIMARY KEY,
    id_sucursal INTEGER,
    frecuencia VARCHAR,
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal)
);

-- Crear tabla mantenimiento_preventivo
CREATE TABLE mantenimiento_preventivo (
    id_mantenimiento_preventivo SERIAL PRIMARY KEY,
    id_preventivo INTEGER,
    id_cuadrilla INTEGER,
    fecha_apertura DATE,
    fecha_cierre DATE,
    planilla_1 VARCHAR,
    planilla_2 VARCHAR,
    planilla_3 VARCHAR,
    extendido TIMESTAMP,
    FOREIGN KEY (id_preventivo) REFERENCES preventivo(id_preventivo),
    FOREIGN KEY (id_cuadrilla) REFERENCES cuadrilla(id_cuadrilla)
);

-- Crear tabla mantenimiento_correctivo
CREATE TABLE mantenimiento_correctivo (
    id_correctivo SERIAL PRIMARY KEY,
    id_sucursal INTEGER,
    id_cuadrilla INTEGER,
    fecha_apertura DATE,
    fecha_cierre DATE,
    numero_caso VARCHAR,
    incidente VARCHAR,
    rubro VARCHAR,
    planilla VARCHAR,
    estado VARCHAR,
    prioridad VARCHAR,
    extendido TIMESTAMP,
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id_sucursal),
    FOREIGN KEY (id_cuadrilla) REFERENCES cuadrilla(id_cuadrilla)
);

-- Crear tabla reporte
CREATE TABLE reporte (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario INTEGER,
    tipo VARCHAR,
    contenido TEXT,
    fecha DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);