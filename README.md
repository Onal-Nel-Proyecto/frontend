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
| `Vite` | Bundler y dev server |

---

## 🚀 Instalación

```bash
cd frontend
npm install
```

### Variables de entorno

Crear archivo `.env` en la raíz de `/frontend`:

```env
VITE_API_URL=http://localhost:3000/
```

### Ejecutar

```bash
npm run dev      # Desarrollo (hot reload)
npm run build    # Build producción → /dist
npm run preview  # Preview del build
```

---

## 📁 Estructura

```
src/
├── api/
│   ├── axiosInstance.js       # Axios + interceptor de refresh automático
│   └── endpoints/             # Funciones por módulo (auth, dashboard, pedidos)
├── App.jsx                    # BrowserRouter + Routes
├── assets/
│   ├── font/                  # Tipografía Inter
│   └── styles/                # variables.css, global.css, fonts.css
├── components/
│   ├── common/                # Card, Button, Input (reutilizables)
│   └── ui/
│       ├── feedback/          # Alert, InConstruction, LoadingPages
│       ├── Header/            # Header, NavTabs, UserDropdown, NotificationsDropdown
│       └── Sidebar/           # Sidebar (oculta opciones según rol)
├── features/
│   ├── auth/                  # Login, formulario, hook useAuth, servicios
│   └── pedidos/               # (en desarrollo)
├── hooks/                     # useDocumentTitle
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
| `/config` | Config | Categorías, Medidas, Copia seguridad |
| `/config/categorias` | InConstruction | Categorías |
| `/config/copia-seguridad` | InConstruction | Backups |
| `/config/medidas` | InConstruction | Medidas |

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

### Alert (`components/ui/feedback/Alert`)
Modal de feedback con tres variantes:

```jsx
<Alert type="success" title="Éxito" message="Operación completada" onClose={fn} />
<Alert type="error" title="Error" message="Algo salió mal" onClose={fn} />
<Alert type="confirm" title="¿Confirmar?" message="¿Estás seguro?" onConfirm={fn} onCancel={fn} />
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
