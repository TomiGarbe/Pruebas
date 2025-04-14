import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createPreventivo, updatePreventivo } from '../services/preventivoService';
import { getSucursales } from '../services/sucursalService';

const PreventivoForm = ({ preventivo, onClose }) => {
  const [formData, setFormData] = useState({
    id_sucursal: '',
    nombre_sucursal: '',
    frecuencia: 'Mensual',
  });
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await getSucursales();
        setSucursales(response.data);
      } catch (error) {
        console.error('Error fetching sucursales:', error);
      }
    };
    fetchSucursales();

    if (preventivo) {
      setFormData({
        id_sucursal: preventivo.id_sucursal,
        nombre_sucursal: preventivo.nombre_sucursal,
        frecuencia: preventivo.frecuencia,
      });
    }
  }, [preventivo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'id_sucursal') {
      const sucursal = sucursales.find(s => s.id === parseInt(value));
      setFormData({
        ...formData,
        id_sucursal: value,
        nombre_sucursal: sucursal ? sucursal.nombre : ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert(formData.id_sucursal)
    alert(formData.nombre_sucursal)
    try {
      if (preventivo) {
        await updatePreventivo(preventivo.id, formData);
      } else {
        await createPreventivo(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving preventivo:', error);
    }
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{preventivo ? 'Editar Preventivo' : 'Crear Preventivo'}</Modal.Title>
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
            <Form.Label className="required required-asterisk">Frecuencia</Form.Label>
            <Form.Select
              name="frecuencia"
              value={formData.frecuencia}
              onChange={handleChange}
              required
            >
              <option value="Mensual">Mensual</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
              <option value="Semestral">Semestral</option>
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit">
            Guardar
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PreventivoForm;