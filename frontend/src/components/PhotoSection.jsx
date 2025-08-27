import { Form, Button, Row, Col } from "react-bootstrap"
import { BsUpload, BsTrashFill, BsPencilFill, BsX, BsSave } from "react-icons/bs"

const PhotoSection = ({
  mantenimiento,
  formData,
  fotoPreviews,
  isSelectingPhotos,
  setIsSelectingPhotos,
  selectedPhotos,
  setSelectedPhotos,
  handleFileChange,
  handleSavePhotos,
  handleDeleteSelectedPhotos,
  handlePhotoSelect,
  handleImageClick,
  isLoading,
}) => {
  return (
    <div className="photos-section mt-5">
      <h4 className="photos-title">Fotos de la obra</h4>

      <Form onSubmit={handleSavePhotos}>
        <Form.Group className="text-center">
          <input
            type="file"
            multiple
            accept="image/*"
            id="fotoUpload"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, "fotos")}
          />
          <div className="d-flex justify-content-center mb-2">
            <Button
              variant="warning"
              className="d-flex align-items-center gap-2"
              onClick={() => document.getElementById("fotoUpload")?.click()}
            >
              <BsUpload /> Cargar
            </Button>
          </div>

          {formData.fotos.length > 0 && (
            <div className="text-center mb-2">
              <strong>Archivos seleccionados:</strong>
              <ul className="list-unstyled mb-0">
                {formData.fotos.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
          {formData.fotos.length > 0 && (
            <div className="d-flex justify-content-center mt-2">
              <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading}>
                <BsSave className="me-2" /> Guardar Fotos
              </Button>
            </div>
          )}
        </Form.Group>

        {fotoPreviews.length > 0 && (
          <Row className="gallery-section mt-3">
            {fotoPreviews.map((preview, index) => (
              <Col md={3} key={index} className="gallery-item">
                <div className="photo-container">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Nueva foto ${index + 1}`}
                    className="gallery-thumbnail"
                    onClick={() => handleImageClick(preview)}
                  />
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Form>

      {mantenimiento.fotos?.length > 0 && (
        <div className="d-flex justify-content-center mt-2 gap-2">
          {isSelectingPhotos ? (
            <>
              <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPhotos}>
                <BsTrashFill />
              </Button>
              <Button
                className="icon-button"
                variant="secondary"
                onClick={() => {
                  setIsSelectingPhotos(false)
                  setSelectedPhotos([])
                }}
              >
                <BsX />
              </Button>
            </>
          ) : (
            <Button className="icon-button" variant="light" onClick={() => setIsSelectingPhotos(true)}>
              <BsPencilFill />
            </Button>
          )}
        </div>
      )}

      {mantenimiento.fotos?.length > 0 ? (
        <Row className="gallery-section mt-3">
          {mantenimiento.fotos.map((photo, index) => {
            const selected = selectedPhotos.includes(photo)
            return (
              <Col md={3} key={index} className="gallery-item">
                <div
                  className={`photo-container ${isSelectingPhotos ? "selectable" : ""} ${selected ? "selected" : ""}`}
                  onClick={() => (isSelectingPhotos ? handlePhotoSelect(photo) : handleImageClick(photo))}
                >
                  <img src={photo} alt={`Foto ${index + 1}`} className="gallery-thumbnail" />
                </div>
              </Col>
            )
          })}
        </Row>
      ) : (
        <p className="mt-3 text-center">No hay fotos cargadas.</p>
      )}
    </div>
  )
}

export default PhotoSection
