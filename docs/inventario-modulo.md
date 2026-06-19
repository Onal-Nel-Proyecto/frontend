# Módulo de Inventario — Documentación

## Estructura de carpetas

```
src/
├── page/Inventario/
│   ├── InventarioPage.jsx       ← Página principal (tabs)
│   ├── InventarioPage.css        ← Estilos de la página
│   ├── RegisterMaterial.jsx      ← Formulario de Materiales
│   ├── RegisterMaterial.css
│   ├── RegisterProducto.jsx      ← Formulario de Productos
│   ├── RegisterProducto.css
│   ├── RegisterAbastecimiento.jsx ← Formulario de Abastecimiento
│   └── RegisterAbastecimiento.css
├── hooks/
│   └── useAbastecimiento.js      ← Hook de abastecimiento (CRUD)
├── api/
│   ├── abastecimientoService.js  ← Servicio API abastecimiento
│   ├── endpoints/
│   │   └── abastecimientoEndpoints.js ← Endpoints
│   ├── materialesService.js      ← Servicio API materiales
│   └── productosApiService.js    ← Servicio API productos
└── routes/
    └── AppRouter.jsx             ← Rutas del inventario
```

---

## Página principal — InventarioPage.jsx

### 3 pestañas (tabs)

| Tab | Archivo de datos | Filtros |
|-----|------------------|---------|
| **Materiales** | API `materialesService.js` | Por nombre, estado, tipo de material |
| **Productos** | API `productosApiService.js` | Por nombre, estado, categoría |
| **Abastecimiento** | Hook `useAbastecimiento.js` | Por estado (cliente-side) |

### Componentes internos

#### TablaSection (reutilizable)
Renderiza: tarjetas de estadísticas → filtros → tabla.

Props:
- `items` — datos a mostrar
- `columns` — nombres de columna
- `renderRow` — función que dibuja cada fila
- `statConfig` — función que calcula las tarjetas de stats
- `filters` / `onFiltersChange` — estado y setter de filtros
- `statusOptions` — opciones del dropdown de estado (opcional)

#### StockBar
Barra de progreso visual del stock (verde si ok, naranja si cerca del mínimo, rojo si en 0).

#### useDebounce
Hook que retrasa llamadas API 500ms al escribir búsqueda.

### Filtros

- **Estado**: dropdown dinámico — para materiales/productos muestra Disponible/Agotado/Eliminado; para abastecimiento muestra Pendiente/Completado/Cancelado
- **Categoría**: dropdown (solo materiales/productos)
- **Búsqueda**: input de texto con debounce

Los filtros de materiales y productos se envían al backend via `useEffect`. El filtro de abastecimiento se aplica del lado del cliente con `useMemo`.

### Handlers

| Handler | Acción |
|---------|--------|
| `handleCompletarAbastecimiento` | Confirma y completa un abastecimiento (actualiza stock) |
| `handleCancelarAbastecimiento` | Confirma y cancela un abastecimiento |
| `handleSaveMaterial` | Crea o actualiza un material |
| `handleSaveProduct` | Crea o actualiza un producto |

---

## RegisterMaterial.jsx — Formulario de Materiales

### Campos

| Campo | Tipo | Validaciones HTML | Validaciones JS |
|-------|------|-------------------|-----------------|
| Nombre | text | `maxLength="50"` | Requerido, min 3, max 50, solo letras |
| Tipo de material | select | Opciones fijas | Requerido |
| Unidad de medida | text | `maxLength="20"` | Max 20, solo letras/puntos/comas |
| Stock mínimo | text numeric | `maxLength="3"` (max 300) | Solo dígitos, no negativo, máx 300 |

### Modos
- **Crear**: botón "Guardar Material"
- **Editar**: botón "Guardar Cambios" + valida que haya cambios reales

---

## RegisterProducto.jsx — Formulario de Productos

### Campos

| Campo | Tipo | Validaciones HTML | Validaciones JS |
|-------|------|-------------------|-----------------|
| Nombre | text | `maxLength="70"` | Requerido, min 3, max 70, solo letras |
| Tipo de prenda | select | Opciones fijas | — |
| Categoría | select | Opciones fijas | — |
| Género | select | F/M/U | — |
| Talla | text | `maxLength="10"` | Max 10 caracteres |
| Precio de venta | text decimal | `maxLength="15"` | Requerido, formato decimal, > 0, máx $999,999,999,999 |
| Stock mínimo | text numeric | `maxLength="3"` (max 300) | Solo dígitos, no negativo, máx 300 |

### Modos
- **Crear**: botón "Guardar Producto"
- **Editar**: botón "Guardar Cambios" + valida que haya cambios reales

---

## RegisterAbastecimiento.jsx — Formulario de Abastecimiento

### Campos del encabezado

| Campo | Tipo | Validación |
|-------|------|------------|
| Proveedor | select | Requerido + válido en la lista |

### Campos de ítems dinámicos

Cada abastecimiento tiene 1 o más ítems. Cada ítem tiene:

| Campo | Tipo | Validaciones |
|-------|------|-------------|
| Tipo | select | Material o Producto |
| Referencia | autocomplete | Requerido (seleccionar de lista) |
| Cantidad | text numeric | Requerido, solo dígitos, > 0, máx 100, `maxLength="3"` |
| Costo unitario | text decimal | Formato 0.00, no negativo, máx $999,999,999,999 |

### Funcionalidades
- **Agregar ítem**: botón "+" agrega una fila nueva
- **Quitar ítem**: botón de papelera (solo si hay más de 1)
- **Autocomplete**: busca materiales/productos de la API mientras escribes

---

## Servidor Express (eliminado del repo)

El backend real está configurado via `VITE_API_URL`. La carpeta `server/` que estaba en el repo era un mock local de prueba y fue eliminada.

---

## Flujo de cambio de estado (Abastecimiento)

```
Botón en tabla (Completar / Cancelar)
  → Confirmación (Alert)
    → Hook useAbastecimiento.js
      → API service (PATCH)
        → Backend real actualiza en BD
```

---

## Validaciones generales

- Todos los inputs numéricos usan `type="text"` + `inputMode="numeric"` + `maxLength` para que el navegador corte al límite de caracteres
- `maxLength` evita que al mantener presionada una tecla se acumulen dígitos infinitos
- Las validaciones se ejecutan tanto en HTML (atributos `maxLength`) como en JS (función `validate()`)
- En modo edición, si no hay cambios, muestra "No se detectaron cambios para guardar" y bloquea el envío

---

## Rutas

| Ruta | Componente |
|------|-----------|
| `/inventario` | InventarioPage (default materiales) |
| `/inventario/materiales` | InventarioPage tipo="materiales" |
| `/inventario/productos` | InventarioPage tipo="productos" |
| `/inventario/abastecimiento` | InventarioPage tipo="abastecimiento" |
