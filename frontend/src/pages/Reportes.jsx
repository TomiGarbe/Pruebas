import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Form } from 'react-bootstrap';
import useReportes from '../hooks/useReportes';
import '../styles/reportes.css';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Reportes = () => {
  const {
    month,
    months,
    setMonth,
    year,
    years,
    setYear,
    clientes,
    zonas,
    sucursales,
    cuadrillas,
    clienteFilter,
    setClienteFilter,
    zonaFilter,
    setZonaFilter,
    sucursalFilter,
    setSucursalFilter,
    cuadrillaFilter,
    setCuadrillaFilter,
    reportData,
    handleGenerateReports,
    generatePieChartData,
    generateBarChartData,
    handleDownloadReport,
  } = useReportes();

  const sucursalOptions = clienteFilter
    ? sucursales.filter((s) => String(s.cliente_id) === clienteFilter)
    : sucursales;

  const renderEmptyState = (text) => (
    <div className="no-data-alert">
      {text}
    </div>
  );

  return (
    <div className="reports-container">
      <h1 className="report-header">Reportes</h1>
      <div className="report-filter-panel">
        <div id="report-filters" className="report-filters-wrapper">
          <div className="maintenance-filters-row">
            <div className="maintenance-filter-item">
              <Form.Group className="mb-0" controlId="month-select">
                <Form.Label>Mes</Form.Label>
                <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                  <option value="">Todos</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="maintenance-filter-item">
              <Form.Group className="mb-0" controlId="year-select">
                <Form.Label>Año</Form.Label>
                <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Todos</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="maintenance-filter-item">
              <Form.Group className="mb-0" controlId="cliente-filter">
                <Form.Label>Cliente</Form.Label>
                <Form.Select
                  value={clienteFilter}
                  onChange={(e) => {
                    setClienteFilter(e.target.value);
                    setSucursalFilter('');
                  }}
                >
                  <option value="">Todos</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="maintenance-filter-item">
              <Form.Group className="mb-0" controlId="zona-filter">
                <Form.Label>Zona</Form.Label>
                <Form.Select value={zonaFilter} onChange={(e) => setZonaFilter(e.target.value)}>
                  <option value="">Todas</option>
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.nombre}>
                      {zona.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="maintenance-filter-item">
              <Form.Group className="mb-0" controlId="sucursal-filter">
                <Form.Label>Sucursal</Form.Label>
                <Form.Select value={sucursalFilter} onChange={(e) => setSucursalFilter(e.target.value)}>
                  <option value="">Todas</option>
                  {sucursalOptions.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="maintenance-filter-item">
              <Form.Group className="mb-0" controlId="cuadrilla-filter">
                <Form.Label>Cuadrilla</Form.Label>
                <Form.Select value={cuadrillaFilter} onChange={(e) => setCuadrillaFilter(e.target.value)}>
                  <option value="">Todas</option>
                  {cuadrillas.map((cuadrilla) => (
                    <option key={cuadrilla.id} value={cuadrilla.id}>
                      {cuadrilla.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
            <button onClick={handleGenerateReports} className="generate-button">
              Generar Reportes
            </button>
            <button onClick={handleDownloadReport} className="download-button">
              Descargar Reporte
            </button>
          </div>
        </div>
      </div>

      {reportData.preventivos && (
        <div>
          <h2 className="report-header">Preventivos por Cuadrilla</h2>
          {reportData.preventivos.length === 0
            ? renderEmptyState('No se encontraron preventivos para los filtros seleccionados.')
            : (
              <>
                <div className="graph-grid">
                  {generatePieChartData(reportData.preventivos, 'Preventivos').map((chart, idx) => (
                    <div className="chart-card" key={idx}>
                      <h3>{chart.title}</h3>
                      <Pie data={chart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  ))}
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Cuadrilla</th>
                      <th>Ratio Resueltos/Asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.preventivos.map((r, i) => (
                      <tr key={i}>
                        <td>{r.nombre}</td>
                        <td>{r.ratio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </div>
      )}

      {reportData.correctivos && (
        <div>
          <h2 className="report-header">Correctivos por Cuadrilla</h2>
          {reportData.correctivos.length === 0
            ? renderEmptyState('No se encontraron correctivos para los filtros seleccionados.')
            : (
              <>
                <div className="graph-grid">
                  {generatePieChartData(reportData.correctivos, 'Correctivos').map((chart, idx) => (
                    <div className="chart-card" key={idx}>
                      <h3>{chart.title}</h3>
                      <Pie data={chart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  ))}
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Cuadrilla</th>
                      <th>Ratio Resueltos/Asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.correctivos.map((r, i) => (
                      <tr key={i}>
                        <td>{r.nombre}</td>
                        <td>{r.ratio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </div>
      )}

      {reportData.rubros && (
        <div>
          <h2 className="report-header">Días Promedio Correctivos por Rubro</h2>
          {reportData.rubros.rubros.length === 0
            ? renderEmptyState('No se encontraron correctivos finalizados para los filtros seleccionados.')
            : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rubro</th>
                    <th>Promedio Días</th>
                    <th>Cantidad Resueltos</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.rubros.rubros.map((r, i) => (
                    <tr key={i}>
                      <td>{r.rubro}</td>
                      <td>{r.avgDays}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>Total General</td>
                    <td>{reportData.rubros.totalAvgDays}</td>
                    <td>{reportData.rubros.totalCount}</td>
                  </tr>
                </tbody>
              </table>
            )}
        </div>
      )}

      {reportData.zonas && (
        <div>
          <h2 className="report-header">Correctivos por Zona</h2>
          {reportData.zonas.length === 0
            ? renderEmptyState('No hay correctivos para las zonas seleccionadas.')
            : (
              <>
                <div className="chart-card">
                  <h3>Total Correctivos por Zona</h3>
                  <Bar
                    data={generateBarChartData(reportData.zonas, 'zona', 'totalCorrectivos')}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Zona</th>
                      <th>Total Correctivos</th>
                      <th>Promedio por Sucursal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.zonas.map((z, i) => (
                      <tr key={i}>
                        <td>{z.zona}</td>
                        <td>{z.totalCorrectivos}</td>
                        <td>{z.avgCorrectivos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </div>
      )}


      {reportData.sucursales && (
        <div>
          <h2 className="report-header">Correctivos por Sucursal</h2>
          {reportData.sucursales.length === 0
            ? renderEmptyState("No se encontraron sucursales para los filtros seleccionados.")
            : (
              <>
                <div className="chart-card">
                  <h3>Total Correctivos por Sucursal</h3>
                  <Bar
                    data={generateBarChartData(reportData.sucursales, "sucursal", "totalCorrectivos")}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Sucursal</th>
                      <th>Zona</th>
                      <th>Total Correctivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sucursales.map((s, i) => (
                      <tr key={i}>
                        <td>{s.sucursal}</td>
                        <td>{s.zona}</td>
                        <td>{s.totalCorrectivos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </div>
      )}
    </div>
  );
};

export default Reportes;
