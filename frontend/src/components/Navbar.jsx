import { Link } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Image } from 'react-bootstrap';

const AppNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" style={{ paddingLeft: '0' }}>
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center" style={{ marginLeft: '10px' }}>
          <Image
            src="https://inversur.com.ar/wp-content/uploads/2024/12/Logo-bco.png"
            height="90"
            alt="Inversur Logo"
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto" style={{ gap: '20px', marginLeft: '20px' }}>
            <Nav.Link as={Link} to="/">Home</Nav.Link>
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
                <Image
                  src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/img%20(31).webp"
                  roundedCircle
                  height="35"
                  alt="User Avatar"
                  style={{ objectFit: 'cover' }}
                />
              }
              id="user-nav-dropdown"
              align="end"
            >
              <NavDropdown.Item href="#">My Profile</NavDropdown.Item>
              <NavDropdown.Item href="#">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;