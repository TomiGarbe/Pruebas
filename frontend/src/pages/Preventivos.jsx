import React from 'react';
import { useState, useEffect } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import PreventivoForm from '../components/PreventivoForm';
import { getPreventivos, deletePreventivo } from '../services/preventivoService';
import { getSucursales } from '../services/sucursalService';

const Preventivos = () => {
  const [preventivos, setPreventivos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPreventivo, setSelectedPreventivo] = useState(null);

  const fetchPreventivos = async () => {
    try {
      const response = await getPreventivos();
      setPreventivos(response.data);
    } catch (error) {
      console.error('Error fetching preventivos:', error);
    }
  };

  const fetchSucursales = async () => {
    try {
      const response = await getSucursales();
      setSucursales(response.data);
    } catch (error) {
      console.error('Error fetching sucursales:', error);
    }
  };

  useEffect(() => {
    fetchPreventivos();
    fetchSucursales();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deletePreventivo(id);
      fetchPreventivos();
    } catch (error) {
      console.error('Error deleting preventivo:', error);
    }
  };

  const handleEdit = (preventivo) => {
    setSelectedPreventivo(preventivo);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedPreventivo(null);
    fetchPreventivos();
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Gestión de Preventivos</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Crear Preventivo
          </Button>
        </Col>
      </Row>

      {showForm && (
        <PreventivoForm
          preventivo={selectedPreventivo}
          onClose={handleFormClose}
        />
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Sucursal</th>
            <th>Frecuencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {preventivos.map((preventivo) => (
            <tr key={preventivo.id}>
              <td>{preventivo.id}</td>
              <td>{getSucursalNombre(preventivo.id_sucursal)}</td>
              <td>{preventivo.frecuencia}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => handleEdit(preventivo)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(preventivo.id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default Preventivos;