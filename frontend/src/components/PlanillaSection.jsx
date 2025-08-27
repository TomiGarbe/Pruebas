import { Form, Button, Row, Col } from "react-bootstrap"
import { BsUpload, BsTrashFill, BsPencilFill, BsX, BsSave } from "react-icons/bs"

/**
 * Componente para gestionar planillas de mantenimiento.
 * Soporta modo simple (una planilla) y múltiple mediante la prop `multiple`.
 */
const PlanillaSection = ({
  multiple = false,
  mantenimiento,
  formData,
  planillaPreviews = [],
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
  // Determina planillas existentes según el modo
  const existingPlanillas = multiple
    ? mantenimiento.planillas || []
    : mantenimiento.planilla
    ? [mantenimiento.planilla]
    : []

  return (
    <div>
      <h4 className="planilla-section-title">
        {multiple ? "Planillas" : "Planilla"}
      </h4>

      <Form onSubmit={handleSavePlanilla}>
        <Form.Group>
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            id="planillaUpload"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, multiple ? "planillas" : "planilla")}
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

          {multiple ? (
            formData.planillas?.length > 0 && (
              <div className="text-center mb-2">
                <strong>Archivos seleccionados:</strong>
                <ul className="list-unstyled mb-0">
                  {formData.planillas.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
                <div className="d-flex justify-content-center mt-2">
                  <Button
                    type="submit"
                    variant="success"
                    className="section-save-btn"
                    disabled={isLoading}
                  >
                    <BsSave className="me-2" /> Guardar Planillas
                  </Button>
                </div>
              </div>
            )
          ) : (
            formData.planilla && (
              <>
                <div className="selected-files mt-2">
                  <strong>Archivo seleccionado:</strong>
                  <ul>
                    <li>{formData.planilla.name}</li>
                  </ul>
                </div>
                <div className="d-flex justify-content-center mt-2">
                  <Button
                    type="submit"
                    variant="success"
                    className="section-save-btn"
                    disabled={isLoading}
                  >
                    <BsSave className="me-2" /> Guardar Planilla
                  </Button>
                </div>
              </>
            )
          )}
        </Form.Group>
      </Form>

      {/* Previews de nuevas planillas */}
      {planillaPreviews.length > 0 && (
        <Row className="gallery-section mt-3">
          {planillaPreviews.map((preview, index) => (
            <Col md={3} key={index} className="gallery-item">
              <div className="photo-container">
                <img
                  src={preview || "/placeholder.svg"}
                  alt={multiple ? `Nueva planilla ${index + 1}` : "Nueva planilla"}
                  className="gallery-thumbnail"
                  onClick={() => handleImageClick(preview)}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Controles de edición / eliminación */}
      {existingPlanillas.length > 0 && (
        <div className="d-flex justify-content-center gap-2 mt-2">
          {isSelectingPlanilla ? (
            <>
              <Button
                className="icon-button"
                variant="danger"
                onClick={handleDeleteSelectedPlanilla}
              >
                <BsTrashFill />
              </Button>
              <Button
                className="icon-button"
                variant="secondary"
                onClick={() => {
                  setIsSelectingPlanilla(false)
                  setSelectedPlanilla(multiple ? [] : null)
                }}
              >
                <BsX />
              </Button>
            </>
          ) : (
            <Button
              className="icon-button"
              variant="light"
              onClick={() => setIsSelectingPlanilla(true)}
            >
              <BsPencilFill />
            </Button>
          )}
        </div>
      )}

      {/* Galería de planillas existentes */}
      {existingPlanillas.length > 0 ? (
        <Row className="gallery-section mt-3">
          {existingPlanillas.map((planilla, index) => (
            <Col md={3} key={index} className="gallery-item">
              <div
                className={`photo-container ${isSelectingPlanilla ? "selectable" : ""} ${
                  multiple
                    ? selectedPlanilla?.includes(planilla)
                      ? "selected"
                      : ""
                    : selectedPlanilla === planilla
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  if (isSelectingPlanilla) handlePlanillaSelect(planilla)
                  else handleImageClick(planilla)
                }}
              >
                <img
                  src={planilla || "/placeholder.svg"}
                  alt={multiple ? `Planilla ${index + 1}` : "Planilla existente"}
                  className="gallery-thumbnail"
                />
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <p className="mt-3 text-center">
          {multiple ? "No hay planillas cargadas." : "No hay planilla cargada."}
        </p>
      )}
    </div>
  )
}

export default PlanillaSection
