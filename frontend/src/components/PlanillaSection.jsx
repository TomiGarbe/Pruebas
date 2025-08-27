"use client"
import { Form, Button, Row, Col } from "react-bootstrap"
import { BsUpload, BsTrashFill, BsPencilFill, BsX, BsSave } from "react-icons/bs"

/**
 * Componente para gestionar planillas de mantenimiento.
 * Soporta modo simple (una planilla) y múltiple mediante la prop `multiple`.
 */
const PlanillaSection = ({
  mantenimiento,
  formData,
  planillaPreview,
  isSelectingPlanilla,
  setIsSelectingPlanilla,
  selectedPlanilla,
  handleFileChange,
  handleSavePlanilla,
  handleDeleteSelectedPlanilla,
  handlePlanillaSelect,
  handleImageClick,
  isLoading,
  setSelectedPlanilla,
}) => {
  return (
    <div>
      <h4 className="planilla-section-title">Planilla</h4>

      <Form onSubmit={handleSavePlanilla}>
        <Form.Group>
          <input
            type="file"
            accept="image/*"
            id="planillaUpload"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, "planilla")}
          />
          <div className="d-flex justify-content-center mb-2">
            <Button
              variant="warning"
              className="d-flex align-items-center gap-2"
              onClick={() => document.getElementById("planillaUpload")?.click()}
            >
              <BsUpload /> Cargar
            </Button>
          </div>

          {formData.planilla && (
            <div className="selected-files mt-2">
              <strong>Archivo seleccionado:</strong>
              <ul>
                <li>{formData.planilla.name}</li>
              </ul>
            </div>
          )}

          {formData.planilla && (
            <div className="d-flex justify-content-center mt-2">
              <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
                <BsSave className="me-2" /> Guardar Planilla
              </Button>
            </div>
          )}
        </Form.Group>
      </Form>

      {planillaPreview && (
        <Row className="gallery-section mt-3">
          <Col md={3} className="gallery-item">
            <div className="photo-container">
              <img
                src={planillaPreview || "/placeholder.svg"}
                alt="Nueva planilla"
                className="gallery-thumbnail"
                onClick={() => handleImageClick(planillaPreview)}
              />
            </div>
          </Col>
        </Row>
      )}

      {mantenimiento.planilla && (
        <div className="d-flex justify-content-center gap-2 mt-2">
          {isSelectingPlanilla ? (
            <>
              <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPlanilla}>
                <BsTrashFill />
              </Button>
              <Button
                className="icon-button"
                variant="secondary"
                onClick={() => {
                  setIsSelectingPlanilla(false)
                  setSelectedPlanilla(null)
                }}
              >
                <BsX />
              </Button>
            </>
          ) : (
            <Button className="icon-button" variant="light" onClick={() => setIsSelectingPlanilla(true)}>
              <BsPencilFill />
            </Button>
          )}
        </div>
      )}

      {mantenimiento.planilla ? (
        <Row className="gallery-section mt-3">
          <Col md={3} className="gallery-item">
            <div
              className={`photo-container ${isSelectingPlanilla ? "selectable" : ""} ${
                selectedPlanilla === mantenimiento.planilla ? "selected" : ""
              }`}
              onClick={() => {
                if (isSelectingPlanilla) handlePlanillaSelect(mantenimiento.planilla)
                else handleImageClick(mantenimiento.planilla)
              }}
            >
              <img
                src={mantenimiento.planilla || "/placeholder.svg"}
                alt="Planilla existente"
                className="gallery-thumbnail"
              />
            </div>
          </Col>
        </Row>
      ) : (
        <p className="mt-3 text-center">No hay planilla cargada.</p>
      )}
    </div>
  )
}

export default PlanillaSection
