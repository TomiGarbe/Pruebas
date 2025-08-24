import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { updateMantenimientoPreventivo, deleteMantenimientoPhoto, deleteMantenimientoPlanilla, getMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getSucursales } from '../services/sucursalService';
import { selectPreventivo, deletePreventivo } from '../services/maps';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiArrowLeft, FiMessageSquare } from "react-icons/fi";
import { getChatPreventivo, sendMessagePreventivo } from '../services/chats';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import MantenimientoInfo from '../components/MantenimientoInfo';
import ChatSection from '../components/ChatSection';
import useChat from '../hooks/useChat';
import PlanillaSection from '../components/PlanillaSection';
import PhotoSection from '../components/PhotoSection';
import useIsMobile from '../hooks/useIsMobile';
import '../styles/mantenimientos.css';

const Preventivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const location = useLocation();
  const mantenimientoId = location.state?.mantenimientoId;
  const [mantenimiento, setMantenimiento] = useState({});
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formData, setFormData] = useState({
    planillas: [],
    fotos: [],
    fecha_cierre: null,
    extendido: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const [previewArchivoAdjunto, setPreviewArchivoAdjunto] = useState(null);
  const isMobile = useIsMobile();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { chatBoxRef, scrollToBottom } = useChat(mantenimiento.id, setMensajes);

  const fetchMantenimiento = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientoPreventivo(mantenimientoId);
      setMantenimiento(response.data);
      setFormData({
        planillas: [],
        fotos: [],
        fecha_cierre: response.data.fecha_cierre?.split('T')[0] || null,
        extendido: response.data.extendido || null,
      });
      await cargarMensajes(response.data.id);
    } catch (error) {
      console.error('Error fetching mantenimiento:', error);
      setError('Error al cargar los datos actualizados.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cuadrillasResponse, sucursalesResponse] = await Promise.all([
        getCuadrillas(),
        getSucursales(),
      ]);
      setCuadrillas(cuadrillasResponse.data);
      setSucursales(sucursalesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMantenimiento();
    fetchData();
  }, []);

  const handlePhotoUpload = (files) => {
    setFormData({ ...formData, fotos: files });
  };

  const handleExtendidoChange = (e) => {
    setFormData({ ...formData, extendido: e.target.value });
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleDeleteSelectedPhotos = async (photos) => {
    setIsLoading(true);
    try {
      for (const photoUrl of photos) {
        const fileName = photoUrl.split('/').pop();
        await deleteMantenimientoPhoto(mantenimiento.id, fileName);
      }
      setSuccess('Fotos eliminadas correctamente.');
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error deleting photos:', error);
      setError('Error al eliminar las fotos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e, overrideData = null) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const data = overrideData || formData;

    const formDataToSend = new FormData();
    data.planillas.forEach(file => formDataToSend.append('planillas', file));
    data.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (data.fecha_cierre) {
      formDataToSend.append('fecha_cierre', data.fecha_cierre);
    }
    if (data.extendido) {
      formDataToSend.append('extendido', data.extendido);
    }

    try {
      await updateMantenimientoPreventivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planillas: [], fotos: [], fecha_cierre: '', extendido: '' });
      setFotoPreviews([]);
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      setError(error.response?.data?.detail || 'Error al actualizar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    const hasPlanilla = mantenimiento.planillas?.length > 0;
    const hasFoto = mantenimiento.fotos?.length > 0;

    if (!hasPlanilla || !hasFoto) {
      alert('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
      setError('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
      return;
    }

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const updatedFormData = {
        ...formData,
        fecha_cierre: formattedDate,
      };
      await handleSubmit({ preventDefault: () => {} }, updatedFormData);
      // Falta mandar notificacion al encargado de mantenimiento
      setSuccess('Mantenimiento marcado como finalizado correctamente.');
    } catch (error) {
      console.error('Error marking as finished:', error);
      setError('Error al marcar como finalizado.');
    }
  };

  const toggleRoute = () => {
    if (isSelected) {
      setIsSelected(false);
      handleRemoveFromRoute();
    } else {
      setIsSelected(true);
      handleAddToRoute();
    }
  };

  const handleAddToRoute = () => {
    const seleccion = {"id_mantenimiento": mantenimiento.id, "id_sucursal": mantenimiento.id_sucursal};
    selectPreventivo(seleccion);
    setSuccess('Mantenimiento agregado a la ruta.');
  };

  const handleRemoveFromRoute = () => {
    deletePreventivo(mantenimiento.id);
    setSuccess('Mantenimiento eliminado de la ruta.');
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  const getZonaNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.zona : 'Desconocida';
  };

  function formatExtendido(fechaIso) {
    const date = new Date(fechaIso);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  const cargarMensajes = async (id) => {
    try {
      const response = await getChatPreventivo(id);
      setMensajes(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };
  
  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje && !archivoAdjunto) return;

    const formData = new FormData();
    formData.append('firebase_uid', currentEntity.data.uid);
    formData.append('nombre_usuario', currentEntity.data.nombre);
    if (nuevoMensaje) formData.append('texto', nuevoMensaje);
    if (archivoAdjunto) formData.append('archivo', archivoAdjunto);

    try {
      await sendMessagePreventivo(mantenimiento.id, formData);
      setNuevoMensaje('');
      setArchivoAdjunto(null);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError('No se pudo enviar el mensaje');
    }
  };

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <MantenimientoInfo
              title="Mantenimiento Preventivo"
              mantenimiento={mantenimiento}
              currentEntity={currentEntity}
              formData={formData}
              getSucursalNombre={getSucursalNombre}
              getCuadrillaNombre={getCuadrillaNombre}
              getZonaNombre={getZonaNombre}
              formatExtendido={formatExtendido}
              handleExtendidoChange={handleExtendidoChange}
              handleSubmit={handleSubmit}
              error={error}
              success={success}
              toggleRoute={toggleRoute}
              isSelected={isSelected}
              showFinishButton={mantenimiento.fecha_cierre === null}
              handleFinish={handleFinish}
            />
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
                  currentUid={currentEntity.data.uid}
                />
              </Col>
            )}
            <PlanillaSection
              multiple
              mantenimiento={mantenimiento}
              formData={formData}
              setFormData={setFormData}
              deletePlanilla={deleteMantenimientoPlanilla}
              handleImageClick={handleImageClick}
              fetchMantenimiento={fetchMantenimiento}
              setIsLoading={setIsLoading}
              setSuccess={setSuccess}
              setError={setError}
            />
          </Row>
          <PhotoSection
            fotos={mantenimiento.fotos || []}
            onUpload={handlePhotoUpload}
            onDelete={handleDeleteSelectedPhotos}
            titulo="Fotos de la obra"
          />
          <Modal show={showModal} onHide={handleCloseModal} centered>
            <Modal.Body>
              {selectedImage && (
                <img src={selectedImage} alt="Full size" className="img-fluid" />
              )}
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
                <button
                  type="button"
                  className="floating-chat-btn"
                  onClick={() => setIsChatOpen(true)}
                >
                  <FiMessageSquare size={28} color="white" />
                </button>
              )}
              <div className={`chat-overlay ${isChatOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="close-chat-btn"
                  onClick={() => setIsChatOpen(false)}
                >
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
                    currentUid={currentEntity.data.uid}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <BackButton to="/mantenimientos-preventivos" />
    </Container>
  );
};

export default Preventivo;