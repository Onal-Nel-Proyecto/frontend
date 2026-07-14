// ================================================================
// OrdenProduccionSeleccionado — Wrapper que renderiza
// PedidoSeleccionado con origen=PRODUCCION.
// Mantiene las mismas sub-rutas (Detalle, Produccion, Pagos).
// ================================================================

import PedidoSeleccionado from '../PedidoSeleccionado';

const OrdenProduccionSeleccionado = (props) => {
  return <PedidoSeleccionado {...props} origen="PRODUCCION" />;
};

export default OrdenProduccionSeleccionado;
