# FinanzasClaras 🏛️

> Aplicación MERN que democratiza el acceso a herramientas financieras y fiscales complejas en España

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
├── client/                    ← React + Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            ← React Router con todas las rutas
│       ├── styles/
│       │   └── global.css     ← variables CSS del Design System
│       ├── components/
│       │   └── Navbar.jsx     ← navegación con categorías
│       ├── pages/             ← una por pantalla de Stitch
│       └── utils/             ← lógica fiscal pura separada del UI
└── server/                    ← Node.js + Express + MongoDB
    ├── index.js
    ├── package.json
    ├── .env.example
    ├── models/
    ├── controllers/
    └── routes/
```

---

## 📱 Módulos y Jerarquía

### Grupo A — Núcleo Fiscal
- **Lógica Fiscal IRPF 2025** - Cálculo de impuestos progresivo + autonómico
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
- **Simulador Inversión Mobiliaria** - Tramos 2025
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

### Grupo H — IA y Sistema
- **Asistente de IA Fiscal** - Chatbot especializado en dudas fiscales
- **Estructura Backend MERN** - Referencia técnica

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

### Fase 1: Módulos Core
- [ ] Módulo de Gastos Compartidos
- [ ] Calculadora IRPF 2025 (tramos + autonómico)
- [ ] Calculadora de Nómina con desglose visual

### Fase 2: Backend & Persistencia
- [ ] Node.js + Express + MongoDB
- [ ] Hipotecas con TAE y amortización
- [ ] Viajes en grupo con divisas
- [ ] Enlaces compartibles para cálculos

### Fase 3: Ecosistema Avanzado
- [ ] Autenticación JWT
- [ ] Historial de cálculos guardados
- [ ] Asistente IA fiscal

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + Vite
- **Routing:** React Router DOM
- **Estilos:** CSS nativo con variables del Design System
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (preparado para Fase 3)
- **Charts:** CSS-based charts (no librerías externas)

---

## 🚀 Comienzo Rápido

```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Construcción
npm run build
```

---

## 📄 Licencia

Propietario - Alariko0 © 2026
