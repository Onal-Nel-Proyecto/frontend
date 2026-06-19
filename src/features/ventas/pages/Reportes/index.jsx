// ================================================================
// ReportesVentas — Página de reportes de ventas
// Muestra filtros, indicadores, gráfico, top productos y
// acciones de exportación con datos reales del backend.
// Consume:
//   GET /ventas/reportes/mensual
//   GET /ventas/reportes/periodo
// ================================================================

import { useState, useCallback } from 'react';
import {
  FiBarChart2,
  FiDollarSign,
  FiTrendingUp,
  FiStar,
  FiFileText,
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiAlertTriangle,
  FiCalendar,
} from 'react-icons/fi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import Card from '../../../../components/common/Card';
import {
  getReporteVentasMensual,
  getReporteVentasPeriodo,
  exportReporteMensualPDF,
  exportReporteMensualExcel,
  exportReportePeriodoPDF,
  exportReportePeriodoExcel,
} from '../../services/ventasService';
import { formatCurrency, formatDate, pad } from '../../../../utils/format';
import styles from './reportes.module.css';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ANIOS = [2024, 2025, 2026];

// ═══════════════════════════════════════════════════════════════
// HELPERS DE DESCARGA
// ═══════════════════════════════════════════════════════════════

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const extractFilename = (response) => {
  const disposition = response.headers?.['content-disposition'];
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match?.[1]) return match[1].replace(/['"]/g, '');
  }
  return null;
};

const defaultFilename = (formato) => {
  const now = new Date();
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  return `Reporte_Ventas_${ts}.${formato}`;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Gráfico de barras
// ═══════════════════════════════════════════════════════════════

const BarChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => d.total));

  return (
    <div className={styles.chartContainer}>
      <div className={styles.barChart}>
        {data.map((item, i) => {
          const heightPercent = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
          return (
            <div key={i} className={styles.barWrapper}>
              <div className={styles.bar} style={{ height: `${Math.max(heightPercent, 2)}%` }}>
                <span className={styles.barValue}>{formatCurrency(item.total)}</span>
              </div>
              <span className={styles.barLabel}>{item.fecha}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const ReportesVentas = () => {
  useDocumentTitle('Reportes de Ventas');

  // ─── Estados de filtros ───
  const [tipoReporte, setTipoReporte] = useState('mensual');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // ─── Estados de la consulta ───
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reporteGenerado, setReporteGenerado] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [tipoEjecutado, setTipoEjecutado] = useState('mensual'); // el tipo con que se generó el reporte

  // ─── Estados de exportación ───
  const [exportLoading, setExportLoading] = useState(null); // 'pdf' | 'excel' | null

  // ─── Normalizar estructura de la respuesta ───
  // El backend puede devolver los datos:
  //   • planos:      { numeroVentas, totalVendido, topProductos, ventasPorDia }
  //   • agrupados:   { resumen, topProductos, ventasPorDia }
  //   • envueltos:   { data: { … }, status, message }
  const normalizeData = (data) => {
    if (!data) return null;
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      return data.data;
    }
    return data;
  };

  const normalized = normalizeData(reportData) || {};

  // ─── Resumen: soporta tanto anidado (normalized.resumen) como plano ───
  const rawResumen = normalized.resumen || {};
  const resumen = {
    numeroVentas: rawResumen.numeroVentas ?? normalized.numeroVentas,
    totalVendido: rawResumen.totalVendido ?? normalized.totalVendido,
    ticketPromedio: rawResumen.ticketPromedio ?? normalized.ticketPromedio,
  };

  // ─── Top productos ───
  const topProductos = normalized.topProductos || [];
  const productoMasVendido = topProductos.length > 0 ? topProductos[0].producto : 'Sin datos';

  // ─── Ventas por día: maneja dia (mensual) y fecha (período) dinámicamente ───
  // Usa tipoEjecutado (congelado al generar) para que cambiar el dropdown
  // después de generar no altere el formato del gráfico.
  const rawVentas = normalized.ventasPorDia || [];
  let ventasPorDia = rawVentas.map((item) => {
    let label;
    if (item.dia !== undefined && tipoEjecutado === 'mensual') {
      // Mensual: el backend retorna { dia: 1, totalDia: … }
      // Mostrar como "dia/mes" → ej. "01/07"
      label = `${pad(item.dia)}/${pad(mes)}`;
    } else if (item.fecha) {
      // Período: el backend retorna { fecha: "2026-05-13T05:00:00.000Z", totalDia: … }
      label = formatDate(item.fecha);
    } else {
      label = '';
    }
    return { fecha: label, total: item.totalDia };
  });

  // Si hay más de 31 puntos, agrupar por semanas para mejor visualización
  if (ventasPorDia.length > 31) {
    const weekly = [];
    for (let i = 0; i < ventasPorDia.length; i += 7) {
      const chunk = ventasPorDia.slice(i, i + 7);
      const firstFecha = chunk[0].fecha;
      const lastFecha = chunk[chunk.length - 1].fecha;
      const total = chunk.reduce((sum, d) => sum + d.total, 0);
      weekly.push({
        fecha: chunk.length === 1 ? firstFecha : `${firstFecha} - ${lastFecha}`,
        total,
      });
    }
    ventasPorDia = weekly;
  }

  // ─── Determinar si el resultado está vacío ───
  const isEmpty = reporteGenerado && (
    !rawVentas.length && !topProductos.length
  );

  // ─── Generar reporte ───
  const handleGenerarReporte = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReporteGenerado(false);
    setReportData(null);

    if (tipoReporte === 'periodo' && (!fechaInicio || !fechaFin)) {
      setError('Debe seleccionar una fecha de inicio y una fecha de fin.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (tipoReporte === 'mensual') {
        response = await getReporteVentasMensual(mes, anio);
      } else {
        response = await getReporteVentasPeriodo(fechaInicio, fechaFin);
      }

      // El backend puede retornar status 200 con { status: false, error: "..." }
      if (response && response.status === false) {
        throw new Error(response.error || 'Error al generar el reporte.');
      }

      setTipoEjecutado(tipoReporte);
      setReportData(response);
      setReporteGenerado(true);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.msg ||
        err.message ||
        'Error al generar el reporte. Intente nuevamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tipoReporte, mes, anio, fechaInicio, fechaFin]);

  // ─── Helper: detectar blob de error ───
  // El backend export puede retornar un blob con JSON
  // { status: false, error: "..." } en lugar del archivo.
  const checkErrorBlob = useCallback(async (blob) => {
    if (!blob || blob.size === 0) return null;
    const contentType = blob.type || '';
    if (contentType.includes('json') || contentType.includes('text') || contentType === '') {
      try {
        const text = await blob.text();
        const data = JSON.parse(text);
        if (data && data.status === false) {
          return data.error || 'Error al generar el archivo.';
        }
      } catch {
        // No es JSON válido → es un archivo real, continuar
      }
    }
    return null;
  }, []);

  // ─── Exportar PDF ───
  const handleExportPDF = useCallback(async () => {
    setExportLoading('pdf');
    setError(null);

    try {
      let response;
      if (tipoEjecutado === 'mensual') {
        response = await exportReporteMensualPDF(mes, anio);
      } else {
        if (!fechaInicio || !fechaFin) {
          setError('Debe seleccionar una fecha de inicio y una fecha de fin.');
          setExportLoading(null);
          return;
        }
        response = await exportReportePeriodoPDF(fechaInicio, fechaFin);
      }

      // Verificar si el blob es en realidad un error de validación
      const errorMsg = await checkErrorBlob(response.data);
      if (errorMsg) {
        throw new Error(errorMsg);
      }

      const filename = extractFilename(response) || defaultFilename('pdf');
      downloadBlob(response.data, filename);
    } catch (err) {
      const message =
        err.message ||
        err.response?.data?.error ||
        'No fue posible generar el archivo PDF. Intente nuevamente.';
      setError(message);
    } finally {
      setExportLoading(null);
    }
  }, [tipoEjecutado, mes, anio, fechaInicio, fechaFin, checkErrorBlob]);

  // ─── Exportar Excel ───
  const handleExportExcel = useCallback(async () => {
    setExportLoading('excel');
    setError(null);

    try {
      let response;
      if (tipoEjecutado === 'mensual') {
        response = await exportReporteMensualExcel(mes, anio);
      } else {
        if (!fechaInicio || !fechaFin) {
          setError('Debe seleccionar una fecha de inicio y una fecha de fin.');
          setExportLoading(null);
          return;
        }
        response = await exportReportePeriodoExcel(fechaInicio, fechaFin);
      }

      // Verificar si el blob es en realidad un error de validación
      const errorMsg = await checkErrorBlob(response.data);
      if (errorMsg) {
        throw new Error(errorMsg);
      }

      const filename = extractFilename(response) || defaultFilename('xlsx');
      downloadBlob(response.data, filename);
    } catch (err) {
      const message =
        err.message ||
        err.response?.data?.error ||
        'No fue posible generar el archivo Excel. Intente nuevamente.';
      setError(message);
    } finally {
      setExportLoading(null);
    }
  }, [tipoEjecutado, mes, anio, fechaInicio, fechaFin, checkErrorBlob]);

  // ─── Estado inicial (sin reporte generado) ───
  const showInitialState = !reporteGenerado && !loading && !error;

  return (
    <div className={styles.page}>
      {/* ═══ Encabezado ═══ */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Reportes de Ventas</h2>
          <p className={styles.subtitle}>
            Consulta el rendimiento de las ventas mediante reportes mensuales o por rango de fechas.
          </p>
        </div>
      </header>

      {/* ═══ Filtros ═══ */}
      <Card className={styles.filterCard}>
        <div className={styles.filterRow}>
          {/* Tipo de reporte */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tipo de reporte</label>
            <select
              className={styles.filterSelect}
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              disabled={loading}
            >
              <option value="mensual">Mensual</option>
              <option value="periodo">Periodo Personalizado</option>
            </select>
          </div>

          {/* Filtros condicionales */}
          {tipoReporte === 'mensual' ? (
            <>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Mes</label>
                <select
                  className={styles.filterSelect}
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  disabled={loading}
                >
                  {MESES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Año</label>
                <select
                  className={styles.filterSelect}
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  disabled={loading}
                >
                  {ANIOS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fecha Inicio</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fecha Fin</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Botón Generar */}
          <button
            className={styles.btnGenerar}
            onClick={handleGenerarReporte}
            disabled={loading}
          >
            {loading ? (
              <><FiRefreshCw className={styles.loadingIcon} style={{ fontSize: '1rem' }} /> Generando…</>
            ) : (
              <><FiSearch /> Generar Reporte</>
            )}
          </button>
        </div>
      </Card>

      {/* ═══ Loading State ═══ */}
      {loading && (
        <Card>
          <div className={styles.loadingContainer}>
            <FiRefreshCw className={styles.loadingIcon} />
            <p className={styles.loadingMessage}>Generando reporte…</p>
          </div>
        </Card>
      )}

      {/* ═══ Error State ═══ */}
      {error && (
        <Card>
          <div className={styles.errorContainer}>
            <FiAlertTriangle className={styles.errorIcon} />
            <p className={styles.errorMessage}>{error}</p>
          </div>
        </Card>
      )}

      {/* ═══ Initial State (sin reporte) ═══ */}
      {showInitialState && (
        <Card>
          <div className={styles.errorContainer}>
            <FiCalendar style={{ fontSize: '2.5rem', color: 'var(--text-soft)', opacity: 0.5 }} />
            <p className={styles.errorMessage} style={{ fontSize: '0.95rem' }}>
              Selecciona un tipo de reporte y haz clic en "Generar Reporte" para visualizar los datos.
            </p>
          </div>
        </Card>
      )}

      {/* ═══ Empty State (reporte sin datos) ═══ */}
      {isEmpty && (
        <Card>
          <div className={styles.errorContainer}>
            <FiCalendar style={{ fontSize: '2.5rem', color: 'var(--text-soft)', opacity: 0.5 }} />
            <p className={styles.errorMessage} style={{ fontSize: '0.95rem' }}>
              No se encontraron ventas para el período seleccionado.
            </p>
          </div>
        </Card>
      )}

      {/* ═══ Datos del reporte ═══ */}
      {reporteGenerado && !loading && !error && !isEmpty && (
        <>
          {/* ─── Cards Resumen ─── */}
          <section className={styles.cardsGrid}>
            <Card className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <FiBarChart2 />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{resumen.numeroVentas ?? '-'}</span>
                <span className={styles.statLabel}>Número de Ventas</span>
              </div>
            </Card>
            <Card className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <FiDollarSign />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{resumen.totalVendido != null ? formatCurrency(resumen.totalVendido) : '-'}</span>
                <span className={styles.statLabel}>Total Vendido</span>
              </div>
            </Card>
            <Card className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                <FiTrendingUp />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{resumen.ticketPromedio != null ? formatCurrency(resumen.ticketPromedio) : '-'}</span>
                <span className={styles.statLabel}>Ticket Promedio</span>
              </div>
            </Card>
            <Card className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                <FiStar />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statValue} style={{ fontSize: '1rem' }}>{productoMasVendido}</span>
                <span className={styles.statLabel}>Producto Más Vendido</span>
              </div>
            </Card>
          </section>

          {/* ─── Gráfico de Ventas ─── */}
          <Card className={styles.chartCard}>
            <h3 className={styles.sectionTitle}>Comportamiento de Ventas</h3>
            <BarChart data={ventasPorDia} />
          </Card>

          {/* ─── Top Productos ─── */}
          <Card className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>Top Productos Más Vendidos</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label="Top productos más vendidos">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad Vendida</th>
                    <th>Total Generado</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.length > 0 ? (
                    topProductos.map((item, i) => (
                      <tr key={i} className={styles.tableRow}>
                        <td>{item.producto}</td>
                        <td>{item.cantidadVendida}</td>
                        <td className={styles.cellCurrency}>{formatCurrency(item.totalGenerado)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className={styles.emptyRow}>
                        No hay productos para mostrar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ─── Acciones de Exportación ─── */}
          <div className={styles.exportSection}>
            <button
              className={styles.exportBtn}
              onClick={handleExportPDF}
              disabled={exportLoading !== null}
            >
              {exportLoading === 'pdf' ? (
                <><FiRefreshCw className={styles.loadingIcon} style={{ fontSize: '0.85rem' }} /> Generando PDF…</>
              ) : (
                <><FiFileText /> Exportar PDF</>
              )}
            </button>
            <button
              className={styles.exportBtn}
              onClick={handleExportExcel}
              disabled={exportLoading !== null}
            >
              {exportLoading === 'excel' ? (
                <><FiRefreshCw className={styles.loadingIcon} style={{ fontSize: '0.85rem' }} /> Generando Excel…</>
              ) : (
                <><FiDownload /> Exportar Excel</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportesVentas;
