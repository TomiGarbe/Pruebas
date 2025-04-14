import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { auth } from '../services/firebase';
import { signOutUser } from '../services/authService';

const AppNavbar = () => {
  const navigate = useNavigate();
  const user = auth.currentUser; // Verifica si hay un usuario autenticado
  const userRole = localStorage.getItem('userRole'); // Obtiene el rol del usuario

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Inversur App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                {/* Solo los admins pueden gestionar usuarios */}
                {userRole === 'admin' && (
                  <Nav.Link as={Link} to="/users">Usuarios</Nav.Link>
                )}
                {/* Admins y encargados pueden gestionar sucursales */}
                {(userRole === 'admin' || userRole === 'encargado') && (
                  <Nav.Link as={Link} to="/sucursales">Sucursales</Nav.Link>
                )}
                {/* Admins y encargados pueden gestionar cuadrillas */}
                {(userRole === 'admin' || userRole === 'encargado') && (
                  <Nav.Link as={Link} to="/cuadrillas">Cuadrillas</Nav.Link>
                )}
                {/* Admins y encargados pueden gestionar preventivos */}
                {(userRole === 'admin' || userRole === 'encargado') && (
                  <Nav.Link as={Link} to="/preventivos">Preventivos</Nav.Link>
                )}
                {/* Todos los roles pueden ver los mantenimientos preventivos y correctivos */}
                <Nav.Link as={Link} to="/mantenimientos-preventivos">
                  Mantenimientos Preventivos
                </Nav.Link>
                <Nav.Link as={Link} to="/mantenimientos-correctivos">
                  Mantenimientos Correctivos
                </Nav.Link>
              </Nav>
              <Nav>
                <Button variant="outline-light" onClick={handleSignOut}>
                  Cerrar Sesión
                </Button>
              </Nav>
            </>
          ) : (
            <Nav>
              <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;