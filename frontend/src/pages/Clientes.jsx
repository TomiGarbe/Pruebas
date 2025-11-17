import { Fragment, useEffect, useState } from 'react';
import { Button, Container, Row, Col, Table, Collapse } from 'react-bootstrap';
import { FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiEdit, FiTrash2, FiHome } from 'react-icons/fi';
import ClienteForm from '../components/forms/ClienteForm';
import SucursalForm from '../components/forms/SucursalForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { getClientes, deleteCliente } from '../services/clienteService';
import { getSucursalesByCliente, deleteSucursal } from '../services/sucursalService';
import ColumnSelector from '../components/ColumnSelector';
import { getColumnPreferences, saveColumnPreferences } from '../services/preferencesService';
import '../styles/botones_forms.css';

const CLIENTS_PREF_KEY = 'clientes_table';
const CLIENTS_SUCURSALES_PREF_KEY = 'clientes_sucursales_table';

const clientColumns = [
  { key: 'nombre', label: 'Cliente' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'email', label: 'Email' },
  { key: 'acciones', label: 'Acciones' },
];

const sucursalColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'zona', label: 'Zona' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'frecuencia', label: 'Frecuencia preventivo' },
  { key: 'acciones', label: 'Acciones' },
];

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [sucursalesMap, setSucursalesMap] = useState({});
  const [activeSucursalForm, setActiveSucursalForm] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [selectedClientColumns, setSelectedClientColumns] = useState(clientColumns.map((c) => c.key));
  const [selectedSucursalColumns, setSelectedSucursalColumns] = useState(sucursalColumns.map((c) => c.key));

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [clientPrefs, sucursalPrefs] = await Promise.all([
          getColumnPreferences(CLIENTS_PREF_KEY),
          getColumnPreferences(CLIENTS_SUCURSALES_PREF_KEY),
        ]);
        const clientCols = clientPrefs.data?.columns?.length ? clientPrefs.data.columns : clientColumns.map((c) => c.key);
        const sucCols = sucursalPrefs.data?.columns?.length ? sucursalPrefs.data.columns : sucursalColumns.map((c) => c.key);
        setSelectedClientColumns(clientCols);
        setSelectedSucursalColumns(sucCols);
      } catch {
        setSelectedClientColumns(clientColumns.map((c) => c.key));
        setSelectedSucursalColumns(sucursalColumns.map((c) => c.key));
      }
    };
    loadPreferences();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await getClientes();
      setClientes(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  };

  const loadSucursales = async (clienteId) => {
    setLoadingSucursales(true);
    try {
      const response = await getSucursalesByCliente(clienteId);
      setSucursalesMap((prev) => ({ ...prev, [clienteId]: response.data || [] }));
    } catch (err) {
      console.error('Error fetching sucursales:', err);
      setError('No se pudieron cargar las sucursales del cliente.');
    } finally {
      setLoadingSucursales(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleDeleteCliente = async (clienteId) => {
    if (!window.confirm('¿Eliminar este cliente y sus sucursales?')) return;
    try {
      await deleteCliente(clienteId);
      setExpandedCliente(null);
      await loadClientes();
    } catch (err) {
      console.error('Error deleting cliente:', err);
      setError(err.response?.data?.detail || 'No se pudo eliminar el cliente.');
    }
  };

  const handleDeleteSucursal = async (clienteId, sucursalId) => {
    if (!window.confirm('¿Eliminar esta sucursal?')) return;
    try {
      await deleteSucursal(sucursalId);
      await loadSucursales(clienteId);
    } catch (err) {
      console.error('Error deleting sucursal:', err);
      setError(err.response?.data?.detail || 'No se pudo eliminar la sucursal.');
    }
  };

  const toggleClienteRow = (clienteId) => {
    if (expandedCliente === clienteId) {
      setExpandedCliente(null);
      return;
    }
    setExpandedCliente(clienteId);
    if (!sucursalesMap[clienteId]) {
      loadSucursales(clienteId);
    }
  };

  const handleOpenClienteForm = (cliente) => {
    setSelectedCliente(cliente || null);
    setShowClienteForm(true);
  };

  const handleClienteSaved = () => {
    setShowClienteForm(false);
    setSelectedCliente(null);
    loadClientes();
  };

  const handleOpenSucursalForm = (clienteId, sucursal = null) => {
    setActiveSucursalForm({ clienteId, sucursal });
  };

  const handleSucursalSaved = async (clienteId) => {
    setActiveSucursalForm(null);
    await loadSucursales(clienteId);
  };

  const handleSaveClientColumns = async (columns) => {
    setSelectedClientColumns(columns);
    try {
      await saveColumnPreferences(CLIENTS_PREF_KEY, columns);
    } catch (err) {
      console.error('Error guardando columnas de clientes', err);
    }
  };

  const handleSaveSucursalColumns = async (columns) => {
    setSelectedSucursalColumns(columns);
    try {
      await saveColumnPreferences(CLIENTS_SUCURSALES_PREF_KEY, columns);
    } catch (err) {
      console.error('Error guardando columnas de sucursales', err);
    }
  };

  const renderSucursales = (cliente) => {
    const sucursales = sucursalesMap[cliente.id] || [];
    return (
      <div className="cliente-sucursales-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
          <h5 className="mb-0">
            <FiHome className="me-2" />
            Sucursales de {cliente.nombre}
          </h5>
          <div className="d-flex align-items-center gap-2">
            <Button
              size="sm"
              className="custom-button"
              onClick={() => handleOpenSucursalForm(cliente.id)}
            >
              <FaPlus className="me-1" />
              Agregar sucursal
            </Button>
          </div>
        </div>
        {activeSucursalForm?.clienteId === cliente.id && (
          <SucursalForm
            inline
            clienteId={cliente.id}
            sucursal={activeSucursalForm.sucursal}
            onClose={() => setActiveSucursalForm(null)}
            onSaved={() => handleSucursalSaved(cliente.id)}
            title={activeSucursalForm.sucursal ? 'Editar sucursal' : 'Crear sucursal'}
          />
        )}
        <ColumnSelector
          availableColumns={sucursalColumns}
          selectedColumns={selectedSucursalColumns}
          onSave={handleSaveSucursalColumns}
        />
        {loadingSucursales && !sucursales.length ? (
          <div className="py-3 text-center">Cargando sucursales...</div>
        ) : sucursales.length ? (
          <div className="table-responsive">
            <Table bordered size="sm">
              <thead>
                <tr>
                  {sucursalColumns.map(
                    (column) =>
                      selectedSucursalColumns.includes(column.key) && (
                        <th
                          key={column.key}
                          className={column.key === 'acciones' ? 'acciones-col' : undefined}
                        >
                          {column.label}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {sucursales.map((sucursal) => (
                  <tr key={sucursal.id}>
                    {selectedSucursalColumns.includes('nombre') && <td>{sucursal.nombre}</td>}
                    {selectedSucursalColumns.includes('zona') && <td>{sucursal.zona || '—'}</td>}
                    {selectedSucursalColumns.includes('direccion') && (
                      <td>{typeof sucursal.direccion === 'string' ? sucursal.direccion : sucursal.direccion?.address}</td>
                    )}
                    {selectedSucursalColumns.includes('frecuencia') && (
                      <td>{sucursal.frecuencia_preventivo || 'Sin preventivo'}</td>
                    )}
                    {selectedSucursalColumns.includes('acciones') && (
                      <td className="acciones-col">
                        <button
                          className="action-btn edit me-2"
                          onClick={() => handleOpenSucursalForm(cliente.id, sucursal)}
                          aria-label="Editar sucursal"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteSucursal(cliente.id, sucursal.id)}
                          aria-label="Eliminar sucursal"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="text-muted py-3">Este cliente todavía no tiene sucursales.</div>
        )}
      </div>
    );
  };

  return (
    <Container className="custom-container">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="contenido-wrapper">
          <Row className="align-items-center mb-3">
            <Col>
              <h2>Gestión de Clientes</h2>
            </Col>
            <Col className="text-end">
              <div className="d-inline-flex align-items-center gap-2">
                <Button className="custom-button" onClick={() => handleOpenClienteForm(null)}>
                  <FaPlus className="me-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </Col>
          </Row>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <ColumnSelector
            availableColumns={clientColumns}
            selectedColumns={selectedClientColumns}
            onSave={handleSaveClientColumns}
          />
          <div className="table-responsive">
            <Table bordered hover>
              <thead>
                <tr>
                  {clientColumns.map(
                    (column) =>
                      selectedClientColumns.includes(column.key) && (
                        <th
                          key={column.key}
                          className={column.key === 'acciones' ? 'acciones-col' : undefined}
                        >
                          {column.label}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <Fragment key={cliente.id}>
                    <tr>
                      {selectedClientColumns.includes('nombre') && <td>{cliente.nombre}</td>}
                      {selectedClientColumns.includes('contacto') && <td>{cliente.contacto}</td>}
                      {selectedClientColumns.includes('email') && <td>{cliente.email}</td>}
                      {selectedClientColumns.includes('acciones') && (
                        <td className="acciones-col-clientes">
                          <button
                            className={`view-sucursales-btn ${expandedCliente === cliente.id ? 'active' : ''}`}
                            onClick={() => toggleClienteRow(cliente.id)}
                          >
                            {expandedCliente === cliente.id ? (
                              <>
                                <FaChevronUp className="me-1" />
                                Ocultar sucursales
                              </>
                            ) : (
                              <>
                                <FaChevronDown className="me-1" />
                                Ver sucursales
                              </>
                            )}
                          </button>
                          <button
                            className="action-btn edit me-2"
                            onClick={() => handleOpenClienteForm(cliente)}
                            aria-label="Editar cliente"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteCliente(cliente.id)}
                            aria-label="Eliminar cliente"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td colSpan={selectedClientColumns.length} className="p-0">
                        <Collapse in={expandedCliente === cliente.id}>
                          <div className="p-3">{renderSucursales(cliente)}</div>
                        </Collapse>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
      {showClienteForm && (
        <ClienteForm
          show={showClienteForm}
          cliente={selectedCliente}
          onClose={() => setShowClienteForm(false)}
          onSaved={handleClienteSaved}
        />
      )}
    </Container>
  );
};

export default Clientes;
