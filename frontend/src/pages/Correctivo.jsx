import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { BsUpload, BsTrashFill, BsPencilFill, BsX } from 'react-icons/bs';
import { updateMantenimientoCorrectivo, deleteMantenimientoPhoto, deleteMantenimientoPlanilla, getMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import { selectCorrectivo, deleteCorrectivo } from '../services/maps';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiSend, FiArrowLeft, FiMessageSquare } from "react-icons/fi";
import { getChatCorrectivo, sendMessageCorrectivo } from '../services/chats';
import { subscribeToChat } from '../services/chatWs';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import MantenimientoInfo from '../components/MantenimientoInfo';
import '../styles/mantenimientos.css';

const Correctivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const location = useLocation();
  const mantenimientoId = location.state?.mantenimientoId;
  const [mantenimiento, setMantenimiento] = useState({});
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formData, setFormData] = useState({
    planilla: '',
    fotos: [],
    fecha_cierre: '',
    extendido: '',
    estado: '',
  });
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [isSelectingPlanilla, setIsSelectingPlanilla] = useState(false);
  const [planillaPreview, setPlanillaPreview] = useState('');
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanilla, setSelectedPlanilla] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const [previewArchivoAdjunto, setPreviewArchivoAdjunto] = useState(null);
  const chatBoxRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMantenimiento = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientoCorrectivo(mantenimientoId);
      setMantenimiento(response.data);
      setFormData({
        planilla: '',
        fotos: [],
        fecha_cierre: response.data.fecha_cierre?.split('T')[0] || '',
        extendido: response.data.extendido || '',
        estado: response.data.estado,
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
      const [sucursalesResponse, cuadrillasResponse] = await Promise.all([
        getSucursales(),
        getCuadrillas(),
      ]);
      setSucursales(sucursalesResponse.data);
      setCuadrillas(cuadrillasResponse.data);
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

  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connect = () => {
      if (!mantenimiento.id) return;

      socket = subscribeToChat(mantenimiento.id, (data) => {
        setMensajes((prev) => (Array.isArray(data) ? data : [...prev, data]));
        scrollToBottom();
      });

      if (socket) {
        socket.onclose = () => {
          reconnectTimeout = setTimeout(connect, 5000);
        };

        socket.onerror = () => {
          socket.close();
        };
      }
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [mantenimiento.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, field) => {
    if (field === 'planilla') {
      const file = e.target.files[0];
      if (file) {
        setFormData({ ...formData, [field]: file });
        setPlanillaPreview(URL.createObjectURL(file));
      }
    } else if (field === 'fotos') {
      const files = Array.from(e.target.files);
      setFormData({ ...formData, [field]: files });
      const previews = files.map(file => URL.createObjectURL(file));
      setFotoPreviews(previews);
    }
  };

  const handleExtendidoChange = (e) => {
    setFormData({ ...formData, extendido: e.target.value });
  };

  const handlePlanillaSelect = (planillaUrl) => {
    setSelectedPlanilla(prev =>
      prev === planillaUrl ? null : planillaUrl
    );
  };

  const handleDeleteSelectedPlanilla = async () => {
    setIsLoading(true);
    try {
      if (!selectedPlanilla) return;

      const fileName = selectedPlanilla.split('/').pop();
      await deleteMantenimientoPlanilla(mantenimiento.id, fileName);

      setSelectedPlanilla(null);
      setIsSelectingPlanilla(false);
      setSuccess('Planilla eliminada correctamente.');
      await fetchMantenimiento(); // Refresca los datos
    } catch (error) {
      console.error('Error al eliminar la planilla:', error);
      setError('Error al eliminar la planilla.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (photoUrl) => {
    setSelectedPhotos(prev =>
      prev.includes(photoUrl)
        ? prev.filter(url => url !== photoUrl)
        : [...prev, photoUrl]
    );
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleDeleteSelectedPhotos = async () => {
    setIsLoading(true);
    try {
      for (const photoUrl of selectedPhotos) {
        const fileName = photoUrl.split('/').pop();
        await deleteMantenimientoPhoto(mantenimiento.id, fileName);
      }
      setSelectedPhotos([]);
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

    let fechaCierreFinal = data.fecha_cierre;
    if (!fechaCierreFinal && (data.estado === 'Finalizado' || data.estado === 'Solucionado')) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      console.log(`${year}-${month}-${day}`);
      fechaCierreFinal = `${year}-${month}-${day}`;
    }

    const formDataToSend = new FormData();
    if (data.planilla) {
      formDataToSend.append('planilla', data.planilla);
    }
    data.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (fechaCierreFinal) {
      formDataToSend.append('fecha_cierre', fechaCierreFinal);
    }
    if (data.extendido) {
      formDataToSend.append('extendido', data.extendido);
    }
    if (data.estado) {
      formDataToSend.append('estado', data.estado);
    }

    try {
      await updateMantenimientoCorrectivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planilla: '', fotos: [], fecha_cierre: '', extendido: '', estado: '' });
      setPlanillaPreview('');
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
    const hasPlanilla = mantenimiento.planilla !== '';
    const hasFoto = mantenimiento.fotos?.length > 0;

    if (!hasPlanilla || !hasFoto) {
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
        estado: 'Solucionado',
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
    selectCorrectivo(seleccion);
    setSuccess('Mantenimiento agregado a la ruta.');
  };

  const handleRemoveFromRoute = () => {
    deleteCorrectivo(mantenimiento.id);
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
      const response = await getChatCorrectivo(id);
      setMensajes(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje && !archivoAdjunto) return;

    const message = new FormData();
    message.append('firebase_uid', currentEntity.data.uid);
    message.append('nombre_usuario', currentEntity.data.nombre);
    if (nuevoMensaje) message.append('texto', nuevoMensaje);
    if (archivoAdjunto) message.append('archivo', archivoAdjunto);

    try {
      await sendMessageCorrectivo(mantenimiento.id, message);
      setNuevoMensaje('');
      setArchivoAdjunto(null);
      setPreviewArchivoAdjunto(null);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError('No se pudo enviar el mensaje');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  const renderChatContent = () => (
    <>
      <div className="chat-box" ref={chatBoxRef}>
        {mensajes.map((msg, index) => {
          const esPropio = msg.firebase_uid === currentEntity.data.uid;
          const esImagen = msg.archivo?.match(/\.(jpeg|jpg|png|gif)$/i);
          return (
            <div key={index} className={`chat-message ${esPropio ? 'chat-message-sent' : 'chat-message-received'}`}>
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
          );
        })}
      </div>
      {archivoAdjunto && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Archivo a enviar:</strong><br />
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
            const file = e.target.files[0];
            setArchivoAdjunto(file);
            if (file && file.type.startsWith('image/')) {
              setPreviewArchivoAdjunto(URL.createObjectURL(file));
            } else if (file && file.type.startsWith('video/')) {
              setPreviewArchivoAdjunto(URL.createObjectURL(file));
            } else {
              setPreviewArchivoAdjunto(file ? file.name : null);
            }
          }}
          style={{ display: 'none' }}
          id="archivoAdjunto"
        />
        <label htmlFor="archivoAdjunto" className="chat-attach-btn">
          📎
        </label>
        <Button variant="light" className="chat-send-btn" onClick={handleEnviarMensaje}>
          <FiSend size={20} color="black" />
        </Button>
      </div>
    </>
  );

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <MantenimientoInfo
              title="Mantenimiento Correctivo"
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
              showFinishButton={currentEntity.type !== 'usuario' && mantenimiento.estado !== 'Finalizado' && mantenimiento.estado !== 'Solucionado'}
              handleFinish={handleFinish}
              handleChange={handleChange}
            />
            {!isMobile && (
              <Col className="chat-section">
                {renderChatContent()}
              </Col>
            )}
            <Col xs={12} md={4} className="planilla-section">
              <h4 className="planilla-section-title">Planilla</h4>
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
                onClick={() => document.getElementById('planillaUpload').click()}
              >
                <BsUpload />
                Cargar
              </Button>
              </div>
              {/* Mostrar archivo recién seleccionado */}
              {formData.planilla && (
                <div className="selected-files mt-2">
                  <strong>Archivo seleccionado:</strong>
                  <ul>
                    <li>{formData.planilla.name}</li>
                  </ul>
                </div>
              )}
            </Form.Group>

            {/* Mostrar preview si se subió una nueva planilla */}
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

            {/* Mostrar botones si hay planilla persistida */}
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
                        setIsSelectingPlanilla(false);
                        setSelectedPlanilla(null);
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
                      if (isSelectingPlanilla) {
                        handlePlanillaSelect(mantenimiento.planilla);
                      } else {
                        handleImageClick(mantenimiento.planilla);
                      }
                    }}
                  >
                    <img
                      src={mantenimiento.planilla}
                      alt="Planilla existente"
                      className="gallery-thumbnail"
                    />
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
                  onClick={() => document.getElementById('fotoUpload').click()}
                >
                  <BsUpload />
                  Cargar
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
                        setIsSelectingPhotos(false);
                        setSelectedPhotos([]);
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
                  const isSelected = selectedPhotos.includes(photo);
                  return (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${isSelectingPhotos ? 'selectable' : ''} ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => {
                          if (isSelectingPhotos) {
                            handlePhotoSelect(photo);
                          } else {
                            handleImageClick(photo);
                          }
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="gallery-thumbnail"
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <p className="mt-3 text-center">No hay fotos cargadas.</p>
            )}
          </Row>
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
                  {renderChatContent()}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <BackButton to="/mantenimientos-correctivos" />
    </Container>
  );
};

export default Correctivo;