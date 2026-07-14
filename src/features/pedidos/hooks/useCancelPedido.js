// ================================================================
// useCancelPedido — Hook para cancelar un pedido desde la tabla
// Maneja target, motivo, loading, resultado y confirmación
// ================================================================

import { useState, useCallback } from "react";
import { cancelPedido } from "../services/pedidosService";

/**
 * @returns {{
 *   cancelTarget: number | null,
 *   cancelMotivo: string,
 *   cancelLoading: boolean,
 *   cancelResult: object | null,
 *   iniciarCancelacion: (pedidoId: number) => void,
 *   setCancelMotivo: (motivo: string) => void,
 *   confirmarCancelacion: () => Promise<void>,
 *   limpiarResultado: () => void,
 *   cancelarDialogo: () => void,
 * }}
 */
export const useCancelPedido = () => {
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  const iniciarCancelacion = useCallback((pedidoId) => {
    setCancelTarget(pedidoId);
    setCancelMotivo("");
  }, []);

  const confirmarCancelacion = useCallback(async () => {
    if (!cancelTarget || !cancelMotivo.trim()) return;
    const id = cancelTarget;
    const motivo = cancelMotivo;
    setCancelTarget(null);
    setCancelMotivo('');
    setCancelLoading(true);
    try {
      const resp = await cancelPedido(id, { motivo });
      setCancelLoading(false);
      if (resp?.status) {
        setCancelResult({
          type: "success",
          title: "Pedido cancelado",
          message: resp.msg || "Pedido cancelado correctamente",
          onClose: () => {
            setCancelResult(null);
            window.location.reload();
          },
        });
      } else {
        setCancelResult({
          type: "error",
          title: "Error",
          message: resp?.msg || "Error al cancelar",
          onClose: () => setCancelResult(null),
        });
      }
    } catch (err) {
      setCancelLoading(false);
      setCancelResult({
        type: "error",
        title: "Error",
        message: err?.response?.data?.error || "No se pudo cancelar",
        onClose: () => setCancelResult(null),
      });
    }
  }, [cancelTarget, cancelMotivo]);

  const limpiarResultado = useCallback(() => setCancelResult(null), []);

  const cancelarDialogo = useCallback(() => setCancelTarget(null), []);

  return {
    cancelTarget,
    cancelMotivo,
    cancelLoading,
    cancelResult,
    iniciarCancelacion,
    setCancelMotivo,
    confirmarCancelacion,
    limpiarResultado,
    cancelarDialogo,
  };
};
