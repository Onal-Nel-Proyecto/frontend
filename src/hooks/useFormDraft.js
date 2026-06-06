// ================================================================
// useFormDraft — Preserva datos de formularios en localStorage
// para evitar pérdida de trabajo si la red falla o el usuario
// cierra accidentalmente el navegador.
//
// Uso:
//   const { values, setValues, saving } = useFormDraft("pedido-form", { cliente: "", descripcion: "" });
//   // setValues actualiza el estado y persiste automáticamente
//   // Al submit exitoso, llamar clearDraft()
// ================================================================

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_PREFIX = "form_draft_";

/**
 * @param {string} draftId — Identificador único del formulario (ej: "pedido-form")
 * @param {object} initialValues — Valores iniciales del formulario
 * @param {{ debounceMs?: number }} opts
 * @returns {{ values: object, setValues: Function, clearDraft: Function, saving: boolean }}
 */
export const useFormDraft = (draftId, initialValues, opts = {}) => {
  const debounceMs = opts.debounceMs ?? 500;
  const storageKey = `${STORAGE_PREFIX}${draftId}`;
  const timerRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Cargar draft guardado al montar
  const [values, setValuesState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...initialValues, ...JSON.parse(saved) };
      }
    } catch {
      // ignorar
    }
    return initialValues;
  });

  // Persistir en localStorage con debounce
  const persist = useCallback(
    (data) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
          // localStorage lleno o deshabilitado
        }
        setSaving(false);
      }, debounceMs);
      setSaving(true);
    },
    [storageKey, debounceMs]
  );

  // Actualizar valores y persistir
  const setValues = useCallback(
    (updater) => {
      setValuesState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // Limpiar draft después de submit exitoso
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignorar
    }
    setValuesState(initialValues);
  }, [storageKey, initialValues]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { values, setValues, clearDraft, saving };
};
