// ================================================================
// PagosVenta — Sección de pagos dentro de Venta Seleccionada
// Mismo comportamiento que Pagos de pedidos: formulario +
// historial + barra de progreso + bloqueo automático
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiCalendar, FiUser, FiCheckCircle } from 'react-icons/fi';
import { getPagosByVenta, createPagoVenta } from '../../../pedidos/services/pagosService';
import { getStoredUser } from '../../../../utils/session';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import styles from './pagos-venta.module.css';

// ── Constantes ──────────────────────────────────────────

const METODOS_PAGO = [
  { id: 'efectivo',     label: 'Efectivo',     icono: 'ti ti-cash' },
  { id: 'transferencia',label: 'Transferencia',icono: 'ti ti-building-bank' },
  { id: 'tarjeta',      label: 'Tarjeta',      icono: 'ti ti-credit-card' },
  { id: 'nequi',        label: 'Nequi',        icono: 'ti ti-device-mobile' },
  { id: 'daviplata',    label: 'Daviplata',    icono: 'ti ti-device-mobile-vibration' },
  { id: 'otro',         label: 'Otro',         icono: 'ti ti-circle-dashed' },
];

const fmtCOP = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const methodClassMap = {
  efectivo:      styles.methodEfectivo,
  transferencia: styles.methodTransferencia,
  tarjeta:       styles.methodTarjeta,
  nequi:         styles.methodNequi,
  daviplata:     styles.methodDaviplata,
  otro:          styles.methodOtro,
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

  const [form, setForm] = useState({
    monto: '',
    metodo: '',
    metodo_otro: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  });

  // Cálculos
  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const saldoRestante = Math.max(0, totalVenta - totalPagado);
  const pctPagado = totalVenta > 0 ? Math.min((totalPagado / totalVenta) * 100, 100) : 0;
  const estaPagadoCompleto = totalPagado >= totalVenta && totalVenta > 0;

  // ── Cargar pagos ──
  const loadPagos = useCallback(async () => {
    setLoading(true);
    try {
      const ventaId = venta.pedido_id || venta.id;
      const data = await getPagosByVenta(ventaId);
      setPagos(data);
    } catch {
      // silencio
    } finally {
      setLoading(false);
    }
  }, [venta.pedido_id, venta.id]);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

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

    if (values.metodo === 'otro' && !values.metodo_otro.trim()) {
      errs.metodo_otro = 'Especifica el método de pago';
    }

    if (!values.fecha) {
      errs.fecha = 'Selecciona la fecha del pago';
    }

    return errs;
  }, [saldoRestante]);

  // ── Handlers ──
  const setField = (name, value) => {
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
    setTouched({ monto: true, metodo: true, metodo_otro: true, fecha: true });

    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setSuccessMsg('');
    try {
      const nombreUsuario = user
        ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Admin'
        : 'Admin';

      const ventaId = venta.pedido_id || venta.id;

      await createPagoVenta(ventaId, {
        ...form,
        usuario: nombreUsuario,
      });

      setSuccessMsg('Pago registrado correctamente');
      setForm({
        monto: '',
        metodo: '',
        metodo_otro: '',
        fecha: new Date().toISOString().split('T')[0],
        notas: '',
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
                  type="number"
                  step="1000"
                  min="1"
                  max={saldoRestante || 1}
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

            {form.metodo === 'otro' && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Especifica el método</label>
                <div className={`${styles.inputWrap} ${hasError('metodo_otro') ? styles.inputWrapErr : ''}`}>
                  <i className={`ti ti-edit ${styles.inputIcon}`} />
                  <input
                    type="text"
                    maxLength="50"
                    className={styles.formInput}
                    placeholder="Ej: Mercado Pago, Cripto, etc."
                    value={form.metodo_otro}
                    onChange={(e) => setField('metodo_otro', e.target.value)}
                    onBlur={() => handleBlur('metodo_otro')}
                    disabled={isBlocked}
                  />
                </div>
                {hasError('metodo_otro') && <span className={styles.fieldError}>{errors.metodo_otro}</span>}
              </div>
            )}

            <div className={styles.formField}>
              <label className={styles.formLabel}>Fecha del pago</label>
              <div className={`${styles.inputWrap} ${hasError('fecha') ? styles.inputWrapErr : ''}`}>
                <FiCalendar className={styles.inputIcon} />
                <input
                  type="date"
                  className={styles.formInput}
                  value={form.fecha}
                  onChange={(e) => setField('fecha', e.target.value)}
                  onBlur={() => handleBlur('fecha')}
                  disabled={isBlocked}
                />
              </div>
              {hasError('fecha') && <span className={styles.fieldError}>{errors.fecha}</span>}
            </div>

            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Notas (opcional)</label>
              <div className={styles.inputWrap}>
                <i className={`ti ti-notes ${styles.inputIcon}`} />
                <input
                  type="text"
                  maxLength="255"
                  className={styles.formInput}
                  placeholder="Observaciones del pago..."
                  value={form.notas}
                  onChange={(e) => setField('notas', e.target.value)}
                  disabled={isBlocked}
                />
              </div>
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
                      metodo_otro: '',
                      fecha: new Date().toISOString().split('T')[0],
                      notas: '',
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
                  <th>Registrado por</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {[...pagos]
                  .sort((a, b) => new Date(b.created_at || b.fecha) - new Date(a.created_at || a.fecha))
                  .map((pago) => {
                    const metodo = METODOS_PAGO.find((m) => m.id === pago.metodo);
                    const labelMetodo = pago.metodo === 'otro'
                      ? (pago.metodo_otro || 'Otro')
                      : (metodo?.label || pago.metodo);
                    return (
                      <tr key={pago.pago_id}>
                        <td className={styles.cellFecha}>{pago.fecha}</td>
                        <td className={styles.cellMetodo}>
                          <span className={`${styles.methodBadge} ${methodClassMap[pago.metodo] || styles.methodOtro}`}>
                            <i className={metodo?.icono || 'ti ti-circle-dashed'} />
                            {labelMetodo}
                          </span>
                        </td>
                        <td className={styles.cellMonto}>{fmtCOP(pago.monto)}</td>
                        <td className={styles.cellUsuario}>
                          <FiUser style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {pago.usuario || '—'}
                        </td>
                        <td className={styles.cellStatus}>
                          <span className={styles.statusCompletado}>
                            <FiCheckCircle size={12} />
                            Completado
                          </span>
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
    </div>
  );
};

export default PagosVenta;
