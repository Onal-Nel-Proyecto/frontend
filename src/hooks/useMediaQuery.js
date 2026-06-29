// ================================================================
// useMediaQuery — Hook para evaluar media queries desde React
// Evita renderizar ambas vistas (desktop + móvil) simultáneamente.
// ================================================================

import { useState, useEffect } from 'react';

/**
 * @param {string} query — CSS media query, e.g. '(max-width: 768px)'
 * @returns {boolean} — true si el viewport cumple la query
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
};
