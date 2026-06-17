// ================================================================
// DetalleVenta — Sección de detalle de venta seleccionada
// Muestra cliente, número, fecha, productos, totales y estado
// ================================================================

import { FiArrowLeft, FiDownload, FiPackage, FiShoppingCart } from 'react-icons/fi';
import styles from './detalle-venta.module.css';

const fmtCOP = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const DetalleVenta = ({ venta, onRegresar, onDescargarFactura, loadingFactura }) => {
  if (!venta) return null;

  const productos = venta.productos || venta.items || [];
  const totalVenta = Number(venta.total) || 0;

  const estadoClases = {
    'Pagado': styles.statusPagado,
    'Abono parcial': styles.statusAbonoParcial,
    'Pendiente': styles.statusPendiente,
  };

  return (
    <div className={styles.detalleContent}>
      {/* ── Barra de acciones ── */}
      <div className={styles.actionBar}>
        {onRegresar && (
          <button className={styles.backBtn} onClick={onRegresar}>
            <FiArrowLeft />
            regresar a ventas
          </button>
        )}
        {onDescargarFactura && (
          <button
            className={styles.btnInvoice}
            onClick={onDescargarFactura}
            disabled={loadingFactura}
            title="Descargar factura PDF"
          >
            {loadingFactura ? (
              <i className="ti ti-loader ti-spin" />
            ) : (
              <FiDownload />
            )}
            {loadingFactura ? 'Generando…' : 'Generar Factura'}
          </button>
        )}
      </div>

      {/* Info del cliente y venta */}
      <section className={styles.cardSection}>
        <h3 className={styles.sectionTitle}>
          <FiShoppingCart />
          Información de la venta
        </h3>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Cliente</span>
            <span className={styles.infoValue}>{venta.cliente || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>N° Venta</span>
            <span className={styles.infoValue}>{venta.id || '—'}</span>
            {venta.pedido_id && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="ti ti-link" />
                Originada del pedido N° {venta.pedido_id}
              </span>
            )}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Fecha</span>
            <span className={styles.infoValue}>{venta.fecha || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Estado</span>
            <span className={`${styles.statusBadge} ${estadoClases[venta.estado] || styles.statusPendiente}`}>
              <i className={`ti ti-${
                venta.estado === 'Pagado' ? 'circle-check' :
                venta.estado === 'Abono parcial' ? 'receipt-2' : 'clock'
              }`} />
              {venta.estado || 'Pendiente'}
            </span>
          </div>
          {venta.fecha_limite_pago && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha límite de pago</span>
              <span className={styles.infoValue}>{venta.fecha_limite_pago}</span>
            </div>
          )}
        </div>
      </section>

      {/* Productos vendidos */}
      <section className={styles.cardSection}>
        <h3 className={styles.sectionTitle}>
          <FiPackage />
          Productos vendidos
        </h3>

        {productos.length > 0 ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.prodTable}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, idx) => {
                    const cantidad = Number(prod.cantidad || prod.cant || 1);
                    const precio = Number(prod.precio_unitario || prod.precio || 0);
                    const subtotal = cantidad * precio;
                    return (
                      <tr key={prod.id || prod.producto_id || idx}>
                        <td className={styles.cellName}>{prod.producto?.nombre || prod.nombre || 'Producto'}</td>
                        <td className={styles.cellQty}>{cantidad}</td>
                        <td className={styles.cellPrice}>{fmtCOP(precio)}</td>
                        <td className={styles.cellSubtotal}>{fmtCOP(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.summaryFoot}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total venta</span>
                <span className={`${styles.summaryValue} ${styles.summaryGold}`}>{fmtCOP(totalVenta)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Descuento ({Math.round(venta.descuento)}%)</span>
                  <span className={`${styles.summaryValue}`} style={{ color: '#dc2626' }}>
                    -{fmtCOP(Math.round(totalVenta / (1 - venta.descuento / 100) * venta.descuento / 100))}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', padding: '2rem 1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--text-muted)', opacity: 0.4 }}>
              <i className="ti ti-box-off" />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>No hay productos registrados en esta venta</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DetalleVenta;
