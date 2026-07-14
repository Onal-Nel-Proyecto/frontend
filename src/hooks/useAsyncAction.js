// ================================================================
// useAsyncAction — Hook para manejar operaciones asíncronas con
// estados loading/error/success de forma uniforme.
//
// Uso:
//   const { execute, loading, error } = useAsyncAction();
//   await execute(() => apiCall());
// ================================================================

import { useState, useCallback } from "react";

/**
 * @param {{
 *   onError?: (err: any) => void,
 *   rethrow?: boolean,
 * }} opts
 */
export const useAsyncAction = (opts = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (fn) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn();
        return result;
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || "Error inesperado";
        setError(msg);
        if (opts.onError) opts.onError(err);
        if (opts.rethrow) throw err;
        return null;
      } finally {
        setLoading(false);
      }
    },
    [opts.onError, opts.rethrow]
  );

  const clearError = useCallback(() => setError(null), []);

  return { execute, loading, error, clearError };
};
