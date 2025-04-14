import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createMantenimientoPreventivo, updateMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getPreventivos } from '../services/preventivoService';
import { getCuadrillas } from '../services/cuadrillaService';

const MantenimientoPreventivoForm = ({ mantenimiento, onClose }) => {
  const [formData, setFormData] = useState({
    id_preventivo: '',
    id_cuadrilla: '',
    fecha_apertura: '',
    fecha_cierre: '',
    planilla_1: '',
    planilla_2: '',
    planilla_3: '',
    extendido: '',
  });
  const [preventivos, setPreventivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);

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
      }
    };
    fetchData();

    if (mantenimiento) {
      setFormData({
        id_preventivo: mantenimiento.id_preventivo,
        id_cuadrilla: mantenimiento.id_cuadrilla,
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || '',
        fecha_cierre: mantenimiento.fecha_cierre?.split('T')[0] || '',
        planilla_1: mantenimiento.planilla_1,
        planilla_2: mantenimiento.planilla_2,
        planilla_3: mantenimiento.planilla_3,
        extendido: mantenimiento.extendido?.split('.')[0] || '',
      });
    }
  }, [mantenimiento]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mantenimiento) {
        await updateMantenimientoPreventivo(mantenimiento.id, formData);
      } else {
        await createMantenimientoPreventivo(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving mantenimiento preventivo:', error);
    }
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{mantenimiento ? 'Editar Mantenimiento Preventivo' : 'Crear Mantenimiento Preventivo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Preventivo</Form.Label>
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
            <Form.Label>Cuadrilla</Form.Label>
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
            <Form.Label>Fecha Apertura</Form.Label>
            <Form.Control
              type="date"
              name="fecha_apertura"
              value={formData.fecha_apertura}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Fecha Cierre</Form.Label>
            <Form.Control
              type="date"
              name="fecha_cierre"
              value={formData.fecha_cierre}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla 1</Form.Label>
            <Form.Control
              type="text"
              name="planilla_1"
              value={formData.planilla_1}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla 2</Form.Label>
            <Form.Control
              type="text"
              name="planilla_2"
              value={formData.planilla_2}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla 3</Form.Label>
            <Form.Control
              type="text"
              name="planilla_3"
              value={formData.planilla_3}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Extendido</Form.Label>
            <Form.Control
              type="datetime-local"
              name="extendido"
              value={formData.extendido}
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