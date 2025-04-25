import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, InputGroup, Dropdown, FormControl } from 'react-bootstrap';
import { createSucursal, updateSucursal } from '../services/sucursalService';
import { getZonas, createZona, deleteZona } from '../services/zonaService';

const SucursalForm = ({ sucursal, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: null,
    zona: null,
    direccion: null,
    superficie: null,
  });
  const [zonas, setZonas] = useState([]);
  const [newZona, setNewZona] = useState('');
  const [showNewZonaInput, setShowNewZonaInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await getZonas();
        console.log('Zonas cargadas:', response.data); // Debug: inspeccionar datos
        setZonas(response.data);
      } catch (error) {
        console.error('Error fetching zonas:', error);
        setError('Error al cargar las zonas.');
      }
    };
    fetchZonas();

    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre || null,
        zona: sucursal.zona || null,
        direccion: sucursal.direccion || null,
        superficie: sucursal.superficie || null,
      });
    }
  }, [sucursal]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleZonaSelect = (zonaNombre) => {
    if (zonaNombre === 'new') {
      setShowNewZonaInput(true);
      setFormData({ ...formData, zona: null });
    } else {
      setShowNewZonaInput(false);
      setFormData({ ...formData, zona: zonaNombre });
    }
    setDropdownOpen(false);
  };

  const handleNewZonaSubmit = async () => {
    if (newZona.trim()) {
      try {
        const response = await createZona({ nombre: newZona });
        setZonas([...zonas, response.data]);
        setFormData({ ...formData, zona: newZona });
        setNewZona('');
        setShowNewZonaInput(false);
        setError(null);
      } catch (error) {
        console.error('Error creating zona:', error);
        setError('Error al crear la zona. Puede que ya exista.');
      }
    }
  };

  const handleDeleteZona = async (id, e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar esta zona?`);
    if (confirmDelete) {
      try {
        await deleteZona(id);
        setZonas(zonas.filter((zona) => zona.id !== id));
        if (formData.zona === zonas.find((z) => z.id === id)?.nombre) {
          setFormData({ ...formData, zona: null });
        }
        setError(null);
      } catch (error) {
        console.error('Error deleting zona:', error);
        const errorMessage = error.response?.data?.detail || 'No se pudo eliminar la zona. Puede estar en uso.';
        setError(errorMessage);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (sucursal) {
        await updateSucursal(sucursal.id, formData);
      } else {
        await createSucursal(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving sucursal:', error);
      setError('Error al guardar la sucursal.');
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{sucursal ? 'Editar Sucursal' : 'Crear Sucursal'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Zona</Form.Label>
            <Dropdown show={dropdownOpen} onToggle={toggleDropdown} ref={dropdownRef}>
              <Dropdown.Toggle
                variant="outline-secondary"
                id="dropdown-zona"
                className="w-100 text-start"
                style={{ backgroundColor: '#e9ecef', borderColor: '#ced4da' }}
              >
                {formData.zona || 'Seleccione una zona'}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100">
                {zonas.map((zona) => (
                  <Dropdown.Item
                    key={zona.id}
                    as="div"
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span
                      onClick={() => handleZonaSelect(zona.nombre)}
                      style={{ flex: 1 }}
                    >
                      {zona.nombre}
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-white"
                      style={{ padding: '0.1rem 0.3rem', fontSize: '0.8rem' }}
                      onClick={(e) => handleDeleteZona(zona.id, e)}
                    >
                      ×
                    </Button>
                  </Dropdown.Item>
                ))}
                <Dropdown.Item
                  onClick={() => handleZonaSelect('new')}
                  className="d-flex align-items-center"
                >
                  <span style={{ marginRight: '0.5rem' }}>➕</span> Agregar nueva zona...
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {showNewZonaInput && (
              <InputGroup className="mt-2">
                <Form.Control
                  type="text"
                  value={newZona}
                  onChange={(e) => setNewZona(e.target.value)}
                  placeholder="Escriba la nueva zona"
                />
                <Button
                  variant="outline-primary"
                  onClick={handleNewZonaSubmit}
                  disabled={!newZona.trim()}
                >
                  Agregar
                </Button>
              </InputGroup>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Dirección</Form.Label>
            <Form.Control
              type="text"
              name="direccion"
              value={formData.direccion || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Superficie</Form.Label>
            <Form.Control
              type="text"
              name="superficie"
              value={formData.superficie || ''}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Guardar
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SucursalForm;