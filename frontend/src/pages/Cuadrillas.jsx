import React from 'react';
import { useState, useEffect } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import CuadrillaForm from '../components/CuadrillaForm';
import { getCuadrillas, deleteCuadrilla } from '../services/cuadrillaService';
import { getZonas } from '../services/zonaService';

const Cuadrillas = () => {
  const [cuadrillas, setCuadrillas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCuadrilla, setSelectedCuadrilla] = useState(null);

  const fetchCuadrillas = async () => {
    try {
      const response = await getCuadrillas();
      setCuadrillas(response.data);
    } catch (error) {
      console.error('Error fetching cuadrillas:', error);
    }
  };

  const fetchZonas = async () => {
    try {
      const response = await getZonas();
      setZonas(response.data);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  useEffect(() => {
    fetchCuadrillas();
    fetchZonas();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteCuadrilla(id);
      fetchCuadrillas();
    } catch (error) {
      console.error('Error deleting cuadrilla:', error);
    }
  };

  const handleEdit = (cuadrilla) => {
    setSelectedCuadrilla(cuadrilla);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCuadrilla(null);
    fetchCuadrillas();
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Gestión de Cuadrillas</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Crear Cuadrilla
          </Button>
        </Col>
      </Row>

      {showForm && (
        <CuadrillaForm
          cuadrilla={selectedCuadrilla}
          onClose={handleFormClose}
        />
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Zona</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cuadrillas.map((cuadrilla) => (
            <tr key={cuadrilla.id}>
              <td>{cuadrilla.id}</td>
              <td>{cuadrilla.nombre}</td>
              <td>{cuadrilla.zona}</td>
              <td>{cuadrilla.email}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => handleEdit(cuadrilla)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(cuadrilla.id)}
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

export default Cuadrillas;