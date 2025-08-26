import React, { useEffect, useMemo, useRef, useState, useContext, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap'
import { AuthContext } from '../context/AuthContext'
import { BsUpload, BsTrashFill, BsPencilFill, BsX, BsSave } from 'react-icons/bs'
import { FiSend, FiPlusCircle, FiCheckCircle, FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import {
  updateMantenimientoCorrectivo,
  deleteMantenimientoPhoto,
  deleteMantenimientoPlanilla,
  getMantenimientoCorrectivo,
} from '../services/mantenimientoCorrectivoService'
import { getSucursales } from '../services/sucursalService'
import { getCuadrillas } from '../services/cuadrillaService'
import { selectCorrectivo, deleteCorrectivo } from '../services/maps'
import { getChatCorrectivo, sendMessageCorrectivo } from '../services/chats'
import { subscribeToChat } from '../services/chatWs'
import BackButton from '../components/BackButton'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../styles/mantenimientos.css'

/** -------------------------------------
 * Utils
 * --------------------------------------*/
const todayYYYYMMDD = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatExtendido = (fechaIso) => {
  if (!fechaIso) return ''
  const date = new Date(fechaIso)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

const buildFormData = (payload) => {
  const fd = new FormData()
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (key === 'fotos' && Array.isArray(value)) {
      value.forEach((file) => fd.append('fotos', file))
      return
    }

    fd.append(key, value)
  })
  return fd
}

/** -------------------------------------
 * Component
 * --------------------------------------*/
const Correctivo = () => {
  const { currentEntity } = useContext(AuthContext)
  const uid = currentEntity?.data?.uid
  const displayName = currentEntity?.data?.nombre

  const location = useLocation()
  const mantenimientoId = location.state?.mantenimientoId

  // ------------ state ---------------
  const [mantenimiento, setMantenimiento] = useState({})
  const [sucursales, setSucursales] = useState([])
  const [cuadrillas, setCuadrillas] = useState([])

  const [formData, setFormData] = useState({
    planilla: '',
    fotos: [],
    fecha_cierre: '',
    extendido: '',
    estado: '',
  })

  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false)
  const [isSelectingPlanilla, setIsSelectingPlanilla] = useState(false)
  const [planillaPreview, setPlanillaPreview] = useState('')
  const [fotoPreviews, setFotoPreviews] = useState([])
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedPlanilla, setSelectedPlanilla] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [archivoAdjunto, setArchivoAdjunto] = useState(null)
  const [previewArchivoAdjunto, setPreviewArchivoAdjunto] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const chatBoxRef = useRef(null)
  const previewUrlsRef = useRef([]) // para revocar URLs

  // ------------ responsive ---------------
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ------------ data fetch ---------------
  const fetchMantenimiento = useCallback(async () => {
    if (!mantenimientoId) return
    setIsLoading(true)
    try {
      const response = await getMantenimientoCorrectivo(mantenimientoId)
      const data = response.data
      setMantenimiento(data)
      setFormData((prev) => ({
        ...prev,
        planilla: '',
        fotos: [],
        fecha_cierre: data.fecha_cierre?.split('T')[0] || '',
        extendido: data.extendido || '',
        estado: data.estado,
      }))
      await cargarMensajes(data.id)
    } catch (err) {
      console.error('Error fetching mantenimiento:', err)
      setError('Error al cargar los datos actualizados.')
    } finally {
      setIsLoading(false)
    }
  }, [mantenimientoId])

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const [sucursalesResponse, cuadrillasResponse] = await Promise.all([
        getSucursales(),
        getCuadrillas(),
      ])
      setSucursales(sucursalesResponse.data || [])
      setCuadrillas(cuadrillasResponse.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMantenimiento()
    fetchCatalogs()
  }, [fetchMantenimiento, fetchCatalogs])

  // ------------ chat (websocket + polling bootstrap) ---------------
  useEffect(() => {
    let socket
    let reconnectTimeout

    const connect = () => {
      if (!mantenimiento?.id) return
      socket = subscribeToChat(mantenimiento.id, (data) => {
        setMensajes((prev) => (Array.isArray(data) ? data : [...prev, data]))
        scrollToBottom()
      })

      if (socket) {
        socket.onclose = () => {
          reconnectTimeout = setTimeout(connect, 5000)
        }
        socket.onerror = () => socket.close()
      }
    }

    connect()
    return () => {
      if (socket) socket.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [mantenimiento?.id])

  // ------------ helpers (selectors) ---------------
  const sucursalById = useMemo(
    () => (id) => sucursales.find((s) => s.id === id),
    [sucursales]
  )
  const cuadrillaById = useMemo(
    () => (id) => cuadrillas.find((c) => c.id === id),
    [cuadrillas]
  )

  const getSucursalNombre = (id) => sucursalById(id)?.nombre || 'Desconocida'
  const getZonaNombre = (id) => sucursalById(id)?.zona || 'Desconocida'
  const getCuadrillaNombre = (id) => cuadrillaById(id)?.nombre || 'Desconocida'

  // ------------ file handlers ---------------
  const revokeAllPreviewUrls = () => {
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    previewUrlsRef.current = []
  }

  useEffect(() => () => revokeAllPreviewUrls(), [])

  const handleFileChange = (e, field) => {
    const { files } = e.target
    if (!files || files.length === 0) return

    if (field === 'planilla') {
      const file = files[0]
      const url = URL.createObjectURL(file)
      revokeAllPreviewUrls()
      previewUrlsRef.current.push(url)
      setPlanillaPreview(url)
      setFormData((prev) => ({ ...prev, planilla: file }))
      return
    }

    if (field === 'fotos') {
      const list = Array.from(files)
      const previews = list.map((f) => {
        const url = URL.createObjectURL(f)
        previewUrlsRef.current.push(url)
        return url
      })
      setFormData((prev) => ({ ...prev, fotos: list }))
      setFotoPreviews(previews)
    }
  }

  const handleExtendidoChange = (e) => {
    setFormData((prev) => ({ ...prev, extendido: e.target.value }))
  }

  // ------------ selection handlers ---------------
  const handlePlanillaSelect = (planillaUrl) => {
    setSelectedPlanilla((prev) => (prev === planillaUrl ? null : planillaUrl))
  }

  const handlePhotoSelect = (photoUrl) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoUrl) ? prev.filter((u) => u !== photoUrl) : [...prev, photoUrl]
    )
  }

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedImage(null)
  }

  // ------------ CRUD actions ---------------
  const refreshAfterMutation = async (msgOk) => {
    setSuccess(msgOk)
    await fetchMantenimiento()
  }

  const handleDeleteSelectedPlanilla = async () => {
    if (!selectedPlanilla || !mantenimiento?.id) return
    setIsLoading(true)
    try {
      const fileName = selectedPlanilla.split('/').pop()
      await deleteMantenimientoPlanilla(mantenimiento.id, fileName)
      setSelectedPlanilla(null)
      setIsSelectingPlanilla(false)
      await refreshAfterMutation('Planilla eliminada correctamente.')
    } catch (err) {
      console.error('Error al eliminar la planilla:', err)
      setError('Error al eliminar la planilla.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSelectedPhotos = async () => {
    if (!selectedPhotos.length || !mantenimiento?.id) return
    setIsLoading(true)
    try {
      for (const url of selectedPhotos) {
        const fileName = url.split('/').pop()
        await deleteMantenimientoPhoto(mantenimiento.id, fileName)
      }
      setSelectedPhotos([])
      await refreshAfterMutation('Fotos eliminadas correctamente.')
    } catch (err) {
      console.error('Error deleting photos:', err)
      setError('Error al eliminar las fotos.')
    } finally {
      setIsLoading(false)
    }
  }

  const submitUpdate = async (payload, okMsg = 'Archivos y datos actualizados correctamente.') => {
    if (!mantenimiento?.id) return
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const fd = buildFormData(payload)
      await updateMantenimientoCorrectivo(mantenimiento.id, fd)
      await refreshAfterMutation(okMsg)
    } catch (err) {
      console.error('Error updating mantenimiento:', err)
      setError(err?.response?.data?.detail || 'Error al actualizar los datos.')
    } finally {
      setIsLoading(false)
    }
  }

  // Se usa la nueva funcion para poner la fecha actual cuando se cierra el mantimiento
  const maybeAutoCloseDate = (estado, fecha_cierre) => {
    if (fecha_cierre) return fecha_cierre
    if (estado === 'Finalizado' || estado === 'Solucionado') return todayYYYYMMDD()
    return ''
  }

  const handleSubmit = async (e, override = null) => {
    e.preventDefault()
    const data = override || formData
    const fecha_cierre = maybeAutoCloseDate(data.estado, data.fecha_cierre)

    await submitUpdate({
      planilla: data.planilla || undefined,
      fotos: data.fotos || undefined,
      fecha_cierre: fecha_cierre || undefined,
      extendido: data.extendido || undefined,
      estado: data.estado || undefined,
    })

    // reset inputs locales
    setFormData({ planilla: '', fotos: [], fecha_cierre: '', extendido: '', estado: '' })
    setPlanillaPreview('')
    setFotoPreviews([])
  }

  const handleFinish = async () => {
    const hasPlanilla = !!mantenimiento?.planilla
    const hasFoto = (mantenimiento?.fotos || []).length > 0

    if (!hasPlanilla || !hasFoto) {
      setError('Debe cargar al menos una planilla y una foto para marcar como finalizado.')
      return
    }

    const payload = { fecha_cierre: todayYYYYMMDD(), estado: 'Solucionado' }
    await submitUpdate(payload, 'Mantenimiento marcado como finalizado correctamente.')
  }

  // Ruta
  const toggleRoute = () => {
    if (!mantenimiento?.id) return
    if (isSelected) {
      deleteCorrectivo(mantenimiento.id)
      setSuccess('Mantenimiento eliminado de la ruta.')
    } else {
      const seleccion = { id_mantenimiento: mantenimiento.id, id_sucursal: mantenimiento.id_sucursal }
      selectCorrectivo(seleccion)
      setSuccess('Mantenimiento agregado a la ruta.')
    }
    setIsSelected((s) => !s)
  }

  // ------------ Chat ---------------
  const cargarMensajes = async (id) => {
    try {
      const response = await getChatCorrectivo(id)
      setMensajes(response.data || [])
      scrollToBottom()
    } catch (err) {
      console.error('Error al cargar mensajes:', err)
    }
  }

  const handleEnviarMensaje = async () => {
    if (!uid) return
    if (!nuevoMensaje && !archivoAdjunto) return

    const fd = new FormData()
    fd.append('firebase_uid', uid)
    fd.append('nombre_usuario', displayName || 'Usuario')
    if (nuevoMensaje) fd.append('texto', nuevoMensaje)
    if (archivoAdjunto) fd.append('archivo', archivoAdjunto)

    try {
      await sendMessageCorrectivo(mantenimiento.id, fd)
      setNuevoMensaje('')
      setArchivoAdjunto(null)
      setPreviewArchivoAdjunto(null)
    } catch (err) {
      console.error('Error al enviar mensaje:', err)
      setError('No se pudo enviar el mensaje')
    }
  }

  const scrollToBottom = () => {
    // peq. delay para asegurar que el DOM ya pintó
    setTimeout(() => {
      if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }, 100)
  }

  // ------------ Secciones de guardado separadas ---------------
  const handleSaveInfo = async (e) => {
    e.preventDefault()
    const payload = {}

    // Permitir limpiar extendido si viene vacío
    if (formData.extendido !== undefined) payload.extendido = formData.extendido || ''

    if (formData.estado) {
      payload.estado = formData.estado
      if (!mantenimiento.fecha_cierre && (formData.estado === 'Finalizado' || formData.estado === 'Solucionado')) {
        payload.fecha_cierre = todayYYYYMMDD()
      }
    }

    await submitUpdate(payload, 'Información actualizada correctamente.')
  }

  const handleSavePlanilla = async (e) => {
    e.preventDefault()
    if (!formData.planilla) return setError('Seleccione una planilla para guardar.')
    await submitUpdate({ planilla: formData.planilla }, 'Planilla guardada correctamente.')
    setFormData((prev) => ({ ...prev, planilla: '' }))
    setPlanillaPreview('')
  }

  const handleSavePhotos = async (e) => {
    e.preventDefault()
    if ((formData.fotos || []).length === 0) return setError('Seleccione fotos para guardar.')
    await submitUpdate({ fotos: formData.fotos }, 'Fotos guardadas correctamente.')
    setFormData((prev) => ({ ...prev, fotos: [] }))
    setFotoPreviews([])
  }

  // ------------ Render Chat ---------------
  const renderChatContent = () => (
    <>
      <div className="chat-box" ref={chatBoxRef}>
        {mensajes.map((msg, i) => {
          const esPropio = msg.firebase_uid === uid
          const esImagen = /\.(jpeg|jpg|png|gif)$/i.test(msg.archivo || '')
          return (
            <div key={i} className={`chat-message ${esPropio ? 'chat-message-sent' : 'chat-message-received'}`}>
              {msg.texto && <p className="chat-message-text">{msg.texto}</p>}
              {msg.archivo && (
                esImagen ? (
                  <img src={msg.archivo} alt="Adjunto" className="chat-image-preview" />
                ) : (
                  <a href={msg.archivo} target="_blank" rel="noopener noreferrer" className="chat-file-link">
                    Archivo adjunto
                  </a>
                )
              )}
              <span className="chat-info">
                {msg.nombre_usuario} · {new Date(msg.fecha).toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {archivoAdjunto && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Archivo a enviar:</strong>
          <br />
          {archivoAdjunto.type.startsWith('image/') && (
            <img src={previewArchivoAdjunto} alt="preview" style={{ maxWidth: '100px', borderRadius: '8px' }} />
          )}
          {archivoAdjunto.type.startsWith('video/') && (
            <video controls style={{ maxWidth: '120px', borderRadius: '8px' }}>
              <source src={previewArchivoAdjunto} type={archivoAdjunto.type} />
              Tu navegador no soporta videos.
            </video>
          )}
          {!archivoAdjunto.type.startsWith('image/') && !archivoAdjunto.type.startsWith('video/') && (
            <span>{archivoAdjunto.name}</span>
          )}
        </div>
      )}

      <div className="chat-input-form">
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          className="chat-input"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            setArchivoAdjunto(file || null)
            if (!file) return setPreviewArchivoAdjunto(null)
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
              const url = URL.createObjectURL(file)
              previewUrlsRef.current.push(url)
              setPreviewArchivoAdjunto(url)
            } else {
              setPreviewArchivoAdjunto(file.name)
            }
          }}
          style={{ display: 'none' }}
          id="archivoAdjunto"
        />
        <label htmlFor="archivoAdjunto" className="chat-attach-btn">📎</label>
        <Button variant="light" className="chat-send-btn" onClick={handleEnviarMensaje}>
          <FiSend size={20} color="black" />
        </Button>
      </div>
    </>
  )

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <div className="custom-div">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <Col className="info-section">
              <h4 className="info-section-title">Mantenimiento Correctivo</h4>

              <div className="info-field">
                <strong className="info-label">Sucursal:</strong> {mantenimiento.id_sucursal ? getSucursalNombre(mantenimiento.id_sucursal) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Cuadrilla:</strong> {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Zona:</strong> {mantenimiento.id_sucursal ? getZonaNombre(mantenimiento.id_sucursal) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Apertura:</strong> {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Numero de Caso:</strong> {mantenimiento.numero_caso}
              </div>
              <div className="info-field">
                <strong className="info-label">Incidente:</strong> {mantenimiento.incidente}
              </div>
              <div className="info-field">
                <strong className="info-label">Rubro:</strong> {mantenimiento.rubro}
              </div>
              <div className="info-field">
                <strong className="info-label">Prioridad:</strong> {mantenimiento.prioridad}
              </div>
              <div className="info-field">
                <strong className="info-label">Estado:</strong> {mantenimiento.estado}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Cierre:</strong> {mantenimiento.fecha_cierre?.split('T')[0] || 'Mantenimiento no finalizado'}
              </div>
              <div className="info-field">
                <strong className="info-label">Extendido:</strong> {mantenimiento.extendido ? `${formatExtendido(mantenimiento.extendido)} hs` : 'No hay extendido'}
              </div>

              {currentEntity?.type !== 'usuario' && (
                <Form className="info-form" onSubmit={handleSaveInfo}>
                  <Form.Group className="extendido-row">
                    <Form.Label className="extendido-label">Extendido:</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="extendido"
                      value={formData.extendido}
                      onChange={handleExtendidoChange}
                      placeholder="Seleccionar fecha"
                      className="extendido-input"
                    />
                  </Form.Group>
                  {formData.extendido && (
                    <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
                      <BsSave className="me-2" /> Guardar Información
                    </Button>
                  )}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                </Form>
              )}

              {currentEntity?.type !== 'usuario' && (
                <Button variant={isSelected ? 'danger' : 'success'} className="info-button-add" onClick={toggleRoute}>
                  <FiPlusCircle className="me-2" size={18} />
                  {isSelected ? 'Borrar de la ruta' : 'Agregar a la ruta actual'}
                </Button>
              )}

              {currentEntity?.type !== 'usuario' && mantenimiento.estado !== 'Finalizado' && mantenimiento.estado !== 'Solucionado' && (
                <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
                  <FiCheckCircle className="me-2" size={18} /> Marcar como finalizado
                </Button>
              )}

              {currentEntity?.type === 'usuario' && (
                <Form className="info-form" onSubmit={handleSaveInfo}>
                  <Form.Group className="extendido-row" controlId="estado">
                    <Form.Label className="extendido-label">Estado</Form.Label>
                    <Form.Select
                      name="estado"
                      value={formData.estado || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value }))}
                      className="form-select"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Finalizado">Finalizado</option>
                      <option value="A Presupuestar">A Presupuestar</option>
                      <option value="Presupuestado">Presupuestado</option>
                      <option value="Presupuesto Aprobado">Presupuesto Aprobado</option>
                      <option value="Esperando Respuesta Bancor">Esperando Respuesta Bancor</option>
                      <option value="Aplazado">Aplazado</option>
                      <option value="Desestimado">Desestimado</option>
                      <option value="Solucionado">Solucionado</option>
                    </Form.Select>
                  </Form.Group>
                  {formData.estado && formData.estado !== mantenimiento.estado && (
                    <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
                      <BsSave className="me-2" /> Guardar Estado
                    </Button>
                  )}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                </Form>
              )}
            </Col>

            {!isMobile && <Col className="chat-section">{renderChatContent()}</Col>}

            <Col xs={12} md={4} className="planilla-section">
              <h4 className="planilla-section-title">Planilla</h4>

              <Form onSubmit={handleSavePlanilla}>
                <Form.Group>
                  <input
                    type="file"
                    accept="image/*"
                    id="planillaUpload"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, 'planilla')}
                  />
                  <div className="d-flex justify-content-center mb-2">
                    <Button
                      variant="warning"
                      className="d-flex align-items-center gap-2"
                      onClick={() => document.getElementById('planillaUpload')?.click()}
                    >
                      <BsUpload /> Cargar
                    </Button>
                  </div>

                  {formData.planilla && (
                    <div className="selected-files mt-2">
                      <strong>Archivo seleccionado:</strong>
                      <ul>
                        <li>{formData.planilla.name}</li>
                      </ul>
                    </div>
                  )}

                  {formData.planilla && (
                    <div className="d-flex justify-content-center mt-2">
                      <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
                        <BsSave className="me-2" /> Guardar Planilla
                      </Button>
                    </div>
                  )}
                </Form.Group>
              </Form>

              {planillaPreview && (
                <Row className="gallery-section mt-3">
                  <Col md={3} className="gallery-item">
                    <div className="photo-container">
                      <img
                        src={planillaPreview}
                        alt="Nueva planilla"
                        className="gallery-thumbnail"
                        onClick={() => handleImageClick(planillaPreview)}
                      />
                    </div>
                  </Col>
                </Row>
              )}

              {mantenimiento.planilla && (
                <div className="d-flex justify-content-center gap-2 mt-2">
                  {isSelectingPlanilla ? (
                    <>
                      <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPlanilla}>
                        <BsTrashFill />
                      </Button>
                      <Button
                        className="icon-button"
                        variant="secondary"
                        onClick={() => {
                          setIsSelectingPlanilla(false)
                          setSelectedPlanilla(null)
                        }}
                      >
                        <BsX />
                      </Button>
                    </>
                  ) : (
                    <Button className="icon-button" variant="light" onClick={() => setIsSelectingPlanilla(true)}>
                      <BsPencilFill />
                    </Button>
                  )}
                </div>
              )}

              {mantenimiento.planilla ? (
                <Row className="gallery-section mt-3">
                  <Col md={3} className="gallery-item">
                    <div
                      className={`photo-container ${isSelectingPlanilla ? 'selectable' : ''} ${
                        selectedPlanilla === mantenimiento.planilla ? 'selected' : ''
                      }`}
                      onClick={() => {
                        if (isSelectingPlanilla) handlePlanillaSelect(mantenimiento.planilla)
                        else handleImageClick(mantenimiento.planilla)
                      }}
                    >
                      <img src={mantenimiento.planilla} alt="Planilla existente" className="gallery-thumbnail" />
                    </div>
                  </Col>
                </Row>
              ) : (
                <p className="mt-3 text-center">No hay planilla cargada.</p>
              )}
            </Col>
          </Row>

          <Row className="photos-section mt-5">
            <h4 className="photos-title">Fotos de la obra</h4>

            <Form onSubmit={handleSavePhotos}>
              <Form.Group className="text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="fotoUpload"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'fotos')}
                />
                <div className="d-flex justify-content-center mb-2">
                  <Button
                    variant="warning"
                    className="d-flex align-items-center gap-2"
                    onClick={() => document.getElementById('fotoUpload')?.click()}
                  >
                    <BsUpload /> Cargar
                  </Button>
                </div>

                {formData.fotos.length > 0 && (
                  <div className="text-center mb-2">
                    <strong>Archivos seleccionados:</strong>
                    <ul className="list-unstyled mb-0">
                      {formData.fotos.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.fotos.length > 0 && (
                  <div className="d-flex justify-content-center mt-2">
                    <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
                      <BsSave className="me-2" /> Guardar Fotos
                    </Button>
                  </div>
                )}
              </Form.Group>

              {fotoPreviews.length > 0 && (
                <Row className="gallery-section mt-3">
                  {fotoPreviews.map((preview, index) => (
                    <Col md={3} key={index} className="gallery-item">
                      <div className="photo-container">
                        <img
                          src={preview}
                          alt={`Nueva foto ${index + 1}`}
                          className="gallery-thumbnail"
                          onClick={() => handleImageClick(preview)}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Form>

            {mantenimiento.fotos?.length > 0 && (
              <div className="d-flex justify-content-center mt-2 gap-2">
                {isSelectingPhotos ? (
                  <>
                    <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPhotos}>
                      <BsTrashFill />
                    </Button>
                    <Button
                      className="icon-button"
                      variant="secondary"
                      onClick={() => {
                        setIsSelectingPhotos(false)
                        setSelectedPhotos([])
                      }}
                    >
                      <BsX />
                    </Button>
                  </>
                ) : (
                  <Button className="icon-button" variant="light" onClick={() => setIsSelectingPhotos(true)}>
                    <BsPencilFill />
                  </Button>
                )}
              </div>
            )}

            {mantenimiento.fotos?.length > 0 ? (
              <Row className="gallery-section mt-3">
                {mantenimiento.fotos.map((photo, index) => {
                  const selected = selectedPhotos.includes(photo)
                  return (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${isSelectingPhotos ? 'selectable' : ''} ${selected ? 'selected' : ''}`}
                        onClick={() => (isSelectingPhotos ? handlePhotoSelect(photo) : handleImageClick(photo))}
                      >
                        <img src={photo || '/placeholder.svg'} alt={`Foto ${index + 1}`} className="gallery-thumbnail" />
                      </div>
                    </Col>
                  )
                })}
              </Row>
            ) : (
              <p className="mt-3 text-center">No hay fotos cargadas.</p>
            )}
          </Row>

          <Modal show={showModal} onHide={handleCloseModal} centered>
            <Modal.Body>
              {selectedImage && <img src={selectedImage || '/placeholder.svg'} alt="Full size" className="img-fluid" />}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal>

          {isMobile && (
            <>
              {!isChatOpen && (
                <button type="button" className="floating-chat-btn" onClick={() => setIsChatOpen(true)}>
                  <FiMessageSquare size={28} color="white" />
                </button>
              )}
              <div className={`chat-overlay ${isChatOpen ? 'open' : ''}`}>
                <button type="button" className="close-chat-btn" onClick={() => setIsChatOpen(false)}>
                  <FiArrowLeft size={28} color="black" />
                </button>
                <div className="chat-section">{renderChatContent()}</div>
              </div>
            </>
          )}
        </div>
      )}
      <BackButton to="/mantenimientos-correctivos" />
    </Container>
  )
}

export default Correctivo