import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createMantenimientoCorrectivo, updateMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';

const MantenimientoCorrectivoForm = ({ mantenimiento, onClose }) => {
  const [formData, setFormData] = useState({
    id_sucursal: '',
    id_cuadrilla: '',
    fecha_apertura: '',
    fecha_cierre: null,
    numero_caso: '',
    incidente: '',
    rubro: '',
    planilla: null,
    estado: 'Pendiente',
    prioridad: 'Media',
    extendido: null,
  });
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sucursalesResponse, cuadrillasResponse] = await Promise.all([
          getSucursales(),
          getCuadrillas(),
        ]);
        setSucursales(sucursalesResponse.data);
        setCuadrillas(cuadrillasResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();

    if (mantenimiento) {
      setFormData({
        id_sucursal: mantenimiento.id_sucursal,
        id_cuadrilla: mantenimiento.id_cuadrilla,
        fecha_apertura: mantenimiento.fecha_apertura?.split('T')[0] || '',
        fecha_cierre: mantenimiento.fecha_cierre?.split('T')[0] || '',
        numero_caso: mantenimiento.numero_caso,
        incidente: mantenimiento.incidente,
        rubro: mantenimiento.rubro,
        planilla: mantenimiento.planilla,
        estado: mantenimiento.estado,
        prioridad: mantenimiento.prioridad,
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
        await updateMantenimientoCorrectivo(mantenimiento.id, formData);
      } else {
        await createMantenimientoCorrectivo(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving mantenimiento correctivo:', error);
    }
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{mantenimiento ? 'Editar Mantenimiento Correctivo' : 'Crear Mantenimiento Correctivo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Sucursal</Form.Label>
            <Form.Select
              name="id_sucursal"
              value={formData.id_sucursal}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una sucursal</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
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
            <Form.Label className="required required-asterisk">Número de Caso</Form.Label>
            <Form.Control
              type="text"
              name="numero_caso"
              value={formData.numero_caso}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Incidente</Form.Label>
            <Form.Control
              type="text"
              name="incidente"
              value={formData.incidente}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Rubro</Form.Label>
            <Form.Select
              name="rubro"
              value={formData.rubro}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un rubro</option>
              <option value="Iluminación/Electricidad">Iluminación/Electricidad</option>
              <option value="Refrigeración">Refrigeración</option>
              <option value="Aberturas/Vidrios">Aberturas/Vidrios</option>
              <option value="Pintura/Impermeabilizaciones">Pintura/Impermeabilizaciones</option>
              <option value="Pisos">Pisos</option>
              <option value="Techos">Techos</option>
              <option value="Sanitarios">Sanitarios</option>
              <option value="Cerrajeria">Cerrajeria</option>
              <option value="Mobiliario">Mobiliario</option>
              <option value="Senalectica">Senalectica</option>
              <option value="Otros">Otros</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Planilla</Form.Label>
            <Form.Control
              type="text"
              name="planilla"
              value={formData.planilla}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Estado</Form.Label>
            <Form.Select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
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
          <Form.Group className="mb-3">
            <Form.Label className="required required-asterisk">Prioridad</Form.Label>
            <Form.Select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              required
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </Form.Select>
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

export default MantenimientoCorrectivoForm;