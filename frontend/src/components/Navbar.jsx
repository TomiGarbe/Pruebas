import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Image } from 'react-bootstrap';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" style={{ paddingLeft: '0' }}>
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center" style={{ marginLeft: '10px' }}>
          <Image
            src="https://inversur.com.ar/wp-content/uploads/2024/12/Logo-bco.png"
            height="90"
            alt="Inversur Logo"
            style={{ objectFit: 'contain' }}
          />
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto" style={{ gap: '20px', marginLeft: '20px' }}>
            <Nav.Link as={Link} to="/home">Home</Nav.Link>
            <Nav.Link as={Link} to="/users">Usuarios</Nav.Link>
            <Nav.Link as={Link} to="/sucursales">Sucursales</Nav.Link>
            <Nav.Link as={Link} to="/cuadrillas">Cuadrillas</Nav.Link>
            <Nav.Link as={Link} to="/preventivos">Preventivos</Nav.Link>
            <Nav.Link as={Link} to="/mantenimientos-preventivos">Mantenimientos Preventivos</Nav.Link>
            <Nav.Link as={Link} to="/mantenimientos-correctivos">Mantenimientos Correctivos</Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown 
              title={
                <div className="d-flex align-items-center">
                  <Image
                    src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/img%20(31).webp"
                    roundedCircle
                    height="35"
                    alt="User Avatar"
                    style={{ objectFit: 'cover', marginRight: '8px' }}
                  />
                  <span>{user.nombre || 'Usuario'}</span>
                </div>
              }
              id="user-nav-dropdown"
              align="end"
            >
              <NavDropdown.Item as={Link} to="/profile">Mi Perfil</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/settings">Configuración</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;