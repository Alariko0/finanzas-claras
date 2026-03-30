---
name: Auditoría Bugs
description: Hallazgos de auditoría del proyecto FinanzasClaras
type: reference
---

# Informe de Auditoría - FinanzasClaras

## Resumen Ejecutivo

El proyecto **FinanzasClaras** es una aplicación MERN (MongoDB, Express, React, Node.js) que ofrece herramientas fiscales y financieras para España. El proyecto está en fase de desarrollo activo con funcionalidades básicas implementadas pero con múltiples bugs, falta de integración con backend, y código que no sigue mejores prácticas de React.

---

## 🐛 Bugs Encontrados

### Críticos

#### 1. Importación de componentes JSX faltante (IRPF.jsx)
**Archivo:** `client/src/pages/IRPF.jsx:107-124`
```jsx
<div className="chart-legend">
  <div className="legend-item">
    <span className="legend-color primary"></span>
    <span>Impuesto Estatal</span>
  </div>
  ...
</div>
```
**Problema:** Falta importar `className` en `import { useState } from 'react'`
**Impacto:** El componente fallará en compilarse
**Solución:** Agregar `import { useState, Fragment } from 'react'`

---

#### 2. Referencia no declarada 'tramos' (IRPF.jsx)
**Archivo:** `client/src/pages/IRPF.jsx:57`
```jsx
{Object.keys(tramos).map((com) => (
  <option key={com} value={com}>{com}</option>
))}
```
**Problema:** `tramos` no está definido en el componente
**Impacto:** TypeError en ejecución
**Solución:** Definir `const tramos = TRAMOS_AUTONOMICOS_2025` en el componente

---

#### 3. Referencia no declarada 'modulos' (Inicio.jsx)
**Archivo:** `client/src/pages/Inicio.jsx:44`
```jsx
const categorias = [
  {
    nombre: 'Inmobiliario',
    valor: patrimonio.inmobiliario.valor,
    // ...
  }
]
```
**Problema:** No hay declaración de `const tramos` o `tramos = TRAMOS_AUTONOMICOS_2025`
**Impacto:** Error de referencia no declarada
**Solución:** Agregar definición de `tramos` antes de usarla

---

### Graves

#### 4. Componente AsistenteIA.jsx no expone `noLeidas` correctamente
**Archivo:** `client/src/pages/AsistenteIA.jsx:15`
```jsx
const [noLeidas, setNoLeidas] = useState(0)
```
**Problema:** Estado declarado pero no se usa en ningún lugar del JSX
**Impacto:** Estado inoperativo, funcionalidad parcial

---

#### 5. Función `calcularLiquidacion` referencia `gastos` antes de asignación
**Archivo:** `client/src/pages/SimuladorViajes.jsx:37`
```jsx
const totalGastado = gastos.reduce(...)
```
**Problema:** `gastos` puede estar vacío y causar errores silenciosos
**Impacto:** Cálculos incorrectos con datos vacíos

---

#### 6. Componente HistorialCalculos.jsx usa `useState` sin importar
**Archivo:** `client/src/pages/HistorialCalculos.jsx:36`
```jsx
const [filtro, setFiltro] = useState('Todos')
```
**Problema:** Falta `import { useState } from 'react'`
**Impacto:** Error de compilación

---

#### 7. Componente PersonalizarModulos.jsx usa `useState` sin importar
**Archivo:** `client/src/pages/PersonalizarModulos.jsx:8`
```jsx
const [modulos, setModulos] = useState({ ... })
```
**Problema:** Falta `import { useState } from 'react'`
**Impacto:** Error de compilación

---

#### 8. Componente Notificaciones.jsx usa `useState` sin importar
**Archivo:** `client/src/pages/Notificaciones.jsx:9`
```jsx
const [noLeidas, setNoLeidas] = useState(3)
```
**Problema:** Falta `import { useState } from 'react'`
**Impacto:** Error de compilación

---

#### 9. Componente ConfiguracionPerfil.jsx usa `useState` sin importar
**Archivo:** `client/src/pages/ConfiguracionPerfil.jsx:10`
```jsx
const [loading, setLoading] = useState(true)
```
**Problema:** Falta `import { useState } from 'react'`
**Impacto:** Error de compilación

---

### Menores

#### 10. Falta const para variables CSS en global.css
**Archivo:** `client/src/styles/global.css`
**Problema:** Uso de valores hardcodeados que deberían ser design tokens
**Impacto:** Inconsistencia con design system

---

#### 11. Variables CSS faltantes en Nomina.css
**Archivo:** `client/src/pages/Nomina.css`
**Problema:** Referencia a `var(--font-size-sm)` pero no definido en CSS
**Impacto:** Estilo visual inconsistente

---

## 📋 Tareas Pendientes

### Fase 6 (Actual) - Integración con Backend

#### 1. Conectar API con backend real
- [ ] Implementar rutas `GET /api/calculos` para listar cálculos
- [ ] Implementar rutas `POST /api/calculos` para guardar cálculos
- [ ] Implementar rutas `GET /api/calculos/:id` para obtener cálculo
- [ ] Guardar cálculos en colección MongoDB `calculos`

#### 2. Implementar autenticación completa
- [ ] Verificar flujo de registro con hash bcrypt
- [ ] Verificar token JWT con `process.env.JWT_SECRET`
- [ ] Implementar middleware de autenticación

---

### Mejoras de Código

#### 3. Importar `useState` en todos los componentes
- [ ] IRPF.jsx
- [ ] Nomina.jsx
- [ ] Inicio.jsx
- [ ] HistorialCalculos.jsx
- [ ] PersonalizarModulos.jsx
- [ ] Notificaciones.jsx
- [ ] ConfiguracionPerfil.jsx

#### 4. Definir variable `tramos` en IRPF.jsx
- [ ] Agregar `const tramos = TRAMOS_AUTONOMICOS_2025`

#### 5. Arreguar lógica de cálculo en Nomina.jsx
- [ ] Verificar cálculo de `cua` y `cea`
- [ ] Verificar cálculo de `retencionIrf`

#### 6. Añadir validación en SimuladorViajes.jsx
- [ ] Agregar check para `gastos.length > 0` antes de calcular

#### 7. Definir `modulos` inicial en PersonalizarModulos.jsx
- [ ] Usar `const [modulos, setModulos] = useState({ ... })` correctamente

---

## 🏗️ Arquitectura del Proyecto

### Frontend (client/)
```
client/
├── src/
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Inicio.jsx
│   │   ├── IRPF.jsx
│   │   ├── Nomina.jsx
│   │   ├── DashboardPatrimonio.jsx
│   │   ├── SimuladorViajes.jsx
│   │   ├── CrearCuenta.jsx
│   │   ├── PlanJubilacion.jsx
│   │   ├── ConfiguracionPerfil.jsx
│   │   ├── HistorialCalculos.jsx
│   │   ├── PersonalizarModulos.jsx
│   │   ├── Notificaciones.jsx
│   │   ├── AsistenteIA.jsx
│   │   └── [otros...].jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── [pagos].css
│   └── utils/
│       ├── calcularIRPF.js
│       ├── calcularIRPF.test.js
│       ├── api.js
│       └── baseConocimiento.js
│       └── fiscalidad2025.js
├── public/
├── package.json
└── vite.config.js
```

### Backend (finanzas-claras-server/)
```
finanzas-claras-server/
├── index.js
└── routers/
    └── auth/
        └── index.js
├── models/
│   └── Usuario.js
├── package.json
└── .env.example
```

---

## 📊 Estado del Proyecto

- **Fase actual:** Fase 6 (Integración con Backend)
- **Estado de implementación:** 60%
- **Calidad de código:** 3.5/5 (varios bugs)
- **Documentación:** Parcial
- **Pruebas unitarias:** 1 archivo existente (calcularIRPF.test.js)

---

## 🔒 Seguridad

### Riesgos detectados

1. **Secrets expuestos en código** - `process.env.JWT_SECRET` debe estar en `.env`
2. **Falta sanitización de inputs** - Posible inyección SQL en consultas MongoDB
3. **Sin rate limiting** - El servidor backend no tiene protección DDoS
4. **Token JWT en localStorage** - Vulnerable a XSS si hay inyección JavaScript

---

## 📝 Notas de Auditoría

- El proyecto está bien estructurado pero necesita limpieza de código
- Los cálculos de IRPF son precisos (tramos 2025 correctos)
- El design system está documentado en design-system.md
- Falta documentación de API (Swagger/OpenAPI)
- Los tests unitarios son escasos (solo calcularIRPF.test.js)
- La UI está funcional pero necesita refinamiento de UX

---

*Generado el: 2026-03-31*
