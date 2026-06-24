// ================================================================
// DetallePanel — Drawer para ver / crear / editar un detalle
// ================================================================

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  FiPackage,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiCopy,
  FiCheckCircle,
} from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import ProductoSearch from '../ProductoSearch';
import { createDetalle, updateDetalle } from '../../services/pedidosService';
import { getCategorias } from '../../../../services/categoriaService';
import { getMedidas } from '../../../../services/medidasService';
import styles from './DetallePanel.module.css';

const DetallePanel = ({ isOpen, onClose, modo, detalle, pedidoEstado }) => {
  const { id: pedidoId } = useParams();
  const isView = modo === 'view';
  const isCreate = modo === 'create';
  const [editMode, setEditMode] = useState(false);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resetear editMode cada vez que se abre el drawer
  useEffect(() => {
    if (isOpen) {
      setEditMode(isCreate);
    }
  }, [isOpen, isCreate]);

  const [showProductoSearch, setShowProductoSearch] = useState(false);
  const [templateAlert, setTemplateAlert] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [medidasList, setMedidasList] = useState([]);

  // ─── Cargar catálogos del backend al abrir el drawer ───
  useEffect(() => {
    if (!isOpen) return;
    const fetchCatalogos = async () => {
      try {
        const [catRes, medRes] = await Promise.all([
          getCategorias(1, { estado: 'ACTIVO' }),
          getMedidas(1, { estado: 'ACTIVO' }),
        ]);
        setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
        setMedidasList(Array.isArray(medRes.data) ? medRes.data : []);
      } catch {
        setCategorias([]);
        setMedidasList([]);
      }
    };
    fetchCatalogos();
  }, [isOpen]);

  const [form, setForm] = useState({
    producto_nombre: detalle?.producto?.nombre || '',
    producto_precio: detalle?.producto?.precio || '',
    producto_categoria_id: detalle?.producto?.categoria?.id ?? detalle?.producto?.categoria ?? '',
    tipo_prenda: detalle?.producto?.tipoPrenda || '',
    genero: detalle?.producto?.genero || '',
    producto_talla: detalle?.producto?.talla || '',
    cantidad: detalle?.cantidad || 1,
    observacion: detalle?.observacion || '',
    medidas: detalle?.medidas?.map((m) => ({
      medida_id: m.medida_id,
      nombre: m.medida_nombre || '',
      valor: m.medida_valor,
    })) || [],
  });

  // Actualizar form cuando cambia el detalle
  useEffect(() => {
    setForm({
      producto_nombre: detalle?.producto?.nombre || '',
      producto_precio: detalle?.producto?.precio || '',
      producto_categoria_id: detalle?.producto?.categoria?.id ?? detalle?.producto?.categoria ?? '',
      tipo_prenda: detalle?.producto?.tipoPrenda || '',
      genero: detalle?.producto?.genero || '',
      producto_talla: detalle?.producto?.talla || '',
      cantidad: detalle?.cantidad || 1,
      observacion: detalle?.observacion || '',
      medidas: detalle?.medidas?.map((m) => ({
        medida_id: m.medida_id,
        nombre: m.medida_nombre || '',
        valor: m.medida_valor,
      })) || [],
    });
  }, [detalle]);

  // ─── Datos derivados de la categoría seleccionada ───
  const categoriaSel = useMemo(
    () => categorias.find((c) => String(c.id) === String(form.producto_categoria_id)) || null,
    [categorias, form.producto_categoria_id]
  );

  const tipoPrendaOptions = categoriaSel?.categoria_tipo_prenda || [];
  const tallaRefOptions = categoriaSel?.categoria_talla_referencia || [];
  const restriccionesMedidas = categoriaSel?.restricciones_medidas || [];

  // Filtrar medidas disponibles según restricciones de la categoría
  const medidasFiltradas = useMemo(() => {
    if (!restriccionesMedidas || restriccionesMedidas.length === 0) return medidasList;
    return medidasList.filter((md) => {
      const tipo = md.med_tipo || md.tipo_medida || '';
      return restriccionesMedidas.includes(tipo);
    });
  }, [medidasList, restriccionesMedidas]);

  // ─── Resetear tipo_prenda / talla al cambiar de categoría ───
  useEffect(() => {
    if (!form.producto_categoria_id) return;
    // Limpiar tipo_prenda si ya no está entre las opciones
    if (
      form.tipo_prenda &&
      tipoPrendaOptions.length > 0 &&
      !tipoPrendaOptions.includes(form.tipo_prenda)
    ) {
      setForm((prev) => ({ ...prev, tipo_prenda: '' }));
    }
    // Limpiar talla si ya no está entre las opciones
    if (
      form.producto_talla &&
      tallaRefOptions.length > 0 &&
      !tallaRefOptions.includes(form.producto_talla)
    ) {
      setForm((prev) => ({ ...prev, producto_talla: '' }));
    }
  }, [form.producto_categoria_id, tipoPrendaOptions, tallaRefOptions]);

  // ─── Cargar producto como plantilla ───
  const handleTemplateSelect = (producto) => {
    setForm((prev) => ({
      ...prev,
      producto_nombre: producto.nombre || '',
      producto_precio: producto.precioUnitario || producto.precio || '',
      producto_categoria_id: producto.categoria_id ?? producto.categoria ?? producto.categoria?.id ?? '',
      tipo_prenda: producto.tipoPrenda || producto.tipo_prenda || '',
      genero: producto.genero || '',
      producto_talla: producto.talla || '',
      // Las medidas NO se copian, son parte del pedido no del producto
    }));
    setTemplateAlert({
      type: 'success',
      title: 'Plantilla cargada',
      message: 'Datos copiados desde producto existente',
      onClose: () => setTemplateAlert(null),
    });
  };

  const [errors, setErrors] = useState({});

  const limits = {
    producto_precio: 99999999.99,
    cantidad: 300,
  };

  const handleChange = (e) => {

    const { name, value, type } = e.target;

    let sanitizedValue = value;

    // Cantidad: solo dígitos, sin signos matemáticos
    if (name === 'cantidad' && sanitizedValue !== '') {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, '');
      const num = Number(sanitizedValue);
      if (!isNaN(num) && num > 300) {
        sanitizedValue = '300';
      }
    }

    // Precio: solo dígitos y . , (máximo una vez cada uno)
    if (name === 'producto_precio' && sanitizedValue !== '') {
      let filtered = '';
      let dotCount = 0;
      let commaCount = 0;
      for (const char of sanitizedValue) {
        if (/[0-9]/.test(char)) {
          filtered += char;
        } else if (char === '.' && dotCount < 1) {
          filtered += char;
          dotCount++;
        } else if (char === ',' && commaCount < 1) {
          filtered += char;
          commaCount++;
        }
      }
      sanitizedValue = filtered;
    }

    if (type === 'number' && sanitizedValue !== '') {

      const numericValue = Number(sanitizedValue);

      if (numericValue < 0) return;

      const max = limits[name];

      if (max && numericValue > max) return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: sanitizedValue
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMedidaChange = (index, field, value) => {
    let newValue = value;

    // Para 'valor': solo dígitos y .,+-, cada especial máximo una vez, máximo 500
    if (field === 'valor') {
      let sanitized = '';
      const counts = { '.': 0, ',': 0, '+': 0, '-': 0 };

      for (const char of value) {
        if (/[0-9]/.test(char)) {
          sanitized += char;
        } else if (char in counts && counts[char] < 1) {
          sanitized += char;
          counts[char]++;
        }
      }

      // Clamp a 500
      const numericValue = parseFloat(sanitized.replace(',', '.'));
      if (!isNaN(numericValue) && numericValue > 500) {
        sanitized = '500';
      }

      newValue = sanitized;
    }

    const nuevas = [...form.medidas];
    nuevas[index] = { ...nuevas[index], [field]: newValue };
    setForm((prev) => ({ ...prev, medidas: nuevas }));
  };

  const agregarMedida = () => {
    setForm((prev) => ({
      ...prev,
      medidas: [...prev.medidas, { medida_id: '', nombre: '', valor: '' }],
    }));
  };

  const eliminarMedida = (index) => {
    setForm((prev) => ({
      ...prev,
      medidas: prev.medidas.filter((_, i) => i !== index),
    }));
  };

  const handlePriceBlur = () => {
    const currentPrice = Number(form.producto_precio);
    if (!isNaN(currentPrice) && currentPrice < 100) {
      setForm((prev) => ({
        ...prev,
        producto_precio: '100'
      }));
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errs = {};
    if (!form.producto_nombre) errs.producto_nombre = 'El nombre del producto es obligatorio';
    if (!form.cantidad || form.cantidad < 1) errs.cantidad = 'La cantidad debe ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    onClose();
    setLoading(true);

    const medidas = form.medidas
      .filter((m) => m.medida_id && m.valor)
      .map((m) => ({ medida_id: Number(m.medida_id), medida_valor: Number(m.valor) }));

    const payload = {
      producto: {
        nombre: form.producto_nombre,
        precio: form.producto_precio ? Number(form.producto_precio) : null,
        categoriaId: form.producto_categoria_id ? Number(form.producto_categoria_id) : null,
        genero: form.genero ? form.genero : null,
        tipoPrenda: form.tipo_prenda ? form.tipo_prenda : null,
        talla: form.producto_talla  ? form.producto_talla : null
      },
      cantidad: Number(form.cantidad),
      observacion: form.observacion || null,
      medidas,
    };

    try {
      let resp;
      if (isCreate) {
        resp = await createDetalle(pedidoId, payload);
      } else {
        resp = await updateDetalle(pedidoId, detalle.detalle_id, payload);
      }

      setLoading(false);
      if (resp?.status) {
        setAlert({
          type: 'success',
          title: isCreate ? 'Detalle registrado' : 'Detalle actualizado',
          message: resp.msg || 'Operación exitosa',
          onClose: () => { setAlert(null); window.location.reload(); },
        });
      } else {
        setAlert({ type: 'error', title: 'Error', message: resp?.msg || 'Error al guardar', onClose: () => setAlert(null) });
      }
    } catch (err) {
      setLoading(false);
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach((e) => {
          if (e.path) mapped[e.path] = e.msg;
        });
        setErrors(mapped);
      }
      setAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo guardar el detalle',
        onClose: () => setAlert(null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Modo vista ───
  if (isView && !editMode) {
    return (
      <>
        <Drawer
          isOpen={isOpen}
          onClose={onClose}
          title="Detalle del pedido"
          subtitle={`ID: ${detalle?.detalle_id || ''}`}
          icon={<FiPackage />}
          footer={
            <button className={styles.btnEdit} disabled={pedidoEstado?.toUpperCase() === 'ENTREGADO'} onClick={() => setEditMode(true)}>
              <FiEdit2 /> Editar detalle
            </button>
          }
        >
          <div className={styles.viewContent}>
            {/* <div className={styles.viewId}>{detalle?.detalle_id}</div> */}

            <section className={styles.viewSection}>
              <h4 className={styles.viewSectionTitle}>Datos del producto</h4>
              <div className={styles.viewGrid}>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Nombre</span>
                  <span className={styles.viewValue}>{detalle?.producto?.nombre || '—'}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Cantidad</span>
                  <span className={styles.viewValue}>{detalle?.cantidad || '—'}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Precio</span>
                  <span className={styles.viewValue}>
                    ${parseFloat(detalle?.producto?.precio || 0).toLocaleString()}
                  </span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Categoría</span>
                  <span className={styles.viewValue}>{categorias.find((c) => String(c.id) === String(detalle?.producto?.categoria?.id ?? detalle?.producto?.categoria ?? detalle?.producto?.categoriaId))?.nombre || detalle?.producto?.categoria?.nombre || detalle?.producto?.categoria || detalle?.producto?.categoriaId || '—'}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Tipo de prenda</span>
                  <span className={styles.viewValue}>{detalle?.producto?.tipoPrenda || detalle?.producto?.tipo_prenda || '—'}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Género</span>
                  <span className={styles.viewValue}>
                    {detalle?.producto?.genero === 'M' ? 'Hombre' : detalle?.producto?.genero === 'F' ? 'Mujer' : detalle?.producto?.genero === 'U' ? 'Unisex' : detalle?.producto?.genero || '—'}
                  </span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Referencia talla</span>
                  <span className={styles.viewValue}>{detalle?.producto?.talla || '—'}</span>
                </div>
              </div>
            </section>

            <section className={styles.viewSection}>
              <h4 className={styles.viewSectionTitle}>Observación</h4>
              <p className={styles.viewObs}>{detalle?.observacion || 'Sin observación'}</p>
            </section>

            <section className={styles.viewSection}>
              <h4 className={styles.viewSectionTitle}>Medidas</h4>
              {(detalle?.medidas?.length || 0) > 0 ? (
                <div className={styles.medidasGrid}>
                  {detalle.medidas.map((m, i) => (
                    <div key={i} className={styles.medidaItem}>
                      <span className={styles.medidaNombre}>{m.medida_nombre || `Medida ${i + 1}`}</span>
                      <span className={styles.medidaValor}>{m.medida_valor} cm</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.viewObs}>Sin medidas registradas</p>
              )}
            </section>
          </div>
        </Drawer>

        {loading && <LoadingOverlay title="Guardando detalle…" message="Procesando la solicitud" />}
        {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
        {templateAlert && <Alert type={templateAlert.type} title={templateAlert.title} message={templateAlert.message} onClose={templateAlert.onClose} />}
      </>
    );
  }

  // ─── Modo crear / editar ───
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isCreate ? 'Añadir detalle' : 'Editar detalle'}
        subtitle="Completa los datos del producto y sus medidas."
        icon={<FiPackage />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className={styles.btnSave} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : isCreate ? 'Registrar detalle' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          <section className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Datos del producto</h4>
            <div className={styles.field}>
              <label className={styles.label}>Nombre del producto *</label>
              <div className={styles.productoNombreRow}>
                <input
                  name="producto_nombre"
                  className={`${styles.input} ${errors.producto_nombre ? styles.inputError : ''}`}
                  value={form.producto_nombre}
                  onChange={handleChange}
                  placeholder="Ej: Camisa Oxford"
                  maxLength={60}
                />
                <button
                  type="button"
                  className={styles.templateBtn}
                  onClick={() => setShowProductoSearch(true)}
                  title="Usar producto como plantilla"
                >
                  <FiCopy />
                  Plantilla
                </button>
              </div>
              {errors.producto_nombre && <span className={styles.fieldError}>{errors.producto_nombre}</span>}
            </div>

            {/* Buscador de productos (plantilla) */}
            {showProductoSearch && (
              <div className={styles.templateSearchWrap}>
                <ProductoSearch
                  onSelect={handleTemplateSelect}
                  onClose={() => setShowProductoSearch(false)}
                />
              </div>
            )}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Cantidad</label>
                <input
                  name="cantidad"
                  type="text"
                  inputMode="numeric"
                  className={`${styles.input} ${errors.cantidad ? styles.inputError : ''}`}
                  value={form.cantidad}
                  onChange={handleChange}
                />
                {errors.cantidad && <span className={styles.fieldError}>{errors.cantidad}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Precio</label>
                <input
                  name="producto_precio"
                  type="text"
                  inputMode="decimal"
                  className={styles.input}
                  value={form.producto_precio}
                  onChange={handleChange}
                  onBlur={handlePriceBlur}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Categoría</label>
                <select
                  name="producto_categoria_id"
                  className={styles.select}
                  value={form.producto_categoria_id}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar…</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tipo de prenda</label>
                <select
                  name="tipo_prenda"
                  className={styles.select}
                  value={form.tipo_prenda}
                  onChange={handleChange}
                  disabled={!form.producto_categoria_id}
                >
                  <option value="">Seleccionar tipo de prenda…</option>
                  {tipoPrendaOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Género</label>
                <select
                  name="genero"
                  className={styles.select}
                  value={form.genero}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar…</option>
                  <option value="M">Hombre</option>
                  <option value="F">Mujer</option>
                  <option value="U">Unisex</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Referencia de talla</label>
                <select
                  name="producto_talla"
                  className={styles.select}
                  value={form.producto_talla}
                  onChange={handleChange}
                  disabled={!form.producto_categoria_id}
                >
                  <option value="">Seleccionar talla…</option>
                  {tallaRefOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Observación</h4>
            <textarea
              name="observacion"
              className={styles.textarea}
              value={form.observacion}
              onChange={handleChange}
              placeholder="Notas adicionales…"
              rows={2}
              maxLength={300}
            />
            <span className={styles.charCounter}>
              {(form.observacion || '').length}/300
            </span>
          </section>

          <section className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Medidas</h4>
            {form.medidas.map((m, i) => (
              <div key={i} className={styles.medidaRow}>
                <select
                  className={styles.select}
                  value={m.medida_id}
                  onChange={(e) => handleMedidaChange(i, 'medida_id', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {medidasFiltradas.map((md) => (
                    <option key={md.id} value={md.id}>{md.nombre}</option>
                  ))}
                </select>
                <div className={styles.medidaInputWrap}>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.input}
                    placeholder="Valor"
                    value={m.valor}
                    onChange={(e) => handleMedidaChange(i, 'valor', e.target.value)}
                  />
                  <span className={styles.inputSuffix}>cm</span>
                </div>
                <button className={styles.btnRemove} onClick={() => eliminarMedida(i)} title="Descartar medida">
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <button className={styles.btnAddMedida} onClick={agregarMedida}>
              <FiPlus /> Añadir medida
            </button>
          </section>
        </div>
      </Drawer>

      {loading && <LoadingOverlay title="Guardando detalle…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
      {templateAlert && <Alert type={templateAlert.type} title={templateAlert.title} message={templateAlert.message} onClose={templateAlert.onClose} />}
    </>
  );
};

export default DetallePanel;
