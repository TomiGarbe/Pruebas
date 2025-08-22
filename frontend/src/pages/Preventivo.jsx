import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { BsUpload, BsTrashFill, BsPencilFill, BsX } from 'react-icons/bs';
import { updateMantenimientoPreventivo, deleteMantenimientoPhoto, deleteMantenimientoPlanilla, getMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getSucursales } from '../services/sucursalService';
import { selectPreventivo, deletePreventivo } from '../services/maps';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiSend, FiPlusCircle, FiCheckCircle, FiArrowLeft, FiMessageSquare } from "react-icons/fi";
import { BsSave } from 'react-icons/bs';
import { getChatPreventivo, sendMessagePreventivo } from '../services/chats';
import { subscribeToChat } from '../services/chatWs';
import BackButton from '../components/BackButton';
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
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [isSelectingPlanillas, setIsSelectingPlanillas] = useState(false);
  const [planillaPreviews, setPlanillaPreviews] = useState([]);
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [selectedPlanillas, setSelectedPlanillas] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
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

  const handleFileChange = (e, field) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, [field]: files });

    const previews = files.map(file => URL.createObjectURL(file));
    if (field === 'planillas') {
      setPlanillaPreviews(previews);
    } else if (field === 'fotos') {
      setFotoPreviews(previews);
    }
  };

  const handleExtendidoChange = (e) => {
    setFormData({ ...formData, extendido: e.target.value });
  };

  const handlePlanillaSelect = (planillaUrl) => {
    setSelectedPlanillas(prev =>
      prev.includes(planillaUrl)
        ? prev.filter(url => url !== planillaUrl)
        : [...prev, planillaUrl]
    );
  };

    const handlePhotoSelect = (photo) => {
      setSelectedPhotos((prev) =>
        prev.includes(photo)
          ? prev.filter((p) => p !== photo)
          : [...prev, photo]
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

  const handleDeleteSelectedPlanillas = async () => {
    setIsLoading(true);
    try {
      for (const planillaUrl of selectedPlanillas) {
        const fileName = planillaUrl.split('/').pop();
        await deleteMantenimientoPlanilla(mantenimiento.id, fileName);
      }
      setSelectedPlanillas([]);
      setSuccess('Planillas eliminadas correctamente.');
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error deleting planillas:', error);
      setError('Error al eliminar las planillas.');
    } finally {
      setIsLoading(false);
    }
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
      setPlanillaPreviews([]);
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

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  const ChatContent = () => (
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
        <div className="custom-div">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <Col className="info-section">
              <h4 className="info-section-title">Mantenimiento Preventivo</h4>
              <div className="info-field">
                <strong className="info-label">Sucursal - Frecuencia:</strong>{' '}
                {mantenimiento.id_sucursal ? getSucursalNombre(mantenimiento.id_sucursal) : 'N/A'} - {mantenimiento.frecuencia || 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Cuadrilla:</strong>{' '}
                {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Zona:</strong>{' '}
                {mantenimiento.id_sucursal ? getZonaNombre(mantenimiento.id_sucursal) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Apertura:</strong>{' '}
                {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Cierre:</strong>{' '}
                {mantenimiento.fecha_cierre?.split('T')[0] || 'Mantenimiento no finalizado'}
              </div>
              <div className="info-field">
                <strong className="info-label">Extendido:</strong>{' '}
                {mantenimiento.extendido
                  ? `${formatExtendido(mantenimiento.extendido)} hs`
                  : 'No hay extendido'}
              </div>
              {currentEntity.type !== 'usuario' && (
                <Form className="info-form" onSubmit={handleSubmit}>
                  <Form.Group className="extendido-row">
                    <Form.Label className="extendido-label">Extendido:</Form.Label>
                    <Form.Control 
                      type="datetime-local" 
                      name="extendido"
                      value={formData.extendido}
                      onChange={handleExtendidoChange}
                      placeholder="Seleccionar fecha" 
                      className="extendido-input" />
                  </Form.Group>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                </Form>
              )}
              {currentEntity.type !== 'usuario' && (
                <Button variant={isSelected ? 'danger' : 'success'} className="info-button-add" onClick={toggleRoute}>
                  <FiPlusCircle className="me-2" size={18} />{isSelected ? 'Borrar de la ruta' : 'Agregar a la ruta actual'}
                </Button>
              )}
              {mantenimiento.fecha_cierre === null && (
                <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
                  <FiCheckCircle className="me-2" size={18} />Marcar como finalizado
                </Button>
              )}
              <button
                className="floating-save-btn d-flex align-items-center justify-content-center"
                onClick={handleSubmit}
                title="Guardar cambios"
              >
                <BsSave size={28} />
              </button>
            </Col>
            {!isMobile && (
              <Col className="chat-section">
                <ChatContent />
              </Col>
            )}
            <Col xs={12} md={4} className="planilla-section">
              <h4 className="planilla-section-title">Planillas</h4>
              <Form.Group>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="planillaUpload"
                  style={{ display: 'none' }} // Ocultamos el input de archivo
                  onChange={(e) => handleFileChange(e, 'planillas')}
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
                {formData.planillas.length > 0 && (
                  <div className="text-center mb-2">
                    <strong>Archivos seleccionados:</strong>
                    <ul className="list-unstyled mb-0">
                      {formData.planillas.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Form.Group>
              {planillaPreviews.length > 0 && (
                <Row className="gallery-section mt-3">
                  {planillaPreviews.map((preview, index) => (
                    <Col md={3} key={index} className="gallery-item">
                      <div className="photo-container">
                        <img
                          src={preview}
                          alt={`Nueva planilla ${index + 1}`}
                          className="gallery-thumbnail"
                          onClick={() => handleImageClick(preview)}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
              {mantenimiento.planillas?.length > 0 && (
              <div className="d-flex justify-content-center gap-2 mt-2">
                {isSelectingPlanillas ? (
                  <>
                    <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPlanillas}>
                      <BsTrashFill />
                    </Button>
                    <Button className="icon-button" variant="secondary" onClick={() => {
                      setIsSelectingPlanillas(false);
                      setSelectedPlanillas([]);
                    }}>
                      <BsX />
                    </Button>
                  </>
                ) : (
                  <Button className="icon-button" variant="light" onClick={() => setIsSelectingPlanillas(true)}>
                    <BsPencilFill />
                  </Button>
                )}
              </div>
            )}

            {mantenimiento.planillas?.length > 0 ? (
              <>
                <Row className="gallery-section mt-3">
                  {mantenimiento.planillas.map((planilla, index) => (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${isSelectingPlanillas ? 'selectable' : ''} ${
                          selectedPlanillas.includes(planilla) ? 'selected' : ''
                        }`}
                        onClick={() => {
                          if (isSelectingPlanillas) {
                            handlePlanillaSelect(planilla);
                          } else {
                            handleImageClick(planilla);
                          }
                        }}
                      >
                        <img
                          src={planilla}
                          alt={`Planilla ${index + 1}`}
                          className="gallery-thumbnail"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            ) : (
              <p className="mt-3">No hay planillas cargadas.</p>
            )}
            </Col>
          </Row>

          <Row className="photos-section mt-5"> 
            <h4 className="photos-title">Fotos de la obra</h4>
            <Form.Group className="text-center"> {/* Añadido text-center para centrar */}
              <input
                type="file"
                multiple
                accept="image/*"
                id="fotoUpload"
                style={{ display: 'none' }} // Ocultamos el input de archivo
                onChange={(e) => handleFileChange(e, 'fotos')}
              />
              <div className="d-flex justify-content-center mb-2">
                <Button
                  variant="warning"
                  className="d-flex align-items-center gap-2"
                  onClick={() => document.getElementById('fotoUpload').click()} // Simulamos clic en el input oculto
                >
                  <BsUpload />
                  Cargar
                </Button>
              </div>
              {/* Mostrar nombres de archivos seleccionados */}
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
                  <Button className="icon-button" variant="secondary" onClick={() => {
                      setIsSelectingPhotos(false);
                      setSelectedPhotos([]);
                    }}>
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
              <>
                <Row className="gallery-section mt-3">
                  {mantenimiento.fotos.map((photo, index) => {
                    const isSelected = selectedPhotos.includes(photo);
                    return (
                      <Col md={3} key={index} className="gallery-item">
                        <div
                          className={`photo-container ${isSelectingPhotos ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
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

              </>
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
                  <ChatContent />
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