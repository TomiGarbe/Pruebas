"use client"
import { Form, Button, Alert } from "react-bootstrap"
import { BsSave } from "react-icons/bs"
import { FiPlusCircle, FiCheckCircle } from "react-icons/fi"

const MantenimientoInfo = ({
  mantenimiento,
  formData,
  setFormData,
  currentEntity,
  getSucursalNombre,
  getCuadrillaNombre,
  getZonaNombre,
  formatExtendido,
  handleSaveInfo,
  handleFinish,
  toggleRoute,
  isSelected,
  isLoading,
  error,
  success,
}) => {
  const handleExtendidoChange = (e) => {
    setFormData((prev) => ({ ...prev, extendido: e.target.value }))
  }

  return (
    <div>
      <h4 className="info-section-title">Mantenimiento Correctivo</h4>

      <div className="info-field">
        <strong className="info-label">Sucursal:</strong>{" "}
        {mantenimiento.id_sucursal ? getSucursalNombre(mantenimiento.id_sucursal) : "N/A"}
      </div>
      <div className="info-field">
        <strong className="info-label">Cuadrilla:</strong>{" "}
        {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : "N/A"}
      </div>
      <div className="info-field">
        <strong className="info-label">Zona:</strong>{" "}
        {mantenimiento.id_sucursal ? getZonaNombre(mantenimiento.id_sucursal) : "N/A"}
      </div>
      <div className="info-field">
        <strong className="info-label">Fecha Apertura:</strong> {mantenimiento.fecha_apertura?.split("T")[0] || "N/A"}
      </div>
      <div className="info-field">
        <strong className="info-label">Numero de Caso:</strong> {mantenimiento.numero_caso}
      </div>
      <div className="info-field">
        <strong className="info-label">Incidente:</strong> {mantenimiento.incidente}
      </div>
      <div className="info-field">
        <strong className="info-label">Rubro:</strong> {mantenimiento.rubro}
      </div>
      <div className="info-field">
        <strong className="info-label">Prioridad:</strong> {mantenimiento.prioridad}
      </div>
      <div className="info-field">
        <strong className="info-label">Estado:</strong> {mantenimiento.estado}
      </div>
      <div className="info-field">
        <strong className="info-label">Fecha Cierre:</strong>{" "}
        {mantenimiento.fecha_cierre?.split("T")[0] || "Mantenimiento no finalizado"}
      </div>
      <div className="info-field">
        <strong className="info-label">Extendido:</strong>{" "}
        {mantenimiento.extendido ? `${formatExtendido(mantenimiento.extendido)} hs` : "No hay extendido"}
      </div>

      {currentEntity?.type !== "usuario" && (
        <Form className="info-form" onSubmit={handleSaveInfo}>
          <Form.Group className="extendido-row">
            <Form.Label className="extendido-label">Extendido:</Form.Label>
            <Form.Control
              type="datetime-local"
              name="extendido"
              value={formData.extendido}
              onChange={handleExtendidoChange}
              placeholder="Seleccionar fecha"
              className="extendido-input"
            />
          </Form.Group>
          {formData.extendido && (
            <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
              <BsSave className="me-2" /> Guardar Información
            </Button>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </Form>
      )}

      {currentEntity?.type !== "usuario" && (
        <Button variant={isSelected ? "danger" : "success"} className="info-button-add" onClick={toggleRoute}>
          <FiPlusCircle className="me-2" size={18} />
          {isSelected ? "Borrar de la ruta" : "Agregar a la ruta actual"}
        </Button>
      )}

      {currentEntity?.type !== "usuario" &&
        mantenimiento.estado !== "Finalizado" &&
        mantenimiento.estado !== "Solucionado" && (
          <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
            <FiCheckCircle className="me-2" size={18} /> Marcar como finalizado
          </Button>
        )}

      {currentEntity?.type === "usuario" && (
        <Form className="info-form" onSubmit={handleSaveInfo}>
          <Form.Group className="extendido-row" controlId="estado">
            <Form.Label className="extendido-label">Estado</Form.Label>
            <Form.Select
              name="estado"
              value={formData.estado || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value }))}
              className="form-select"
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
          {formData.estado && formData.estado !== mantenimiento.estado && (
            <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
              <BsSave className="me-2" /> Guardar Estado
            </Button>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
        </Form>
      )}
    </div>
  )
}

export default MantenimientoInfo