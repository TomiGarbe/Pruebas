"use client"

import { useEffect, useMemo, useRef, useState, useContext, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { Container, Row, Col, Modal, Button } from "react-bootstrap"
import { AuthContext } from "../context/AuthContext"
import { FiMessageSquare, FiArrowLeft } from "react-icons/fi"
import {
  updateMantenimientoPreventivo,
  deleteMantenimientoPhoto,
  deleteMantenimientoPlanilla,
  getMantenimientoPreventivo,
} from "../services/mantenimientoPreventivoService"
import { getSucursales } from "../services/sucursalService"
import { getCuadrillas } from "../services/cuadrillaService"
import { selectPreventivo, deletePreventivo } from "../services/maps"
import { getChatPreventivo, sendMessagePreventivo } from "../services/chats"
import { subscribeToChat } from "../services/chatWs"
import BackButton from "../components/BackButton"
import LoadingSpinner from "../components/LoadingSpinner"
import MantenimientoInfo from "../components/MantenimientoInfo"
import ChatSection from "../components/ChatSection"
import PlanillaSection from "../components/PlanillaSection"
import PhotoSection from "../components/PhotoSection"
import "bootstrap-icons/font/bootstrap-icons.css"
import "../styles/mantenimientos.css"

/** -------------------------------------
 * Utils
 * --------------------------------------*/
const todayYYYYMMDD = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const formatExtendido = (fechaIso) => {
  if (!fechaIso) return ""
  const date = new Date(fechaIso)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${d} ${hh}:${mm}`
}

const buildFormData = (payload) => {
  const fd = new FormData()
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (key === "planillas" && Array.isArray(value)) {
      value.forEach((file) => fd.append("planillas", file))
      return
    }

    if (key === "fotos" && Array.isArray(value)) {
      value.forEach((file) => fd.append("fotos", file))
      return
    }

    fd.append(key, value)
  })
  return fd
}

/** -------------------------------------
 * Component
 * --------------------------------------*/
const Preventivo = () => {
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
    planillas: [],
    fotos: [],
    fecha_cierre: "",
    extendido: "",
    estado: "",
  })

  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false)
  const [isSelectingPlanillas, setIsSelectingPlanillas] = useState(false)
  const [planillaPreviews, setPlanillaPreviews] = useState([])
  const [fotoPreviews, setFotoPreviews] = useState([])
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [selectedPlanillas, setSelectedPlanillas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [archivoAdjunto, setArchivoAdjunto] = useState(null)
  const [previewArchivoAdjunto, setPreviewArchivoAdjunto] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const chatBoxRef = useRef(null)
  const previewUrlsRef = useRef([]) // para revocar URLs

  // ------------ responsive ---------------
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ------------ data fetch ---------------
  const fetchMantenimiento = useCallback(async () => {
    if (!mantenimientoId) return
    setIsLoading(true)
    try {
      const response = await getMantenimientoPreventivo(mantenimientoId)
      const data = response.data
      setMantenimiento(data)
      setFormData((prev) => ({
        ...prev,
        planillas: [],
        fotos: [],
        fecha_cierre: data.fecha_cierre?.split("T")[0] || "",
        extendido: data.extendido || "",
        estado: data.estado,
      }))
      await cargarMensajes(data.id)
    } catch (err) {
      console.error("Error fetching mantenimiento:", err)
      setError("Error al cargar los datos actualizados.")
    } finally {
      setIsLoading(false)
    }
  }, [mantenimientoId])

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const [sucursalesResponse, cuadrillasResponse] = await Promise.all([getSucursales(), getCuadrillas()])
      setSucursales(sucursalesResponse.data || [])
      setCuadrillas(cuadrillasResponse.data || [])
    } catch (err) {
      console.error("Error fetching data:", err)
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
  const sucursalById = useMemo(() => (id) => sucursales.find((s) => s.id === id), [sucursales])
  const cuadrillaById = useMemo(() => (id) => cuadrillas.find((c) => c.id === id), [cuadrillas])

  const getSucursalNombre = (id) => sucursalById(id)?.nombre || "Desconocida"
  const getZonaNombre = (id) => sucursalById(id)?.zona || "Desconocida"
  const getCuadrillaNombre = (id) => cuadrillaById(id)?.nombre || "Desconocida"

  // ------------ file handlers ---------------
  const revokeAllPreviewUrls = () => {
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    previewUrlsRef.current = []
  }

  useEffect(() => () => revokeAllPreviewUrls(), [])

  const handleFileChange = (e, field) => {
    const { files } = e.target
    if (!files || files.length === 0) return

    if (field === "planillas") {
      const list = Array.from(files)
      const previews = list.map((f) => {
        const url = URL.createObjectURL(f)
        previewUrlsRef.current.push(url)
        return url
      })
      setFormData((prev) => ({ ...prev, planillas: list }))
      setPlanillaPreviews(previews)
      return
    }

    if (field === "fotos") {
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

  const handlePlanillaSelect = (planillaUrl) => {
    setSelectedPlanillas((prev) =>
      prev.includes(planillaUrl) ? prev.filter((u) => u !== planillaUrl) : [...prev, planillaUrl],
    )
  }

  const handlePhotoSelect = (photoUrl) => {
    setSelectedPhotos((prev) => (prev.includes(photoUrl) ? prev.filter((u) => u !== photoUrl) : [...prev, photoUrl]))
  }

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedImage(null)
  }

  const refreshAfterMutation = async (msgOk) => {
    setSuccess(msgOk)
    await fetchMantenimiento()
  }

  const handleDeleteSelectedPlanillas = async () => {
    if (!selectedPlanillas.length || !mantenimiento?.id) return
    setIsLoading(true)
    try {
      for (const url of selectedPlanillas) {
        const fileName = url.split("/").pop()
        await deleteMantenimientoPlanilla(mantenimiento.id, fileName)
      }
      setSelectedPlanillas([])
      setIsSelectingPlanillas(false)
      await refreshAfterMutation("Planillas eliminadas correctamente.")
    } catch (err) {
      console.error("Error al eliminar las planillas:", err)
      setError("Error al eliminar las planillas.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSelectedPhotos = async () => {
    if (!selectedPhotos.length || !mantenimiento?.id) return
    setIsLoading(true)
    try {
      for (const url of selectedPhotos) {
        const fileName = url.split("/").pop()
        await deleteMantenimientoPhoto(mantenimiento.id, fileName)
      }
      setSelectedPhotos([])
      await refreshAfterMutation("Fotos eliminadas correctamente.")
    } catch (err) {
      console.error("Error deleting photos:", err)
      setError("Error al eliminar las fotos.")
    } finally {
      setIsLoading(false)
    }
  }

  const submitUpdate = async (payload, okMsg = "Archivos y datos actualizados correctamente.") => {
    if (!mantenimiento?.id) return
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      const fd = buildFormData(payload)
      await updateMantenimientoPreventivo(mantenimiento.id, fd)
      await refreshAfterMutation(okMsg)
    } catch (err) {
      console.error("Error updating mantenimiento:", err)
      setError(err?.response?.data?.detail || "Error al actualizar los datos.")
    } finally {
      setIsLoading(false)
    }
  }

  const maybeAutoCloseDate = (estado, fecha_cierre) => {
    if (fecha_cierre) return fecha_cierre
    if (estado === "Finalizado" || estado === "Solucionado") return todayYYYYMMDD()
    return ""
  }

  const handleFinish = async () => {
    const hasPlanillas = (mantenimiento?.planillas || []).length > 0
    const hasFoto = (mantenimiento?.fotos || []).length > 0

    if (!hasPlanillas || !hasFoto) {
      setError("Debe cargar al menos una planilla y una foto para marcar como finalizado.")
      return
    }

    const payload = { fecha_cierre: todayYYYYMMDD(), estado: "Solucionado" }
    await submitUpdate(payload, "Mantenimiento marcado como finalizado correctamente.")
  }

  // Ruta
  const toggleRoute = () => {
    if (!mantenimiento?.id) return
    if (isSelected) {
      deletePreventivo(mantenimiento.id)
      setSuccess("Mantenimiento eliminado de la ruta.")
    } else {
      const seleccion = { id_mantenimiento: mantenimiento.id, id_sucursal: mantenimiento.id_sucursal }
      selectPreventivo(seleccion)
      setSuccess("Mantenimiento agregado a la ruta.")
    }
    setIsSelected((s) => !s)
  }

  // ------------ Chat ---------------
  const cargarMensajes = async (id) => {
    try {
      const response = await getChatPreventivo(id)
      setMensajes(response.data || [])
      scrollToBottom()
    } catch (err) {
      console.error("Error al cargar mensajes:", err)
    }
  }

  const handleEnviarMensaje = async () => {
    if (!uid) return
    if (!nuevoMensaje && !archivoAdjunto) return

    const fd = new FormData()
    fd.append("firebase_uid", uid)
    fd.append("nombre_usuario", displayName || "Usuario")
    if (nuevoMensaje) fd.append("texto", nuevoMensaje)
    if (archivoAdjunto) fd.append("archivo", archivoAdjunto)

    try {
      await sendMessagePreventivo(mantenimiento.id, fd)
      setNuevoMensaje("")
      setArchivoAdjunto(null)
      setPreviewArchivoAdjunto(null)
    } catch (err) {
      console.error("Error al enviar mensaje:", err)
      setError("No se pudo enviar el mensaje")
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
    if (formData.extendido !== undefined) payload.extendido = formData.extendido || ""

    if (formData.estado) {
      payload.estado = formData.estado
      if (!mantenimiento.fecha_cierre && (formData.estado === "Finalizado" || formData.estado === "Solucionado")) {
        payload.fecha_cierre = todayYYYYMMDD()
      }
    }

    await submitUpdate(payload, "Información actualizada correctamente.")
  }

  const handleSavePlanillas = async (e) => {
    e.preventDefault()
    if (!formData.planillas || formData.planillas.length === 0) return setError("Seleccione planillas para guardar.")
    await submitUpdate({ planillas: formData.planillas }, "Planillas guardadas correctamente.")
    setFormData((prev) => ({ ...prev, planillas: [] }))
    setPlanillaPreviews([])
  }

  const handleSavePhotos = async (e) => {
    e.preventDefault()
    if ((formData.fotos || []).length === 0) return setError("Seleccione fotos para guardar.")
    await submitUpdate({ fotos: formData.fotos }, "Fotos guardadas correctamente.")
    setFormData((prev) => ({ ...prev, fotos: [] }))
    setFotoPreviews([])
  }

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <Col className="info-section">
              <MantenimientoInfo
                multiple
                title="Mantenimiento Preventivo"
                mantenimiento={mantenimiento}
                formData={formData}
                setFormData={setFormData}
                currentEntity={currentEntity}
                getSucursalNombre={getSucursalNombre}
                getCuadrillaNombre={getCuadrillaNombre}
                getZonaNombre={getZonaNombre}
                formatExtendido={formatExtendido}
                handleSaveInfo={handleSaveInfo}
                handleFinish={handleFinish}
                toggleRoute={toggleRoute}
                isSelected={isSelected}
                isLoading={isLoading}
                error={error}
                success={success}
              />
            </Col>

            {!isMobile && (
              <Col className="chat-section">
                <ChatSection
                  mensajes={mensajes}
                  nuevoMensaje={nuevoMensaje}
                  setNuevoMensaje={setNuevoMensaje}
                  archivoAdjunto={archivoAdjunto}
                  setArchivoAdjunto={setArchivoAdjunto}
                  previewArchivoAdjunto={previewArchivoAdjunto}
                  setPreviewArchivoAdjunto={setPreviewArchivoAdjunto}
                  onEnviarMensaje={handleEnviarMensaje}
                  chatBoxRef={chatBoxRef}
                  currentUid={uid}
                />
              </Col>
            )}

            <Col xs={12} md={4} className="planilla-section">
              <PlanillaSection
                mantenimiento={mantenimiento}
                formData={formData}
                planillaPreviews={planillaPreviews}
                isSelectingPlanillas={isSelectingPlanillas}
                setIsSelectingPlanillas={setIsSelectingPlanillas}
                selectedPlanillas={selectedPlanillas}
                setSelectedPlanillas={setSelectedPlanillas}
                handleFileChange={handleFileChange}
                handleSavePlanillas={handleSavePlanillas}
                handleDeleteSelectedPlanillas={handleDeleteSelectedPlanillas}
                handlePlanillaSelect={handlePlanillaSelect}
                handleImageClick={handleImageClick}
                isLoading={isLoading}
              />
            </Col>
          </Row>

          <Row>
            <PhotoSection
              mantenimiento={mantenimiento}
              formData={formData}
              fotoPreviews={fotoPreviews}
              isSelectingPhotos={isSelectingPhotos}
              setIsSelectingPhotos={setIsSelectingPhotos}
              selectedPhotos={selectedPhotos}
              setSelectedPhotos={setSelectedPhotos}
              handleFileChange={handleFileChange}
              handleSavePhotos={handleSavePhotos}
              handleDeleteSelectedPhotos={handleDeleteSelectedPhotos}
              handlePhotoSelect={handlePhotoSelect}
              handleImageClick={handleImageClick}
              isLoading={isLoading}
            />
          </Row>

          <Modal show={showModal} onHide={handleCloseModal} centered>
            <Modal.Body>
              {selectedImage && <img src={selectedImage || "/placeholder.svg"} alt="Full size" className="img-fluid" />}
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
              <div className={`chat-overlay ${isChatOpen ? "open" : ""}`}>
                <button type="button" className="close-chat-btn" onClick={() => setIsChatOpen(false)}>
                  <FiArrowLeft size={28} color="black" />
                </button>
                <div className="chat-section">
                  <ChatSection
                    mensajes={mensajes}
                    nuevoMensaje={nuevoMensaje}
                    setNuevoMensaje={setNuevoMensaje}
                    archivoAdjunto={archivoAdjunto}
                    setArchivoAdjunto={setArchivoAdjunto}
                    previewArchivoAdjunto={previewArchivoAdjunto}
                    setPreviewArchivoAdjunto={setPreviewArchivoAdjunto}
                    onEnviarMensaje={handleEnviarMensaje}
                    chatBoxRef={chatBoxRef}
                    currentUid={uid}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <BackButton to="/mantenimientos-preventivos" />
    </Container>
  )
}

export default Preventivo