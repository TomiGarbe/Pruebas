import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Image, Modal, Button } from 'react-bootstrap';
import logoInversur from '../assets/logo_inversur.png';
import { FaBell } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useAuthRoles } from '../hooks/useAuthRoles';
import { correctivo_leido, preventivo_leido, delete_notificacion } from '../services/notificaciones';
import useNotifications from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import '../styles/navbar.css';

const Navbar = () => {
  const { currentEntity, logOut } = useContext(AuthContext);
  const { isAdmin, isUser, isCuadrilla } = useAuthRoles();
  const isLogged = isUser || isCuadrilla;
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, fetchNotifications, disconnect } = useNotifications();

  const handleShowNotifications = () => setShowNotifications(true);
  const handleCloseNotifications = () => setShowNotifications(false);

  const handleLogout = async () => {
    try {
      disconnect();
      await logOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/login', { state: { error: 'Error al cerrar sesión.' } });
    }
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now - past) / 1000); // en segundos

    if (diff < 60) return `hace ${diff} seg`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    // Construir string sólo con unidades > 0
    let result = 'hace ';
    if (days > 0) result += `${days} d `;
    if (hours > 0) result += `${hours} h `;
    if (minutes > 0) result += `${minutes} min `;
    if (seconds > 0) result += `${seconds} seg`;

    return result.trim();
  };

  const handleClick = async (notification) => {
    if (notification.tipo === 'correctivo') {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications();
      navigate('/correctivo', { state: { mantenimientoId } });
      await correctivo_leido(notification.id);
      await fetchNotifications();
    } else if (notification.tipo === 'preventivo') {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications();
      navigate('/preventivo', { state: { mantenimientoId } });
      await preventivo_leido(notification.id);
      await fetchNotifications();
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    e.stopPropagation();
    try {
      await delete_notificacion(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const correctivosNoLeidos = notifications.filter(n => n.tipo === 'correctivo' && !n.leida);
      const preventivosNoLeidos = notifications.filter(n => n.tipo === 'preventivo' && !n.leida);

      await Promise.all([
        ...correctivosNoLeidos.map(n => correctivo_leido(n.id)),
        ...preventivosNoLeidos.map(n => preventivo_leido(n.id))
      ]);

      await fetchNotifications();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleDeleteReadNotifications = async () => {
    try {
      const leidas = notifications.filter(n => n.leida);
      await Promise.all(leidas.map(n => delete_notificacion(n.id))); 
      await fetchNotifications();
    } catch (error) {
      console.error('Error al eliminar notificaciones leídas:', error);
    }
  };

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="custom-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center custom-navbar-brand">
            <Image
              src={logoInversur}
              height="65"
              alt="Inversur Logo"
              className="custom-logo"
            />
          </BootstrapNavbar.Brand>
         {/* <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />*/}
          {/*<BootstrapNavbar.Collapse id="basic-navbar-nav">*/}
            <Nav className="me-auto custom-nav-links">
              {isAdmin && (
                <>
                  <Nav.Link as={Link} to="/users">Usuarios</Nav.Link>
                </>
              )}
              {isUser && (
                <>
                  <Nav.Link as={Link} to="/cuadrillas">Cuadrillas</Nav.Link>
                  <Nav.Link as={Link} to="/sucursales">Sucursales</Nav.Link>
                </>
              )}
              {isLogged && (
                <>
                  <Nav.Link as={Link} to="/mantenimientos-preventivos">Mantenimientos Preventivos</Nav.Link>
                  <Nav.Link as={Link} to="/mantenimientos-correctivos">Mantenimientos Correctivos</Nav.Link>
                  <Nav.Link /*as={Link} to="/mapas"*/>Mapa</Nav.Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Nav.Link /*as={Link} to="/reportes"*/>Reportes</Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="nav-right">
              <Nav.Link onClick={handleShowNotifications} aria-label="Notificaciones" data-testid="notif-btn">
                <div className="notification-icon">
                  <FaBell size={24} color="#fff" />
                  {unreadCount > 0 && <span className="notification-counter">{unreadCount}</span>}
                </div>
              </Nav.Link>
            </Nav>
          {/*</BootstrapNavbar.Collapse>*/}
        </Container>
      </BootstrapNavbar>

      <Modal 
        show={showNotifications} 
        onHide={handleCloseNotifications} 
        centered
        aria-labelledby="notif-title"
      >
        <Modal.Header closeButton>
          <Modal.Title 
          id="notif-title"
          as="h2"
          className="w-100 text-center"
          >
            Notificaciones
          </Modal.Title>
        </Modal.Header>
        <div className="d-flex flex-column gap-2 px-3 mt-2">
          <Button 
            variant="outline-primary" 
            onClick={handleMarkAllAsRead} 
            className="w-100 mark-read-btn"
          >
            <i className="bi bi-check2-all me-2"></i> Marcar todas como leídas
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={handleDeleteReadNotifications} 
            className="w-100"
          >
            <i className="bi bi-trash3 me-2"></i> Eliminar leídas
          </Button>
        </div>
        <Modal.Body>
          {notifications.length > 0 ? (
            <>
              {notifications.some(n => n.tipo === 'correctivo') && (
                <h6 className="mt-2 mb-1 text-muted">Correctivos</h6>
              )}
              {notifications
                .filter(n => n.tipo === 'correctivo')
                .map((notification, index) => (
                  <NotificationItem
                    key={index}
                    notification={notification}
                    timeAgo={timeAgo}
                    onClick={handleClick}
                    onDelete={handleDeleteNotification}
                  />
                ))}
              {notifications.some(n => n.tipo === 'preventivo') && (
                <h6 className="mt-3 mb-1 text-muted">Preventivos</h6>
              )}
              {notifications
                .filter(n => n.tipo === 'preventivo')
                .map((notification, index) => (
                  <NotificationItem
                    key={index}
                    notification={notification}
                    timeAgo={timeAgo}
                    onClick={handleClick}
                    onDelete={handleDeleteNotification}
                  />
                ))}
            </>
          ) : (
            <p>No tienes notificaciones.</p>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="danger" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
          <Button variant="secondary" onClick={handleCloseNotifications}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Navbar;
