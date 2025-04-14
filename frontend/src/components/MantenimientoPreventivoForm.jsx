import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createMantenimientoPreventivo, updateMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getPreventivos } from '../services/preventivoService';
import { getCuadrillas } from '../services/cuadrillaService';

const MantenimientoPreventivoForm = ({ mantenimiento, onClose }) => {
  const [formData, setFormData] = useState({
    id_preventivo: null,
    id_cuadrilla: null,
    fecha_apertura: null,
    fecha_cierre: null,
    planilla_1: null,
    planilla_2: null,
    planilla_3: null,
    extendido: null,
  });
  const [preventivos, setPreventivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [preventivosResponse, cuadrillasResponse] = await Promise.all([
          getPreventivos(),
          getCuadrillas(),
        ]);
        setPreventivos(preventivosResponse.data);
        setCuadrillas(cuadrillasResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      }
    };
    fetchData();

    if (mantenimiento) {
      setFormData({
        id_preventivo: mantenimiento.id_preventivo || null,
        id_cuadrilla: mantenimiento.id_cuadrilla || null,
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || null,
        fecha_cierre: mantenimiento.fecha_cierre?.split('T')[0] || null,
        planilla_1: mantenimiento.planilla_1 || null,
        planilla_2: mantenimiento.planilla_2 || null,
        planilla_3: mantenimiento.planilla_3 || null,
        extendido: mantenimiento.extendido?.split('.')[0] || null,
      });
    }
  }, [mantenimiento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si el valor es una cadena vacía y el campo es opcional, lo convertimos a null
    const newValue =
      value === '' && ['fecha_cierre', 'planilla_1', 'planilla_2', 'planilla_3', 'extendido'].includes(name)
        ? null
        : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar que los campos obligatorios no estén vacíos
      if (!formData.id_preventivo || !formData.id_cuadrilla || !formData.fecha_apertura) {
        setError('Por favor, completa todos los campos obligatorios.');
        return;
      }

      if (mantenimiento) {
        await updateMantenimientoPreventivo(mantenimiento.id, formData);
      } else {
        await createMantenimientoPreventivo(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving mantenimiento preventivo:', error);
      setError('Error al guardar el mantenimiento preventivo. Por favor, intenta de nuevo.');
    }
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{mantenimiento ? 'Editar Mantenimiento Preventivo' : 'Crear Mantenimiento Preventivo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Preventivo</Form.Label>
            <Form.Select
              name="id_preventivo"
              value={formData.id_preventivo}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un preventivo</option>
              {preventivos.map((preventivo) => (
                <option key={preventivo.id} value={preventivo.id}>
                  {preventivo.nombre_sucursal} - {preventivo.frecuencia}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Cuadrilla</Form.Label>
            <Form.Select
              name="id_cuadrilla"
              value={formData.id_cuadrilla}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una cuadrilla</option>
              {cuadrillas.map((cuadrilla) => (
                <option key={cuadrilla.id} value={cuadrilla.id}>
                  {cuadrilla.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Fecha Apertura</Form.Label>
            <Form.Control
              type="date"
              name="fecha_apertura"
              value={formData.fecha_apertura || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Fecha Cierre</Form.Label>
            <Form.Control
              type="date"
              name="fecha_cierre"
              value={formData.fecha_cierre || ''}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla 1</Form.Label>
            <Form.Control
              type="text"
              name="planilla_1"
              value={formData.planilla_1 || ''}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla 2</Form.Label>
            <Form.Control
              type="text"
              name="planilla_2"
              value={formData.planilla_2 || ''}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla 3</Form.Label>
            <Form.Control
              type="text"
              name="planilla_3"
              value={formData.planilla_3 || ''}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Extendido</Form.Label>
            <Form.Control
              type="datetime-local"
              name="extendido"
              value={formData.extendido || ''}
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

export default MantenimientoPreventivoForm;