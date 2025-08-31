import { useState, useContext, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Navbar as BootstrapNavbar, Nav, Container, Image, Modal, Button } from "react-bootstrap"
import logoInversur from "../assets/logo_inversur.png"
import { FaBell, FaTimes } from "react-icons/fa"
import { AuthContext } from "../context/AuthContext"
import {
  get_notificaciones_correctivos,
  get_notificaciones_preventivos,
  correctivo_leido,
  preventivo_leido,
  delete_notificacion,
} from "../services/notificaciones"
import { subscribeToNotifications } from "../services/notificationWs"
import "../styles/navbar.css"

const Navbar = () => {
  const { currentEntity, logOut } = useContext(AuthContext)
  const socketRef = useRef(null)
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const handleShowNotifications = () => setShowNotifications(true)
  const handleCloseNotifications = () => setShowNotifications(false)

  const handleLogout = async () => {
    try {
      if (socketRef.current?.close) socketRef.current.close()
      else if (socketRef.current?.disconnect) socketRef.current.disconnect()
      socketRef.current = null
      await logOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      navigate("/login", { state: { error: "Error al cerrar sesión." } })
    }
  }

  const timeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diff = Math.floor((now - past) / 1000) // en segundos

    if (diff < 60) return `hace ${diff} seg`
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`

    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    // Construir string sólo con unidades > 0
    let result = "hace "
    if (days > 0) result += `${days} d `
    if (hours > 0) result += `${hours} h `
    if (minutes > 0) result += `${minutes} min `
    if (seconds > 0) result += `${seconds} seg`

    return result.trim()
  }

  const fetchNotifications = async () => {
    try {
      const uid = currentEntity?.data?.uid
      if (!uid) return

      const [correctivosResp, preventivosResp] = await Promise.all([
        get_notificaciones_correctivos(uid),
        get_notificaciones_preventivos(uid),
      ])

      const correctivos = Array.isArray(correctivosResp.data) ? correctivosResp.data : []
      const preventivos = Array.isArray(preventivosResp.data) ? preventivosResp.data : []

      const mappedCorrectivos = correctivos.map((notif) => ({
        ...notif,
        tipo: "correctivo",
      }))

      const mappedPreventivos = preventivos.map((notif) => ({
        ...notif,
        tipo: "preventivo",
      }))

      const allNotificaciones = [...mappedCorrectivos, ...mappedPreventivos]
      setUnreadCount(allNotificaciones.filter((n) => !n.leida).length)

      // Ordenar por fecha descendente
      allNotificaciones.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setNotifications(allNotificaciones)
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error)
    }
  }

  useEffect(() => {
    if (currentEntity?.data?.uid) fetchNotifications()
  }, [currentEntity?.data?.uid])

  useEffect(() => {
    const uid = currentEntity?.data?.uid
    if (!uid) return

    // Evita depender de WebSocket en JSDOM
    const OPEN = typeof WebSocket !== "undefined" ? WebSocket.OPEN : 1
    if (socketRef.current && socketRef.current.readyState === OPEN) return

    const onMessage = (data) => {
      setNotifications((prev) => {
        const updated = [data, ...prev]
        setUnreadCount(updated.filter((n) => !n.leida).length)
        return updated
      })
    }

    const socket = subscribeToNotifications(uid, onMessage)
    socketRef.current = socket

    return () => {
      if (socketRef.current?.close) socketRef.current.close()
      else if (socketRef.current?.disconnect) socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [currentEntity?.data?.uid])

  const handleClick = async (notification) => {
    if (notification.tipo === "correctivo") {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications()
      navigate("/correctivo", { state: { mantenimientoId } })
      await correctivo_leido(notification.id)
      await fetchNotifications()
    } else if (notification.tipo === "preventivo") {
      const mantenimientoId = notification.id_mantenimiento
      handleCloseNotifications()
      navigate("/preventivo", { state: { mantenimientoId } })
      await preventivo_leido(notification.id)
      await fetchNotifications()
    }
  }

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await delete_notificacion(notificationId)
      await fetchNotifications()
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const correctivosNoLeidos = notifications.filter((n) => n.tipo === "correctivo" && !n.leida)
      const preventivosNoLeidos = notifications.filter((n) => n.tipo === "preventivo" && !n.leida)

      await Promise.all([
        ...correctivosNoLeidos.map((n) => correctivo_leido(n.id)),
        ...preventivosNoLeidos.map((n) => preventivo_leido(n.id)),
      ])

      await fetchNotifications()
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error)
    }
  }

  const renderNotification = (notification, index) => (
    <div
      key={index}
      onClick={() => handleClick(notification)}
      className={`mb-2 p-3 border rounded hover:bg-gray-50 cursor-pointer d-flex align-items-start ${
        notification.tipo === "correctivo" ? "border-theme-secondary" : "border-theme-primary"
      }`}
    >
      <div className="flex-grow-1">
        <div className="d-flex align-items-center mb-1">
          <span
            className={`badge me-2 text-white ${
              notification.tipo === "correctivo" ? "badge-theme-secondary" : "badge-theme-primary"
            }`}
            style={{ fontSize: "10px" }}
          >
            {notification.tipo === "correctivo" ? "CORRECTIVO" : "PREVENTIVO"}
          </span>
          {!notification.leida && (
            <span className="rounded-circle"></span>
          )}
        </div>
        <p className="mb-1 text-dark">{notification.mensaje}</p>
        <small className="text-muted">{timeAgo(notification.created_at)}</small>
      </div>
      <Button
        aria-label="Eliminar notificación"
        className="btn-delete-theme ms-2"
        size="sm"
        onClick={(e) => handleDeleteNotification(notification.id, e)}
      >
        <FaTimes size={12} />
      </Button>
    </div>
  )

  const handleDeleteReadNotifications = async () => {
    try {
      const leidas = notifications.filter((n) => n.leida)
      await Promise.all(leidas.map((n) => delete_notificacion(n.id)))
      await fetchNotifications()
    } catch (error) {
      console.error("Error al eliminar notificaciones leídas:", error)
    }
  }

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="custom-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center custom-navbar-brand">
            <Image src={logoInversur} alt="Inversur Logo" className="custom-logo" />
          </BootstrapNavbar.Brand>
          {/* <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />*/}
          {/*<BootstrapNavbar.Collapse id="basic-navbar-nav">*/}
          <Nav className="me-auto custom-nav-links">
            {currentEntity && currentEntity.type === "usuario" && currentEntity.data.rol === "Administrador" && (
              <>
                <Nav.Link as={Link} to="/users">
                  Usuarios
                </Nav.Link>
              </>
            )}
            {currentEntity && currentEntity.type === "usuario" && (
              <>
                <Nav.Link as={Link} to="/cuadrillas">
                  Cuadrillas
                </Nav.Link>
                <Nav.Link as={Link} to="/sucursales">
                  Sucursales
                </Nav.Link>
              </>
            )}
            {currentEntity && (
              <>
                <Nav.Link as={Link} to="/mantenimientos-preventivos">
                  Mantenimientos Preventivos
                </Nav.Link>
                <Nav.Link as={Link} to="/mantenimientos-correctivos">
                  Mantenimientos Correctivos
                </Nav.Link>
                <Nav.Link /*as={Link} to="/mapas"*/>Mapa</Nav.Link>
              </>
            )}
            {currentEntity && currentEntity.type === "usuario" && currentEntity.data.rol === "Administrador" && (
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

      <Modal show={showNotifications} onHide={handleCloseNotifications} centered aria-labelledby="notif-title">
        <Modal.Header closeButton>
          <Modal.Title id="notif-title" as="h2" className="w-100 text-center">
            Notificaciones
          </Modal.Title>
        </Modal.Header>
        <div className="d-flex justify-content-center gap-3 px-3 mt-2 mb-2">
          <Button
            className="btn-outline-theme-primary d-flex align-items-center gap-2 px-3 py-2"
            onClick={handleMarkAllAsRead}
            title="Marcar todas como leídas"
          >
            <i className="bi bi-check2-all"></i>
            <span className="d-none d-sm-inline">Marcar leídas</span>
          </Button>
          <Button
            className="btn-outline-theme-secondary d-flex align-items-center gap-2 px-3 py-2"
            onClick={handleDeleteReadNotifications}
            title="Eliminar notificaciones leídas"
          >
            <i className="bi bi-trash3"></i>
            <span className="d-none d-sm-inline">Eliminar leídas</span>
          </Button>
        </div>
        <Modal.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
          {notifications.length > 0 ? (
            <div>{notifications.map((notification, index) => renderNotification(notification, index))}</div>
          ) : (
            <div className="text-center py-4">
              <FaBell size={48} className="text-muted mb-3" />
              <p className="text-muted">No tienes notificaciones.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button className="btn-theme-secondary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
          <Button
            variant="secondary"
            onClick={handleCloseNotifications}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Navbar
