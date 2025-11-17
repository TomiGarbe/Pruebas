import React from 'react';

const MapSidebar = ({
  cuadrillas,
  encargados,
  sucursales,
  clientes = [],
  clienteFilter = '',
  onClienteChange = () => {},
  onSelectCuadrilla,
  onSelectEncargado,
  onSelectSucursal
}) => (
  <>
    <div className="map-sidebar-left">
      <h4>Cuadrillas</h4>
      {cuadrillas.length === 0 && <p>No hay cuadrillas activas.</p>}
      {cuadrillas.map(cuadrilla => (
        <div
          key={cuadrilla.id}
          className="obra-item"
          onClick={() => onSelectCuadrilla(cuadrilla)}
        >
          <strong>- {cuadrilla.name}</strong>
          <br />
          <small>
            {(cuadrilla.correctivos?.length + cuadrilla.preventivos?.length) || 0} obras en ruta
          </small>
        </div>
      ))}

      <h4>Encargados</h4>
      {encargados.length === 0 && <p>No hay encargados.</p>}
      {encargados.map(user => (
        <div
          key={user.id}
          className="obra-item"
          onClick={() => onSelectEncargado(user)}
        >
          <strong>- {user.name}</strong>
          <br />
        </div>
      ))}
    </div>

    <div className="map-sidebar-rigth">
      <div className="d-flex flex-column align-items-start gap-2">
        <h4 className="mb-0">Sucursales</h4>
        <select
          value={clienteFilter}
          onChange={(e) => onClienteChange(e.target.value)}
          className="map-client-filter"
        >
          <option value="">Todos los clientes</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </div>
      {sucursales.length === 0 && <p>No hay sucursales activas.</p>}
      {sucursales.map(sucursal => (
        <div
          key={sucursal.id}
          className="obra-item"
          onClick={() => onSelectSucursal(sucursal)}
        >
          <strong>- {sucursal.name}</strong>
          <br />
          <small>
            {sucursal.Correctivos?.length || 0} correctivos, {sucursal.Preventivos?.length || 0} preventivos
          </small>
        </div>
      ))}
    </div>
  </>
);

export default MapSidebar;
