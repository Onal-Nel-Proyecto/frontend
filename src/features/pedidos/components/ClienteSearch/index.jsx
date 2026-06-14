// ================================================================
// ClienteSearch — Buscador tipo YouTube con debounce
// Muestra resultados en un dropdown mientras el usuario escribe.
// Al seleccionar, devuelve { cliente_id, cliente_nombre, cliente_apellido }
// via onChange (para cliente por defecto, cliente_apellido va vacío).
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiUser, FiPlus } from 'react-icons/fi';
import { searchClientes } from '../../../../api/clientesService';
import styles from './ClienteSearch.module.css';

const CLIENTE_POR_DEFECTO = {
  cliente_id: '9999999999',
  cliente_nombre: 'Cliente por defecto',
  cliente_apellido: '',
};

/** Arma el nombre completo a partir de nombre + apellido */
const nombreCompleto = (c) => {
  if (!c) return '';
  const partes = [c.cliente_nombre, c.cliente_apellido].filter(Boolean);
  return partes.join(' ') || '';
};

const ClienteSearch = ({ initialNombre = '', onChange, error, onAddCliente }) => {
  const [query, setQuery] = useState(initialNombre);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // ─── Búsqueda con debounce ───
  const fetchResults = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const resp = await searchClientes(searchTerm.trim());
      // Normalizar respuesta (paginada o array plano)
      const data = Array.isArray(resp)
        ? resp
        : resp?.data && Array.isArray(resp.data)
          ? resp.data
          : [];

      // Siempre agregar "cliente por defecto" al final
      setResults([...data, CLIENTE_POR_DEFECTO]);
      setOpen(true);
      setHighlightIdx(-1);
    } catch (err) {
      console.error('Error al buscar clientes:', err);
      setResults([CLIENTE_POR_DEFECTO]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    // Si el usuario está escribiendo, notificamos que no hay cliente seleccionado
    if (onChange) {
      onChange({ cliente_id: '', cliente_nombre: val, cliente_apellido: '' });
    }

    // Debounce 300ms antes de disparar la búsqueda
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 300);
  };

  // ─── Seleccionar un cliente ───
  const selectCliente = (cliente) => {
    setQuery(nombreCompleto(cliente));
    setOpen(false);
    setHighlightIdx(-1);
    if (onChange) {
      onChange({
        cliente_id: cliente.cliente_id,
        cliente_nombre: cliente.cliente_nombre,
        cliente_apellido: cliente.cliente_apellido || '',
      });
    }
  };

  // ─── Teclado ───
  const handleKeyDown = (e) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < results.length) {
          selectCliente(results[highlightIdx]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlightIdx(-1);
        break;
    }
  };

  // ─── Cerrar al hacer clic fuera ───
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlightIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Sincronizar cuando el padre cambia initialNombre ───
  useEffect(() => {
    if (initialNombre) {
      setQuery(initialNombre);
    }
  }, [initialNombre]);

  // ─── Limpiar debounce al desmontar ───
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputWrap}>
        <FiUser className={styles.inputIcon} />
        <input
          className={`${styles.input} ${open && results.length > 0 ? styles.inputOpen : ''} ${error ? styles.inputError : ''}`}
          type="text"
          placeholder="Buscar cliente por nombre…"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          autoComplete="off"
          maxLength={300}
        />
        {loading && <span className={styles.spinner} />}
      </div>

      <button
        type="button"
        className={styles.addBtn}
        onClick={onAddCliente}
        title="Agregar nuevo cliente"
      >
        <FiPlus />
      </button>

      {open && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((cliente, idx) => {
            const esDefault = cliente.cliente_id === CLIENTE_POR_DEFECTO.cliente_id;
            return (
              <li
                key={`${cliente.cliente_id}-${idx}`}
                className={`${styles.option} ${highlightIdx === idx ? styles.optionHighlighted : ''} ${esDefault ? styles.defaultOption : ''}`}
                onClick={() => selectCliente(cliente)}
                onMouseEnter={() => setHighlightIdx(idx)}
              >
                <span>
                  {nombreCompleto(cliente)}
                  {esDefault && (
                    <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', color: '#bbb' }}>
                      (id 9999999999)
                    </span>
                  )}
                </span>
                {!esDefault && <span className={styles.optionId}>{cliente.cliente_id}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {open && !loading && query.trim() && results.length === 0 && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>
            No se encontraron clientes
          </div>
        </div>
      )}

      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};

export default ClienteSearch;
