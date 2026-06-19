// ================================================================
// VentaSeleccionada — Página de detalle de una venta
// Incluye: DetalleVenta + PagosVenta + botón "Generar Factura"
// ================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import { useVentas } from '../../hooks/useVentas';
import { getStoredUser } from '../../../../utils/session';
import { getFacturaPdfBlob } from '../../services/ventasService';
import DetalleVenta from '../../components/DetalleVenta';
import PagosVenta from '../../components/PagosVenta';
import styles from './venta_seleccionada.module.css';

const fmtCOP = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// ── Factura HTML ──────────────────────────────────────
const generarFactura = (venta, pagos = []) => {
  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
  const saldo = Math.max(0, venta.total - totalPagado);
  const productos = venta.productos || venta.items || [];
  const user = getStoredUser();
  const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  const facturaHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura — ${venta.pedido_id || venta.id}</title>
  <style>
    @page { margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff; color: #1a1a1a; line-height: 1.5;
      padding: 2rem;
    }
    .factura { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #C9A23D; }
    .logo-area h1 { font-size: 1.8rem; font-weight: 800; color: #1a1a1a; letter-spacing: -0.03em; }
    .logo-area p { font-size: 0.8rem; color: #666; margin-top: 4px; }
    .factura-info { text-align: right; }
    .factura-info h2 { font-size: 1.4rem; color: #C9A23D; margin-bottom: 4px; }
    .factura-info p { font-size: 0.8rem; color: #666; }
    .cliente-section { margin-bottom: 1.5rem; padding: 1rem 1.25rem; background: #f8f6fc; border-radius: 12px; }
    .cliente-section h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 6px; }
    .cliente-section p { font-size: 0.95rem; color: #1a1a1a; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    thead th { text-align: left; padding: 0.7rem 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 1px solid #eee; }
    tbody td { padding: 0.7rem 0.5rem; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .total-row td { border-top: 2px solid #C9A23D; border-bottom: none; font-weight: 700; padding-top: 1rem; }
    .total-row .label { text-align: right; }
    .total-row .value { font-size: 1.1rem; color: #C9A23D; }
    .pagos-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee; }
    .pagos-section h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; }
    .pago-item { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.8rem; }
    .pago-fecha { color: #999; }
    .pago-monto { font-weight: 600; }
    .saldo-final { margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem; }
    .saldo-ok { background: #e8f5e9; color: #2e7d32; }
    .saldo-pend { background: #fff3e0; color: #e65100; }
    .footer { margin-top: 2.5rem; text-align: center; font-size: 0.75rem; color: #999; border-top: 1px solid #eee; padding-top: 1.5rem; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .qty-cell { text-align: center; }
    .price-cell { text-align: right; }
  </style>
</head>
<body>
  <div class="factura">
    <!-- Header -->
    <div class="header">
      <div class="logo-area">
        <h1>ona&nel</h1>
        <p>Atelier de Moda</p>
      </div>
      <div class="factura-info">
        <h2>FACTURA</h2>
        <p>N° ${venta.id}</p>
        <p>Fecha: ${hoy}</p>
      </div>
    </div>

    <!-- Cliente -->
    <div class="cliente-section">
      <h3>Cliente</h3>
      <p>${venta.cliente || 'No especificado'}</p>
    </div>

    <!-- Productos -->
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="text-center">Cant.</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${productos.map(p => {
          const cant = Number(p.cantidad || p.cant || 1);
          const precio = Number(p.precio_unitario || p.precio || 0);
          return `
            <tr>
              <td>${p.producto?.nombre || p.nombre || 'Producto'}</td>
              <td class="text-center">${cant}</td>
              <td class="text-right">${fmtCOP(precio)}</td>
              <td class="text-right">${fmtCOP(cant * precio)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Totales -->
    <div style="display: flex; justify-content: flex-end; gap: 2rem; margin-bottom: 0.5rem;">
      <div><strong>Total:</strong> ${fmtCOP(venta.total)}</div>
      <div><strong>Pagado:</strong> ${fmtCOP(totalPagado)}</div>
      <div><strong>${saldo > 0 ? 'Saldo pendiente:' : 'Estado:'}</strong> ${saldo > 0 ? fmtCOP(saldo) : '✓ Pagado completo'}</div>
    </div>

    <!-- Historial de pagos -->
    ${pagos.length > 0 ? `
    <div class="pagos-section">
      <h3>Historial de pagos</h3>
      ${pagos.map(p => `
        <div class="pago-item">
          <span class="pago-fecha">${p.fecha}</span>
          <span>${p.metodo}</span>
          <span class="pago-monto">${fmtCOP(p.monto)}</span>
        </div>
      `).join('')}
      <div class="${saldo > 0 ? 'saldo-pend saldo-final' : 'saldo-ok saldo-final'}">
        ${saldo > 0 ? `Pendiente por pagar: ${fmtCOP(saldo)}` : '✓ Factura pagada en su totalidad'}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>ona&nel Atelier — Gracias por su preferencia</p>
      <p style="margin-top: 4px;">Factura generada el ${hoy}</p>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(facturaHTML);
    win.document.close();
  }
};

// ── Componente principal ────────────────────────────────

const VentaSeleccionada = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle(`Venta #${id}`);

  const { getVenta } = useVentas();

  // Buscar venta por ID
  const [venta, setVenta] = useState(null);
  const [loadingVenta, setLoadingVenta] = useState(true);

  useEffect(() => {
    const cargarVenta = async () => {
      setLoadingVenta(true);
      try {
        const data = await getVenta(id);
        setVenta(data);
      } catch {
        setVenta(null);
      } finally {
        setLoadingVenta(false);
      }
    };
    cargarVenta();
  }, [id, location.state, getVenta]);

  const [loadingFactura, setLoadingFactura] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDescargarFactura = async () => {
    setLoadingFactura(true);
    try {
      const { blob, filename } = await getFacturaPdfBlob(venta.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Error al descargar factura');
    } finally {
      setLoadingFactura(false);
    }
  };

  const handlePagoRegistrado = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loadingVenta) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/ventas')}>
            <FiArrowLeft />
            regresar a ventas
          </button>
        </header>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ textAlign: 'center' }}>
            <i className="ti ti-loader ti-spin" style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '0.75rem', display: 'block' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Cargando venta…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/ventas')}>
            <FiArrowLeft />
            regresar a ventas
          </button>
          <div className={styles.placeholder}>Venta no encontrada</div>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Subnavegación ── */}
      <nav className={styles.subNav}>
        <div className={styles.subNavInner}>
          <button className={`${styles.subTab} ${styles.subTabActive}`}>
            <FiShoppingCart style={{ marginRight: 6 }} />
            Detalle de Venta
          </button>
        </div>
      </nav>

      {/* ── Contenido ── */}
      <main className={styles.content}>
        <DetalleVenta
          venta={venta}
          onRegresar={() => navigate('/ventas')}
          onDescargarFactura={handleDescargarFactura}
          loadingFactura={loadingFactura}
        />
      </main>

      {/* ── Línea separadora visual ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginTop: '0.5rem',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontWeight: 600,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          <FiDollarSign />
          Pagos
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
      </div>

      {/* ── Pagos ── */}
      <main className={styles.content} key={refreshKey}>
        <PagosVenta venta={venta} onPagoRegistrado={handlePagoRegistrado} />
      </main>
    </div>
  );
};

export default VentaSeleccionada;
