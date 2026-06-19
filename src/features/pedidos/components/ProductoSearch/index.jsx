// ================================================================
// ProductoSearch — Buscador tipo YouTube para productos
// Reutiliza el patrón de ClienteSearch adaptado a productos.
// Al seleccionar, devuelve el producto completo via onSelect.
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiX, FiPackage } from 'react-icons/fi';
import { getProductos } from '../../../../services/productoService';
import styles from './ProductoSearch.module.css';

const ProductoSearch = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // ─── Auto-focus al abrir ───
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Búsqueda con debounce ───
  const fetchResults = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getProductos({ nombre: searchTerm.trim() });
      const items = Array.isArray(res.data) ? res.data : [];
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
    setHighlightIdx(-1);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 300);
  };

  // ─── Seleccionar un producto ───
  const selectProducto = (producto) => {
    if (onSelect) onSelect(producto);
    if (onClose) onClose();
  };

  // ─── Teclado ───
  const handleKeyDown = (e) => {
    if (!results.length) {
      if (e.key === 'Enter' && query.trim()) {
        // Si no hay resultados y presiona Enter, no hace nada
      }
      return;
    }

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
          selectProducto(results[highlightIdx]);
        }
        break;
      case 'Escape':
        if (onClose) onClose();
        break;
    }
  };

  // ─── Cerrar al hacer clic fuera ───
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        if (onClose) onClose();
      }
    };
    // Pequeño retardo para evitar que el mismo clic que abrió cierre
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // ─── Limpiar debounce ───
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showDropdown = results.length > 0 || (query.trim() && results.length === 0);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputWrap}>
        <FiSearch className={styles.inputIcon} />
        <input
          ref={inputRef}
          className={`${styles.input} ${showDropdown && results.length > 0 ? styles.inputOpen : ''}`}
          type="text"
          placeholder="Buscar producto por nombre…"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          maxLength={60}
        />
      </div>

      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        title="Cerrar buscador"
      >
        <FiX />
      </button>

      {loading && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>Buscando…</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((prod, idx) => (
            <li
              key={prod.id}
              className={`${styles.option} ${highlightIdx === idx ? styles.optionHighlighted : ''}`}
              onClick={() => selectProducto(prod)}
              onMouseEnter={() => setHighlightIdx(idx)}
            >
              <span className={styles.optionNombre}>
                <FiPackage style={{ marginRight: '0.35rem', verticalAlign: 'middle', fontSize: '0.75rem', color: '#999' }} />
                {prod.nombre}
              </span>
              <div className={styles.optionMeta}>
                <span>{prod.tipoPrenda || ''}</span>
                <span>{prod.talla ? `Talla: ${prod.talla}` : ''}</span>
                <span>{prod.precioUnitario ? `$${Number(prod.precioUnitario).toLocaleString()}` : ''}</span>
                <span>{prod.genero === 'M' ? 'Hombre' : prod.genero === 'F' ? 'Mujer' : prod.genero === 'U' ? 'Unisex' : ''}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>
            No se encontraron productos
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductoSearch;
