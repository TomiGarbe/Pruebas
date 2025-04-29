import React from 'react';
import { useState, useEffect } from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import UserForm from '../components/UserForm';
import { getUsers, deleteUser } from '../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
    fetchUsers();
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Gestión de Usuarios</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Crear Usuario
          </Button>
        </Col>
      </Row>

      {showForm && (
        <UserForm
          user={selectedUser}
          onClose={handleFormClose}
        />
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.nombre}</td>
              <td>{user.email}</td>
              <td>{user.rol}</td>
              <td>
                <Button
                  variant="warning"
                  className="me-2"
                  onClick={() => handleEdit(user)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(user.id)}
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

export default Users;