// ================================================================
// PagosVenta — Sección de pagos dentro de Venta Seleccionada
// Mismo comportamiento que Pagos de pedidos: formulario +
// historial + barra de progreso + bloqueo automático
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { getPagosByVenta, createPagoVenta, rechazarPago } from '../../../../services/pagosService';
import { getStoredUser } from '../../../../utils/session';
import { formatDate } from '../../../../utils/format';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import Alert from '../../../../components/ui/feedback/Alert';
import styles from './pagos-venta.module.css';

// ── Constantes ──────────────────────────────────────────

const METODOS_PAGO = [
  { id: 'efectivo',     label: 'Efectivo',     icono: 'ti ti-cash' },
  { id: 'transferencia',label: 'Transferencia',icono: 'ti ti-building-bank' },
  { id: 'tarjeta',      label: 'Tarjeta',      icono: 'ti ti-credit-card' },
];

const fmtCOP = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Mapeo de métodos de pago (backend → frontend)
const METHOD_MAP = {
  EFECTIVO:       { id: 'efectivo',      label: 'Efectivo',      icono: 'ti ti-cash' },
  TRANSFERENCIA:  { id: 'transferencia', label: 'Transferencia', icono: 'ti ti-building-bank' },
  TARJETA:        { id: 'tarjeta',       label: 'Tarjeta',       icono: 'ti ti-credit-card' },
};

const methodClassMap = {
  efectivo:      styles.methodEfectivo,
  transferencia: styles.methodTransferencia,
  tarjeta:       styles.methodTarjeta,
};

// Mapeo de estados
const STATUS_MAP = {
  COMPLETADO: { label: 'Completado', className: 'statusCompletado' },
  RECHAZADO:  { label: 'Rechazado',  className: 'statusRechazado' },
  PENDIENTE:  { label: 'Pendiente',  className: 'statusPendiente' },
  ANULADO:    { label: 'Anulado',    className: 'statusAnulado' },
};

// ── Componente principal ────────────────────────────────

const PagosVenta = ({ venta, onPagoRegistrado }) => {
  const user = getStoredUser();

  const totalVenta = Number(venta.total) || 0;

  // ── State ──
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Estado para anular pago
  const [anularTarget, setAnularTarget] = useState(null);
  const [anulando, setAnulando] = useState(false);

  const [form, setForm] = useState({
    monto: '',
    metodo: '',
  });

  // Cálculos — excluir pagos rechazados/anulados
  const totalPagado = pagos.reduce((sum, p) => {
    const estado = (p.estado || 'COMPLETADO').toUpperCase();
    if (estado === 'RECHAZADO' || estado === 'ANULADO') return sum;
    return sum + Number(p.monto || 0);
  }, 0);
  const saldoRestante = Math.max(0, totalVenta - totalPagado);
  const pctPagado = totalVenta > 0 ? Math.min((totalPagado / totalVenta) * 100, 100) : 0;
  const estaPagadoCompleto = totalPagado >= totalVenta && totalVenta > 0;

  // ── Cargar pagos ──
  const loadPagos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPagosByVenta(venta.id);
      setPagos(data?.pagos || []);
    } catch {
      // silencio
    } finally {
      setLoading(false);
    }
  }, [venta.id]);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  // ── Anular pago ──
  const handleAnularPago = useCallback(async () => {
    if (!anularTarget) return;
    setAnulando(true);
    try {
      await rechazarPago(anularTarget.pago_id);
      setAnularTarget(null);
      setSuccessMsg('Pago anulado correctamente');
      await loadPagos();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrors({ general: 'Error al anular el pago. Intenta de nuevo.' });
    } finally {
      setAnulando(false);
    }
  }, [anularTarget, loadPagos]);

  // ── Validación ──
  const validate = useCallback((values) => {
    const errs = {};
    const monto = parseFloat(values.monto);

    if (!values.monto || isNaN(monto)) {
      errs.monto = 'Ingresa un monto válido';
    } else if (monto <= 0) {
      errs.monto = 'El monto debe ser mayor a $0';
    } else if (monto > saldoRestante) {
      errs.monto = `El monto no puede superar ${fmtCOP(saldoRestante)}`;
    }

    if (!values.metodo) {
      errs.metodo = 'Selecciona un método de pago';
    }

    return errs;
  }, [saldoRestante]);

  // ── Handlers ──
  const setField = (name, value) => {
    if (name === 'monto') {
      // Solo permitir dígitos — nada de letras (e), signos (-+), ni decimales (.)
      value = value.replace(/\D/g, '');
    }
    // Auto-clamp monto al saldo restante
    if (name === 'monto' && value) {
      const num = Number(value);
      if (num > saldoRestante) {
        value = String(saldoRestante);
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const newForm = { ...form, [name]: value };
      const newErrors = validate(newForm);
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] || undefined }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validate(form);
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] || undefined }));
  };

  const handleSubmit = async () => {
    const newErrors = validate(form);
    setErrors(newErrors);
    setTouched({ monto: true, metodo: true });

    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setSuccessMsg('');
    try {
      const nombreUsuario = user
        ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Admin'
        : 'Admin';

      await createPagoVenta(venta.id, {
        ...form,
        usuario: nombreUsuario,
      });

      setSuccessMsg('Pago registrado correctamente');
      setForm({
        monto: '',
        metodo: '',
      });
      setErrors({});
      setTouched({});

      await loadPagos();

      // Notificar al padre (para actualizar totalPagado en la venta)
      if (onPagoRegistrado) {
        onPagoRegistrado();
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrors({ general: 'Error al registrar el pago. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──
  const hasError = (field) => touched[field] && errors[field];
  const isBlocked = estaPagadoCompleto;

  return (
    <div className={styles.pvContent}>
      {/* ── Resumen / Progreso ── */}
      <section className={styles.cardSection}>
        <h3 className={styles.cardSectionTitle}>
          <i className="ti ti-chart-line" />
          Progreso de pago
        </h3>

        <div className={styles.resumenGrid}>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Total venta</span>
            <span className={styles.resumenValue}>{fmtCOP(totalVenta)}</span>
          </div>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Total abonado</span>
            <span className={`${styles.resumenValue} ${styles.resumenValueGold}`}>{fmtCOP(totalPagado)}</span>
          </div>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Saldo pendiente</span>
            <span className={`${styles.resumenValue} ${saldoRestante > 0 ? styles.resumenValueOrange : styles.resumenValueGreen}`}>
              {fmtCOP(saldoRestante)}
            </span>
          </div>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pctPagado}%` }} />
          </div>
          <div className={styles.progressLabel}>
            <span>{pctPagado.toFixed(1)}% pagado</span>
            <span className={styles.progressPct}>{pagos.length} pago{pagos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* ── Formulario ── */}
      <section className={styles.cardSection} style={{ position: 'relative' }}>
        <h3 className={styles.cardSectionTitle}>
          <i className="ti ti-coin" />
          Registrar pago
        </h3>

        {isBlocked && (
          <div className={styles.blockedOverlay}>
            <div className={styles.blockedBadge}>
              <FiCheckCircle />
              {venta.estado === 'Pagado' ? 'Venta liquidada' : 'Pago completado'}
            </div>
          </div>
        )}

        <div className={isBlocked ? styles.pageBlocked : ''}>
          {successMsg && (
            <div className={styles.successInline} style={{ marginBottom: '1rem' }}>
              <FiCheckCircle />
              {successMsg}
            </div>
          )}

          {errors.general && (
            <div className={styles.fieldError} style={{ marginBottom: '0.75rem' }}>
              {errors.general}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Monto del pago</label>
              <div className={`${styles.inputWrap} ${hasError('monto') ? styles.inputWrapErr : ''}`}>
                <span className={styles.inputSign}>$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.formInput}
                  placeholder="0"
                  value={form.monto}
                  onChange={(e) => setField('monto', e.target.value)}
                  onBlur={() => handleBlur('monto')}
                  disabled={isBlocked}
                />
              </div>
              {hasError('monto') && <span className={styles.fieldError}>{errors.monto}</span>}
              {form.monto && !errors.monto && !isBlocked && (
                <span className={styles.formHint}>
                  {parseFloat(form.monto) >= saldoRestante && saldoRestante > 0
                    ? '✅ Con este pago se completa el total'
                    : `ℹ️ Quedarán ${fmtCOP(saldoRestante - parseFloat(form.monto || 0))} pendientes`
                  }
                </span>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Método de pago</label>
              <select
                className={`${styles.formSelect} ${hasError('metodo') ? styles.formSelectErr : ''}`}
                value={form.metodo}
                onChange={(e) => setField('metodo', e.target.value)}
                onBlur={() => handleBlur('metodo')}
                disabled={isBlocked}
              >
                <option value="">Seleccionar método…</option>
                {METODOS_PAGO.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              {hasError('metodo') && <span className={styles.fieldError}>{errors.metodo}</span>}
            </div>

            {!isBlocked && (
              <div className={styles.formActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <><i className="ti ti-loader ti-spin" /> Registrando…</>
                  ) : (
                    <><FiDollarSign /> Registrar Pago</>
                  )}
                </button>
                <button
                  className={styles.btnOutline}
                  onClick={() => {
                    setForm({
                      monto: '',
                      metodo: '',
                    });
                    setErrors({});
                    setTouched({});
                  }}
                  disabled={saving}
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Historial ── */}
      <section className={styles.cardSection}>
        <h3 className={styles.cardSectionTitle}>
          <i className="ti ti-history" />
          Historial de pagos
          {pagos.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.5rem' }}>
              ({pagos.length} registro{pagos.length !== 1 ? 's' : ''})
            </span>
          )}
        </h3>

        {loading ? (
          <LoadingOverlay title="Cargando pagos…" message="Obteniendo historial" />
        ) : pagos.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.pagosTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...pagos]
                  .sort((a, b) => new Date(b.fecha_registro || b.fecha_creacion || b.created_at) - new Date(a.fecha_registro || a.fecha_creacion || a.created_at))
                  .map((pago) => {
                    // Mapear método de pago (backend → frontend)
                    const metodoKey = pago.metodo_pago || pago.metodo || '';
                    const metodo = METHOD_MAP[metodoKey.toUpperCase()] || { id: metodoKey.toLowerCase(), label: metodoKey, icono: 'ti ti-circle-dashed' };

                    // Formatear fecha
                    const fechaRaw = pago.fecha_registro || pago.fecha || pago.created_at;
                    const fechaStr = fechaRaw ? formatDate(fechaRaw) : '—';

                    // Estado
                    const estadoKey = pago.estado || 'COMPLETADO';
                    const st = STATUS_MAP[estadoKey.toUpperCase()] || { label: estadoKey, className: 'statusCompletado' };

                    const puedeAnular = estadoKey.toUpperCase() === 'COMPLETADO';

                    return (
                      <tr key={pago.pago_id || pago.id}>
                        <td className={styles.cellFecha}>{fechaStr}</td>
                        <td className={styles.cellMetodo}>
                          <span className={`${styles.methodBadge} ${methodClassMap[metodo.id] || styles.methodOtro}`}>
                            <i className={metodo.icono} />
                            {metodo.label}
                          </span>
                        </td>
                        <td className={styles.cellMonto}>{fmtCOP(pago.monto)}</td>
                        <td className={styles.cellStatus}>
                          <span className={styles[st.className] || styles.statusCompletado}>
                            {estadoKey.toUpperCase() === 'COMPLETADO' ? <FiCheckCircle size={12} /> :
                             estadoKey.toUpperCase() === 'RECHAZADO' ? <FiXCircle size={12} /> :
                             <FiAlertTriangle size={12} />}
                            {st.label}
                          </span>
                        </td>
                        <td>
                          {puedeAnular && (
                            <button
                              className={styles.btnAnular}
                              onClick={(e) => { e.stopPropagation(); setAnularTarget(pago); }}
                              title="Anular pago"
                            >
                              <FiXCircle size={13} />
                              Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.historyEmpty}>
            <div className={styles.historyEmptyIcon}>
              <i className="ti ti-receipt-off" />
            </div>
            <p className={styles.historyEmptyText}>No hay pagos registrados</p>
            <p className={styles.historyEmptySub}>
              Registra el primer pago usando el formulario de arriba.
            </p>
          </div>
        )}
      </section>

      {/* Confirmación anular pago */}
      {anularTarget && (
        <Alert
          type="confirm"
          title="¿Anular este pago?"
          message={`Se anulará el pago de ${fmtCOP(anularTarget.monto)}. Esta acción no se puede deshacer.`}
          onCancel={() => setAnularTarget(null)}
          onConfirm={handleAnularPago}
        />
      )}

      {anulando && <LoadingOverlay title="Anulando pago…" message="Procesando la solicitud" />}
    </div>
  );
};

export default PagosVenta;
