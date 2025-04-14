-- Insertar usuarios
INSERT INTO usuario (nombre, email, contrasena, rol)
VALUES 
    ('Admin User', 'admin@example.com', 'admin123', 'Admin'),
    ('Encargado Mantenimiento', 'encargado@example.com', 'encargado123', 'Encargado');

-- Insertar Zona
INSERT INTO zona (nombre)
VALUES 
    ('Cordoba');

-- Insertar sucursal
INSERT INTO sucursal (nombre, zona, direccion, superficie)
VALUES 
    ('Sucursal 1', 'Cordoba', 'Av. Principal 123', '500 m2');

-- Insertar cuadrilla
INSERT INTO cuadrilla (nombre, zona, email, contrasena)
VALUES 
    ('Cuadrilla 1', 'Cordoba', 'cuadrilla.1@example.com', 'cuadrilla123');