# 🧵 Onal & Nel — Frontend

SPA moderna para la gestión textil. Construida con **React 19 + Vite 8**.

---

## 📦 Stack

| Dependencia | Propósito |
|-------------|-----------|
| `react` + `react-dom` | UI |
| `react-router-dom` | Enrutamiento SPA |
| `axios` | HTTP client con interceptor de refresh |
| `framer-motion` | Animaciones |
| `react-icons` | Iconos (Feather Icons) |
| `react-hook-form` | Manejo de formularios |
| `react-toastify` | Notificaciones toast |
| `socket.io-client` | WebSockets (notificaciones en tiempo real) |
| `Vite` | Bundler y dev server |

---

## 🚀 Instalación

```bash
cd frontend
pnpm install
```

> El proyecto usa **pnpm** como gestor de paquetes. Si no lo tenés instalado:
> ```bash
> npm install -g pnpm
> ```

### Variables de entorno

Crear archivo `.env` en la raíz de `/frontend`:

```env
VITE_API_URL=http://localhost:3000/
```

### Ejecutar

```bash
pnpm dev        # Desarrollo (hot reload)
pnpm build      # Build producción → /dist
pnpm preview    # Preview del build
pnpm lint       # ESLint
```

---

## 📁 Estructura

```
src/
├── api/
│   ├── axiosInstance.js       # Axios + interceptor de refresh automático
│   ├── clientesService.js     # CRUD y búsqueda de clientes
│   ├── ventasService.js       # Reportes de ventas + exportación PDF/Excel
│   └── endpoints/             # Funciones por módulo (auth, clientes, pedidos, ventas…)
├── App.jsx                    # BrowserRouter + Routes
├── assets/
│   ├── font/                  # Tipografía Inter
│   └── styles/                # variables.css, global.css, fonts.css
├── components/
│   ├── common/                # Card, Button, Drawer, Input (reutilizables)
│   └── ui/
│       ├── feedback/          # Alert, InConstruction, LoadingOverlay, LoadingPages
│       ├── Header/            # Header, NavTabs, UserDropdown, NotificationsDropdown
│       └── Sidebar/           # Sidebar (oculta opciones según rol)
├── data/
│   └── productosMock.js       # Datos mock para buscar productos como plantilla
├── features/
│   ├── auth/                  # Login, formulario, hook useAuth, servicios
│   ├── pedidos/
│   │   ├── components/
│   │   │   ├── ClienteSearch/     # Buscador tipo YouTube para clientes
│   │   │   ├── DetallePanel/      # Drawer ver/crear/editar detalle + plantilla productos
│   │   │   ├── DetallePedido/     # Tabla de detalle del pedido
│   │   │   ├── Pagos/             # Gestión de pagos
│   │   │   ├── PedidoForm/        # Drawer crear/editar pedido
│   │   │   ├── Produccion/        # Cards de producción
│   │   │   ├── ProduccionForm/    # Iniciar producción
│   │   │   ├── ProductoSearch/    # Buscador tipo YouTube para productos (plantilla)
│   │   │   └── TablaPedidos/      # Listado principal de pedidos
│   │   ├── pages/
│   │   │   ├── Dashboard/         # (en desarrollo)
│   │   │   ├── Pedidos/           # Layout con tabs (Detalle, Producción, Pagos)
│   │   │   └── PedidoSeleccionado/# Detalle completo de un pedido
│   │   └── services/
│   │       └── pedidosService.js  # API de pedidos
│   └── ventas/
│       └── pages/
│           └── Reportes/      # Reportes de ventas con gráfico, tabla y exportación
├── hooks/                     # useDocumentTitle, useAlertas
├── layout/
│   └── MainLayout/            # Layout principal (Header + Sidebar + NavTabs)
├── main.jsx                   # Entry point
├── page/                      # Páginas del sistema
├── routes/                    # AppRouter, PrivateRoute, PublicRoute, AdminRoute
└── utils/                     # session.js (getStoredUser, isAdmin)
```

---

## 🧭 Rutas

### Públicas
| Ruta | Componente |
|------|-----------|
| `/login` | Login |

### Privadas (requieren inicio de sesión)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | Home | Dashboard con KPIs, gráficos, stock |
| `/pedidos` | Pedidos | Listado de pedidos con búsqueda |
| `/pedidos/:id` | InConstruction | Detalle del pedido |
| `/pedidos/dash` | InConstruction | Dashboard de pedidos |
| `/pedidos/entregas` | InConstruction | Entregas |
| `/gestion-personal` | GestionPersonal | Clientes + Usuarios |
| `/gestion-clientes` | InConstruction | CRUD clientes |

### Solo administrador
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/gestion-usuarios` | InConstruction | CRUD usuarios |
| `/ventas/reportes` | ReportesVentas | Reportes mensuales y por período con gráficos, exportación PDF/Excel |
| `/config` | Config | Categorías, Medidas, Copia seguridad |
| `/config/categorias` | InConstruction | Categorías |
| `/config/copia-seguridad` | InConstruction | Backups |
| `/config/medidas` | InConstruction | Medidas |

---

## 📋 Funcionalidades destacadas

### Buscador tipo YouTube (reutilizable)

El patrón de **buscador con autocomplete + debounce** se implementó primero para clientes (`ClienteSearch`) y luego se reutilizó para productos (`ProductoSearch`).

Ambos comparten:
- Debounce de 300ms antes de disparar la búsqueda
- Dropdown de resultados con navegación por teclado (↑↓ Enter Escape)
- Cierre al hacer clic fuera
- Spinner de carga

### "Usar producto como plantilla" (`DetallePanel`)

En el formulario de detalle del pedido hay un botón **"Plantilla"** al lado del input de nombre del producto. Al hacer clic:

1. Se abre el buscador `ProductoSearch` inline
2. El usuario busca y selecciona un producto existente
3. Se copian los datos **sin modificar el producto original**:
   - Nombre, precio, categoría, tipo de prenda, género y talla
   - ❌ Las **medidas** no se copian (pertenecen al pedido, no al producto)
   - ❌ IDs, fechas y estados tampoco
4. El formulario queda listo para editar los valores libremente
5. Aparece una alerta de confirmación sin cerrar el formulario

### Reportes de Ventas (`features/ventas/pages/Reportes`)

Vista de reportes con datos reales del backend, dos modalidades de filtro:

| Filtro | Endpoint | Parámetros |
|--------|----------|------------|
| **Mensual** | `GET /ventas/reportes/mensual` | `mes` (1-12), `anio` |
| **Período** | `GET /ventas/reportes/periodo` | `fechaInicio`, `fechaFin` |

**Componentes de la vista:**
- **Cards resumen**: Número de ventas, total vendido, ticket promedio y producto más vendido (formato monetario COP)
- **Gráfico de barras**: Comportamiento de ventas por día (CSS puro, sin librería externa)
- **Tabla**: Top productos más vendidos con cantidad y total generado
- **Exportación**: Botones para descargar el reporte en PDF o Excel

**Estados implementados:**
- `loading` → spinner mientras se consulta el backend
- `error` → mensaje amigable con errores del backend (valida `status: false` y key `error`)
- `empty` → "No se encontraron ventas para el período seleccionado."
- `initial` → estado inicial antes de generar cualquier reporte

**Mapeo dinámico de fechas:**
- Reporte mensual: el backend retorna `dia` (número) → se muestra como `DD/MM` con el mes seleccionado
- Reporte por período: el backend retorna `fecha` (YYYY-MM-DD) → se muestra como `DD/MM`

### Datos mock (`data/productosMock.js`)

Mientras se terminan los endpoints del backend, los datos de productos se cargan desde un archivo mock:

```js
import { buscarProductosMock } from '../../data/productosMock';

const resultados = buscarProductosMock('camisa');
// → filtra por nombre, tipo_prenda, categoría o género
```

---

## 🔐 Autenticación

El login almacena los datos del usuario en `sessionStorage` con clave `user`:
```json
{ "user_id": "...", "nombres": "...", "apellidos": "...", "rol": "ADMINISTRADOR" }
```

**Helpers** (`utils/session.js`):
- `getStoredUser()` → obtiene el usuario
- `isAdmin()` → `true` si el rol es `ADMINISTRADOR`

### Flujo de refresh automático
1. El interceptor de Axios captura errores `401`
2. Intenta `POST /auth/refresh` (cookie `refreshToken`)
3. Si falla el refresh → limpia `sessionStorage` y redirige a `/login` vía React Router
4. Si hay múltiples peticiones concurrentes en 401, se encolan y reintentan tras el refresh

---

## 🧩 Componentes principales

### Card (`components/common/Card`)
Componente reutilizable con fondo blanco, blur, sombra y hover elevado.

```jsx
<Card className="mi-estilo" onClick={fn}>
  contenido
</Card>
```

### Drawer (`components/common/Drawer`)
Panel deslizable desde la derecha. Header y footer fijos, solo el body scrolea.

```jsx
<Drawer
  isOpen={visible}
  onClose={() => setVisible(false)}
  title="Título"
  subtitle="Subtítulo opcional"
  icon={<FiShoppingBag />}
  footer={<button onClick={handleSubmit}>Guardar</button>}
>
  contenido del formulario
</Drawer>
```

### Alert (`components/ui/feedback/Alert`)
Modal de feedback con tres variantes:

```jsx
<Alert type="success" title="Éxito" message="Operación completada" onClose={fn} />
<Alert type="error" title="Error" message="Algo salió mal" onClose={fn} />
<Alert type="confirm" title="¿Confirmar?" message="¿Estás seguro?" onConfirm={fn} onCancel={fn} />
```

### ClienteSearch (`features/pedidos/components/ClienteSearch`)
Buscador tipo YouTube para clientes con debounce de 300ms.

- Escribís nombre/apellido y muestra resultados en un dropdown
- Navegación por teclado (↑↓ Enter Escape)
- Último item siempre es **"Cliente por defecto"** (id 9999999999)
- Botón `+` para agregar nuevo cliente

```jsx
<ClienteSearch
  initialNombre=""
  onChange={({ cliente_id, cliente_nombre, cliente_apellido }) => {}}
  error=""
  onAddCliente={() => navigate('/nuevo-cliente')}
/>
```

### ProductoSearch (`features/pedidos/components/ProductoSearch`)
Buscador tipo YouTube para productos, reutiliza el patrón de `ClienteSearch`.

- Mismo comportamiento: debounce, dropdown, teclado
- Cada resultado muestra nombre, tipo de prenda, talla, precio y género
- Se usa en `DetallePanel` para la funcionalidad **"Usar como plantilla"**

```jsx
<ProductoSearch
  onSelect={(producto) => {
    // producto tiene: nombre, precio, tipo_prenda, talla, genero, categoria_id, medidas
  }}
  onClose={() => setShow(false)}
/>
```

### NavTabs
Barra de navegación secundaria contextual:
- **Escritorio**: dentro del header, centrado
- **Móvil**: barra inferior fija con iconos

### UserDropdown
Menú de usuario al hacer clic en el icono de perfil. Muestra nombre, rol y botón de cerrar sesión.

---

## 🎨 Estilos

El proyecto usa **CSS Modules** y variables globales en `assets/styles/variables.css`:

| Variable | Valor |
|----------|-------|
| `--color-primary` | `#E9D7D3` |
| `--text-dark` | `#3b3b3b` |
| `--text-soft` | `#6b7280` |
| `--main-bg` | `#f8f5f4` |
| `--sidebar-bg` | `#f3e4e1` |

---

## 📄 Licencia

ISC — Proyecto Onal & Nel.
