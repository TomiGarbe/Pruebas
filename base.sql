-- Insertar usuarios
INSERT INTO usuario (nombre, email, rol)
VALUES 
    ('Admin User', '2105905@ucc.edu.ar', 'Admin');

-- Insertar Zona
INSERT INTO zona (nombre)
VALUES 
    ('Cordoba');

-- Insertar sucursal
INSERT INTO sucursal (nombre, zona, direccion, superficie)
VALUES 
    ('Sucursal 1', 'Cordoba', 'Av. Principal 123', '500 m2');