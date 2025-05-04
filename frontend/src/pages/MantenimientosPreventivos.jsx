import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import MantenimientoPreventivoForm from '../components/MantenimientoPreventivoForm';
import { getMantenimientosPreventivos, deleteMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getPreventivos } from '../services/preventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { AuthContext } from '../context/AuthContext';

const MantenimientosPreventivos = () => {
  const { currentEntity } = useContext(AuthContext);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState(null);

  const fetchMantenimientos = async () => {
    try {
      const response = await getMantenimientosPreventivos();
      setMantenimientos(response.data);
    } catch (error) {
      console.error('Error fetching mantenimientos:', error);
    }
  };

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

  useEffect(() => {
    fetchMantenimientos();
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (currentEntity.type === 'usuario') {
      try {
        await deleteMantenimientoPreventivo(id);
        fetchMantenimientos();
      } catch (error) {
        console.error('Error deleting mantenimiento:', error);
      }
    }
  };

  const handleEdit = (mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedMantenimiento(null);
    fetchMantenimientos();
  };

  const getPreventivoFrecuencia = (id_preventivo) => {
    const preventivo = preventivos.find((p) => p.id === id_preventivo);
    return preventivo ? preventivo.frecuencia : 'Desconocido';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Gestión de Mantenimientos Preventivos</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Crear Mantenimiento
          </Button>
        </Col>
      </Row>

      {showForm && (
        <MantenimientoPreventivoForm
          mantenimiento={selectedMantenimiento}
          onClose={handleFormClose}
        />
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Preventivo</th>
            <th>Cuadrilla</th>
            <th>Fecha Apertura</th>
            <th>Fecha Cierre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((mantenimiento) => (
            <tr key={mantenimiento.id}>
              <td>{mantenimiento.id}</td>
              <td>{getPreventivoFrecuencia(mantenimiento.id_preventivo)}</td>
              <td>{getCuadrillaNombre(mantenimiento.id_cuadrilla)}</td>
              <td>{mantenimiento.fecha_apertura?.split('T')[0]}</td>
              <td>{mantenimiento.fecha_cierre?.split('T')[0]}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => handleEdit(mantenimiento)}
                >
                  Editar
                </Button>
                {currentEntity.type === 'usuario' && (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(mantenimiento.id)}
                  >
                    Eliminar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default MantenimientosPreventivos;