# AGENTS.md — FinanzasClaras

> Guía para agentes de código operando en este repositorio.

## Visión General

Monorepo MERN (MongoDB, Express, React, Node.js) — aplicación financiera/fiscal para España. Dos paquetes independientes:

| Paquete | Stack | Puerto |
|---------|-------|--------|
| `client/` | React 18 + Vite + React Router DOM | 3000 |
| `server/` | Express + Supabase + JWT | 3001 |

## Comandos de Desarrollo

### Client (`client/`)
```bash
cd client && npm install        # Instalar dependencias
cd client && npm run dev        # Dev server (Vite, puerto 3000)
cd client && npm run build      # Build producción → dist/
cd client && npm run preview    # Preview del build
```

### Server (`server/`)
```bash
cd server && npm install        # Instalar dependencias
cd server && npm run dev        # Dev con nodemon (puerto 3001)
cd server && npm start          # Producción
cd server && npm run lint       # ESLint
```

### Variables de Entorno (server)
Crear `.env` desde `.env.example` en `server/` y `client/`. Server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS`. Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca subir `.env`.

### Tests
**No hay framework de tests configurado.** Si se añaden, usar Vitest para client y Jest/Supertest para server.

## Convenciones de Código

### Módulo: ESM vs CommonJS
- **Client**: ESM (`import` / `export`) — archivos `.jsx`
- **Server**: CommonJS (`require` / `module.exports`) — archivos `.js`
- **No mezclar** — seguir el patrón del paquete en el que se trabaja.

### Formato
- Indentación: **2 espacios**
- Comillas: **simples** (`'string'`)
- Punto y coma: **omitido** (estilo actual del codebase)
- JSX: paréntesis en retornos multilínea
- Sin Prettier configurado — seguir estilo existente en archivos adyacentes.

### Nombrado
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `Navbar.jsx`, `IRPF.jsx` |
| Páginas | PascalCase (noun) | `SimuladorHipotecas.jsx` |
| Modelos Mongoose | PascalCase | `Usuario.js`, `Calculo.js` |
| Rutas/Middleware | camelCase | `auth.js`, `calculos.js` |
| Utilidades (utils/) | camelCase | funciones puras |
| Variables/funciones | camelCase (español) | `usuarioExistente`, `comparePassword` |

### CSS / Design System
- **Sin frameworks CSS** — CSS nativo con variables custom properties.
- Design System: **"Esmeralda Clarity"** — definido en `client/src/styles/global.css`.
- Usar variables CSS (`--primary`, `--surface-container`, `--spacing-4`, etc.) — nunca hardcodear colores.
- Cada página tiene su `.css` emparejado (`SimuladorHipotecas.jsx` → `SimuladorHipotecas.css`).
- Fuentes: **Manrope** (headings), **Inter** (body).

### Estructura de Respuestas API (server)
```js
{ success: true/false, message: '...', data?: ..., error?: ... }
```

### Manejo de Errores
- **Server**: try/catch en cada route handler → `console.error` + `res.status(500).json(...)`.
- Error middleware global en `server/index.js` (último middleware).
- **Client**: sin sistema centralizado — manejo local por componente.

## Arquitectura

```
finanzas-claras/
├── client/
│   ├── src/
│   │   ├── main.jsx              ← Entry point
│   │   ├── App.jsx               ← React Router (todas las rutas)
│   │   ├── components/           ← Componentes reutilizables (Navbar)
│   │   ├── pages/                ← Una por pantalla (.jsx + .css pareados)
│   │   ├── styles/global.css     ← Design System + utilidades
│   │   └── utils/                ← Lógica fiscal pura (separada del UI)
│   └── vite.config.js            ← Proxy /api → localhost:3001
├── server/
│   ├── index.js                  ← Entry point + middleware global
│   ├── routes/                   ← Endpoints (auth, calculos, irpf, nomina...)
│   ├── models/                   ← Mongoose schemas
│   └── middleware/auth.js        ← JWT authentication
└── README.md                     ← Documentación completa del diseño
```

## Reglas Críticas

1. **No suprimir errores de tipo** con `as any` (no hay TS, pero aplicar equivalente: no silenciar errores).
2. **No hacer commit** salvo petición explícita del usuario.
3. **Seguir patrones existentes** — el codebase tiene estilo disciplinado.
4. **Lógica fiscal en `utils/`** — separar cálculos puros del UI.
5. **Nunca hardcodear colores** — usar variables del Design System.
6. **Server: CommonJS** | **Client: ESM** — no confundir.
7. **Sin tests configurados** — no asumir que existen.

## Cursor / Copilot Rules

No se encontraron `.cursorrules`, `.cursor/rules/`, ni `.github/copilot-instructions.md`.
