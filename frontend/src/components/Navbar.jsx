import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { auth, signOut } from '../services/firebase';

const AppNavbar = () => {
  const { currentUser, currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
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
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {currentEntity && currentEntity.type === 'usuario' && currentEntity.data.rol === 'Administrador' && (
              <>
                <Nav.Link as={Link} to="/users">Usuarios</Nav.Link>
              </>
            )}
            {currentEntity && currentEntity.type === 'usuario' && (
              <>
                <Nav.Link as={Link} to="/cuadrillas">Cuadrillas</Nav.Link>
                <Nav.Link as={Link} to="/sucursales">Sucursales</Nav.Link>
                <Nav.Link as={Link} to="/preventivos">Preventivos</Nav.Link>
              </>
            )}
            <Nav.Link as={Link} to="/mantenimientos-preventivos">Mantenimientos Preventivos</Nav.Link>
            <Nav.Link as={Link} to="/mantenimientos-correctivos">Mantenimientos Correctivos</Nav.Link>
          </Nav>
          <Nav>
            {currentUser ? (
              <>
                <Nav.Link disabled>
                  {currentEntity?.data?.nombre || currentUser.email}
                </Nav.Link>
                <Button variant="outline-light" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;