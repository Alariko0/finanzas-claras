# FinanzasClaras 🏛️

> Aplicación web (React + Express + Supabase) que democratiza el acceso a herramientas financieras y fiscales complejas en España

API: [`server/README.md`](server/README.md)

---

## 📖 Documentación de Diseño

### Design System: Esmeralda Clarity

#### Paleta de Colores Exacta (Hex)

**Colores Primarios:**
- `primary`: `#00694c` - Verde Esmeralda autoritario
- `primary-container`: `#008560` - Variante primario
- `primary-fixed`: `#86f8c9` - Estado fijo primario
- `primary-fixed-dim`: `#68dbae` - Variante oscura primario

**Colores Secundarios:**
- `secondary`: `#3e6655` - Verde secundario
- `secondary-container`: `#bdead3` - Contenedor secundario
- `secondary-fixed`: `#c0ecd6` - Estado fijo secundario
- `secondary-fixed-dim`: `#a5d0ba` - Variante oscura secundario

**Colores Terciarios:**
- `tertiary`: `#993f3a` - Rojo/Terciario (usar para advertencias)
- `tertiary-container`: `#b85751` - Contenedor terciario
- `tertiary-fixed`: `#ffdad6` - Estado fijo terciario
- `tertiary-fixed-dim`: `#ffb3ad` - Variante oscura terciario

**Paleta Neutros ("Cloud" System):**
- `surface`: `#f8f9fa` - Base principal
- `surface-bright`: `#f8f9fa` - Resaltado táctico
- `surface-container`: `#edeeef` - Contenedor principal
- `surface-container-high`: `#e7e8e9` - Contenedor alto
- `surface-container-highest`: `#e1e3e4` - Contenedor más alto (inputs)
- `surface-container-low`: `#f3f4f5` - Contenedor bajo
- `surface-container-lowest`: `#ffffff` - Blanco puro (focus cards)
- `surface-dim`: `#d9dadb` - Superficie oscurecida
- `surface-variant`: `#e1e3e4` - Variante de superficie
- `background`: `#f8f9fa` - Fondo general
- `on-background`: `#191c1d` - Texto sobre fondo
- `on-surface`: `#191c1d` - Texto sobre superficie
- `on-surface-variant`: `#3d4943` - Texto variante

**Colores de Error/Éxito:**
- `error`: `#ba1a1a` - Rojo error
- `error-container`: `#ffdad6` - Contenedor error
- `on-error`: `#ffffff` - Texto error
- `on-error-container`: `#93000a` - Texto contenedor error
- `primary-fixed-dim`: `#68dbae` - Estado éxito (no usar verde brillante genérico)

#### Tipografía

**Headlines y Display (Manrope):**
- Fuente: `Manrope` (geométrica, high-character)
- Uso: Títulos grandes, números importantes, secciones
- Hierarchy: `display-lg`, `headline-md` para big numbers
- Letter-spacing: `-0.05em` para titulares (estilo editorial)
- Case: Often All-Caps para autoridad financiera

**Body y Labels (Inter):**
- Fuente: `Inter` (workhorse de legibilidad)
- Uso: Todos los datos transaccionales y descripciones
- Hierarchy: `body-md`, `label-sm`
- Asegura legibilidad máxima incluso en móvil

**Escala Tipográfica:**
- Radical scale jump entre display y body text
- Pair `headline-sm` en Emerald con `body-md` para guiar el ojo

#### Componentes Reutilizables

**Cards (The Core Molecule):**
- Estilos: Sin bordes
- Corner radius: `md` (0.75rem) o `lg` (1rem)
- Separación: Usar `spacing-4` (1rem) o cambiar de fondo
- Prohíbe dividers (usar gaps o tonal shifts)

**Buttons:**
- **Primary:** Gradient fill (`primary` → `primary-container`), white text, `full` (9999px) roundedness
- **Secondary:** `secondary-container` background con `on-secondary-container` text, sin border
- Hover: Añadir `box-shadow` glow usando `primary` token

**Input Fields:**
- Background: `surface-container-highest` (#e1e3e4)
- Forma: Bottom-only radius (`sm` 0.25rem)
- Interaction: On focus, background shifts to `surface-container-lowest` (#ffffff)
- Accent: Bottom "accent line" de 2px en `primary` color on focus

**The "Balance Totem":**
- Componente grande con `display-lg` para balances principales
- Usar `on-primary-fixed-variant` para commanding attention

**Transaction Chips:**
- Tiny, pill-shaped `surface-variant` containers
- `label-sm` text para categorizar sin clutar

**Data Visualization:**
- Charts: `primary` (#00694c) para crecimiento, `tertiary` (#993f3a) para gastos
- Simplicity: "Area" charts con gradient fade hacia baseline

#### Elevation & Depth: Tonal Layering

**The Layering Principle:**
- Base layer: `surface` (#f8f9fa)
- Secondary: `surface-container-low` (#f3f4f5) para sidebars
- Focus: `surface-container-lowest` (#ffffff) para data pop-forward

**The "Glass & Gradient" Rule:**
- Glassmorphism: `surface-container-lowest` (80% opacity) + `20px` backdrop-blur
- Signature texture: Linear gradient primary → primary-container at 135°

**Ambient Shadows:**
- Blur: `24px`, offset: `y: 8px`
- Color: `on-surface` at 6% opacity
- Never use `#000000` shadow

**The "Ghost Border" Fallback:**
- `outline-variant` at 20% opacity for form inputs
- Never use 100% opaque borders

#### Spacing Scale

- Base unit: `spacing-1` = 1rem (16px)
- Scale factor: 2x
- Values: 1rem, 2rem, 3rem, 4rem, 6rem, 8rem, 12rem, etc.

#### Do's and Don'ts

**Do:**
- Usar márgenes asimétricos para premium editorial look
- Usar `primary-fixed-dim` (#68dbae) para success states
- Dejar "breathable" white space
- Embrace the "Glow" con orange/emerald

**Don't:**
- Ever use `#000000` shadow
- Use 1px dividers to separate list items (use 4px gap or surface shifts)
- Use "Alert Red" (#ba1a1a) for everything → use `tertiary` (#993f3a) for warnings
- Use 1px solid borders (use tonal shifts instead)

---

## 🏗️ Arquitectura del Proyecto

```
finanzas-claras/
├── client/                    ← React + Vite (solo UI y Supabase Auth)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            ← React Router con todas las rutas
│       ├── context/           ← AuthContext (sesión de Supabase)
│       ├── components/        ← Navbar, RutaProtegida
│       ├── pages/             ← una por pantalla (.jsx + .css)
│       ├── styles/global.css  ← variables CSS del Design System
│       └── utils/             ← api.js (cliente de la API), supabase.js
├── server/                    ← Express (CommonJS) sobre Supabase
│   ├── app.js / index.js      ← app testeable / arranque
│   ├── config/                ← cliente de Supabase
│   ├── middleware/            ← auth (JWT de Supabase), validación, rate limit
│   ├── controllers/ routes/   ← endpoints
│   ├── services/fiscal/       ← motor fiscal puro: datos 2026 con fuente, escalas, mínimos, liquidación IRPF
│   │                            (los préstamos llegan en la fase 4)
│   └── tests/                 ← Jest + Supertest
└── supabase/migrations/       ← esquema y políticas RLS versionados
```

---

## 📱 Módulos y Jerarquía

### Grupo A — Núcleo Fiscal
- **Lógica Fiscal IRPF 2026** - Cálculo de impuestos progresivo + autonómico, con datos y fuente oficial por comunidad
- **Calculadora de Nómina** - Desglose visual de retenciones y Seguridad Social

### Grupo B — Gastos
- **Análisis de Gastos Familiares** - Gestión de gastos compartidos
- **Presupuestos y Ahorro** - Planificación financiera personal

### Grupo C — Hipotecas y Préstamos
- **Simulador de Hipotecas Pro** - Cuota mensual, TAE, amortización
- **Préstamos Personales** - Cálculo de pagos y condiciones
- **Simulador de Amortización Anticipada** - Ganancias y pérdidas financieras
- **Lógica de Amortización** - Referencia técnica para cálculos

### Grupo D — Inversión
- **Gestión de Inversiones** - Portafolio completo
- **Simulador Inversión Inmobiliaria** - ROI de propiedades
- **Simulador Inversión Mobiliaria** - Escala del ahorro vigente
- **Detalle de Activo** - Análisis de activos individuales

### Grupo E — Planificación
- **Planificación de Jubilación** - Proyecciones a largo plazo
- **Plan de Pensiones** - Planes de pensión complementarios
- **Dashboard de Patrimonio** - Vista consolidada

### Grupo F — Viajes
- **Simulador de Viajes** - Presupuestos y costos
- **Lógica de Liquidación** - Referencia para cálculos de viajes

### Grupo G — Cuenta y Configuración
- **Crear Cuenta** - Registro inicial
- **Configuración de Perfil** - Preferencias y seguridad
- **Historial de Cálculos** - Guarda y compara cálculos
- **Personalizar Módulos** - Configuración de módulos
- **Notificaciones y Alertas** - Gestión de notificaciones

### Grupo H — Asistente
- **Asistente Fiscal** - Respuestas a dudas fiscales basadas en reglas, con fuente oficial

---

## 🎨 Flujo de Navegación

**Navbar Categorías:**
1. **Fiscal** - IRPF + Nómina
2. **Gastos** - Gastos compartidos + Presupuesto
3. **Hipotecas** - Simuladores de préstamos
4. **Inversión** - Gestión de portafolio
5. **Jubilación** - Planes a largo plazo
6. **Viajes** - Gestión de viajes en grupo
7. **Cuenta** - Perfil, historial, configuración

---

## 📋 Requisitos del MVP

- [x] Autenticación (Supabase Auth) y esquema con RLS
- [x] API base: cálculos guardados, perfil, rate limits, health
- [ ] Motor fiscal en servidor: IRPF, nómina, ahorro _(en curso: datos 2026 y liquidación del IRPF hechos; faltan retención, nómina, ahorro y endpoints)_
- [ ] Hipotecas, préstamos y amortización con TAE
- [ ] Conectar las calculadoras con el historial
- [ ] Inversión, jubilación, patrimonio, gastos, viajes y notificaciones reales
- [ ] Asistente fiscal con contenido verificado

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + Vite + React Router DOM
- **Estilos:** CSS nativo con variables del Design System
- **Backend:** Node.js + Express (CommonJS)
- **Base de datos y Auth:** Supabase (Postgres + Auth + RLS)
- **Tests:** Jest + Supertest (server), Vitest (client)
- **Paquetes:** pnpm

---

## 🚀 Comienzo Rápido

### 1. Supabase

La base de datos y la autenticación están en Supabase (no hay MongoDB ni login propio).

1. Crea un proyecto en [supabase.com](https://supabase.com) y copia la **URL** y la **clave publishable** (`sb_publishable_…`) desde *Settings > API*.
2. Aplica el esquema: ejecuta en orden los archivos de `supabase/migrations/` (con el CLI de Supabase o desde el editor SQL). Crean las tablas y las políticas RLS (`user_id = auth.uid()`).
3. En *Authentication* deja activada la confirmación de correo. Con el SMTP por defecto de Supabase el límite de correos es bajo: en producción configura uno propio.

### 2. Instalación y variables

```bash
cd server && pnpm install
cd ../client && pnpm install

# Copia los ejemplos y rellena la URL y la clave publishable (nunca subas .env)
cp server/.env.example server/.env
cp client/.env.example client/.env
```

El servidor no usa la clave de servicio (`service_role`): consulta la base con el token del usuario.

### 3. Desarrollo (dos terminales)

```bash
cd server && pnpm dev     # http://localhost:3001
cd client && pnpm dev     # http://localhost:3000
```

### 4. Tests y build

```bash
cd server && pnpm test && pnpm lint
cd client && pnpm build
```

---

## 📄 Licencia

Propietario - Alariko0 © 2026
