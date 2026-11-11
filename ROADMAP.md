# ROADMAP — FinanzasClaras
**Última actualización:** 2026-04-03  
**Estado:** Fase 1 ✅ COMPLETADA — Fase 2 ✅ COMPLETADA — Fase 3 pendiente

> Este documento es la fuente de verdad del trabajo pendiente.  
> Actualizar el estado de cada tarea al completarla.  
> Al completar una fase, actualizar también las reglas del proyecto.

---

## 🔴 FASE 1 — CRÍTICO (bloquea la app por completo)

> Nada más debe tocarse hasta completar todas estas tareas.  
> El frontend no compila. El backend crashea. Sin esto, el resto es irrelevante.

### Frontend — Bugs de compilación

- [x] **F1-01** — `Inicio.jsx`: Mover hooks `useState` de `activeTab` y `formData` dentro del componente `Inicio` ✅
  - Líneas 6-10 del archivo actual están fuera del componente
  - Resultado esperado: no más "Invalid hook call" al cargar `/`

- [x] **F1-02** — `App.jsx`: Añadir `import Inicio from './pages/Inicio'` ✅
  - El componente se usa en las rutas pero no está importado
  - Resultado esperado: no más "Inicio is not defined"

- [x] **F1-03** — `global.css`: Eliminar las etiquetas `<link>` de Google Fonts del archivo CSS ✅
  - Son HTML, no CSS — causarán errores de parseo
  - Verificar que las fuentes están en `client/index.html`. Si no, añadirlas ahí.
  - Resultado esperado: CSS válido, fuentes Manrope e Inter cargando

- [x] **F1-04** — `Nomina.jsx`: Corregir variables no declaradas ✅
  - Reemplazar todas las referencias a `salario` por `salarioMensual`
  - Declarar `const cua = calcularCua(salarioMensual)` antes del return
  - Declarar `const retencionIrf = calcularRetencionIrf()` antes del return
  - Resultado esperado: componente renderiza sin ReferenceError

- [x] **F1-05** — `SimuladorViajes.jsx`: Eliminar declaraciones de estado duplicadas ✅
  - Los useState de `participantes`, `gastos`, `nuevoGasto`, `nuevoParticipante`, `porcentajes` aparecen dos veces
  - Eliminar el segundo bloque de declaraciones duplicadas
  - Resultado esperado: no más "Cannot declare block-scoped variable that has already been declared"

- [x] **F1-06** — `SimuladorViajes.jsx`: Reescribir `calcularLiquidacion` ✅
  - La función tiene un SyntaxError por paréntesis mal colocado en el `forEach`
  - Algoritmo correcto de liquidación mínima de deudas
  - Resultado esperado: función compila y calcula transferencias mínimas correctas

- [x] **F1-07** — `PlanPensiones.jsx`: Corregir `LIMITE_Fiscal` → `LIMITE_FISCAL` ✅
  - JavaScript es case-sensitive
  - Buscar todas las ocurrencias en el archivo y corregirlas
  - Resultado esperado: no más ReferenceError al cargar `/jubilacion/pensiones`

**Verificación Fase 1 Frontend:**
```bash
cd client && npm run dev
```
Debe arrancar sin errores de compilación. `http://localhost:3000` debe cargar sin pantalla blanca.

---

### Backend — Crashes de runtime — CORREGIDOS

- [x] **B1-01** — `routes/auth.js`: Añadir `const Calculo = require('../models/Calculo')` ✅
  - El endpoint `DELETE /clean-calculations` usa `Calculo` sin importarlo
  - Añadir el import al inicio del archivo
  - Resultado esperado: endpoint responde 200 en lugar de crash 500

- [x] **B1-02** — `routes/calculos.js` y `routes/nomina.js`: Aplicar middleware `authenticate` ✅
  - Crear `server/middleware/auth.js` extrayendo la función `authenticate`
  - Importar y aplicar `router.use(authenticate)` al inicio de `calculos.js` y `nomina.js`
  - Importar desde `middleware/auth.js` para consistencia
  - Resultado esperado: rutas de cálculos requieren token válido y no crashean

- [x] **B1-03** — `server/index.js`: Verificar que todas las rutas existen ✅
  - Todas las rutas (`irpf.js`, `nomina.js`, `auth.js`, `calculos.js`, `gastos.js`, `hipotecas.js`) existen
  - Resultado esperado: servidor arranca sin `MODULE_NOT_FOUND`

- [x] **B1-04** — Seguridad mínima obligatoria ✅
  - Instalado: `helmet`, `express-mongo-sanitize`, `cors` con configuración
  - Añadir en `server/index.js` ANTES de las rutas
  - Resultado esperado: headers de seguridad activos, inyección NoSQL bloqueada

- [x] **B1-05** — CORS: Configurar con origen específico ✅
  - Reemplazar `app.use(cors())` por configuración con `origin` desde env
  - `ALLOWED_ORIGINS: http://localhost:3000` en `.env`
  - Resultado esperado: solo orígenes autorizados pueden hacer requests

- [x] **B1-06** — JWT secret: Configurar con `process.env.JWT_SECRET` ✅
  - JWT secret desde `.env` sin fallback hardcodeado
  - Resultado esperado: el servidor arranca si JWT_SECRET está configurado

**Verificación Fase 1 Backend:**
```bash
cd server && npm run dev
```
Debe arrancar. `GET http://localhost:3001/health` → 200. Todos los endpoints requieren autenticación correctamente.

---

## 🔵 FASE 2 — ESTABILIZACIÓN (funcionalidad core)

> El frontend compila y el backend arranca. Ahora hay que hacer que funcionen juntos correctamente.

**Verificación Fase 1 Backend:**
```bash
cd server && npm run dev
```
Debe arrancar. `GET http://localhost:3001/health` → 200. Ningún endpoint debe crashear con requests básicos.

---

## 🟡 FASE 2 — ESTABILIZACIÓN (funcionalidad core)

> El frontend compila y el backend arranca. Ahora hay que hacer que funcionen juntos correctamente.

### Correcciones de lógica de negocio

- [x] **L2-01** — Reescribir `calcularIRPF.js` con fórmula correcta ✅
  - Fórmula implementada:
    1. SS = `salarioBruto × 6.35%` (sobre bruto, con tope de cotización 4.731,30€/mes)
    2. Reducción rendimientos trabajo: escalonada (3.700€ → 0 según renta)
    3. Base liquidable = `salarioBruto - SS - reducción_rendimientos`
    4. Cuota íntegra = aplicar tramos estatales + autonómicos sobre base liquidable
    5. Cuota sobre mínimo personal = aplicar tramos sobre `5.550 + (hijos × 2.400)`
    6. Cuota líquida = `cuota_íntegra - cuota_mínimo_personal`
    7. Salario neto = `salarioBruto - SS.total - cuotaLiquida`
    8. Neto mensual 12/14 pagas calculados correctamente
  - `TRAMOS_AUTONOMICOS_2025` exportado como array de tramos
  - Funciones `calcularCuotaSeguridadSocial` y `calcularCuotaEmpresa` añadidas

- [x] **L2-02** — Verificación de valores fiscales con casos reales ✅
  - Verificados 4 casos con tolerancia ±5% (ver AUDITORIA-2026-04-03.md)

- [x] **L2-03** — Actualizar `IRPF.jsx` y `Nomina.jsx` para usar nuevos campos ✅
  - `IRPF.jsx`: usa `cuotaEstatal`, `cuotaAutonomica` (renombrados desde `impuestoEstatal`/`impuestoAutonomico`)
  - `Nomina.jsx`: usa `calcularCuotaSeguridadSocial`, `calcularCuotaEmpresa`, `retencionPct`
  - `TRAMOS_AUTONOMICOS_2025` importado desde utils

### Refactorización del backend

- [x] **R2-01** — Crear `server/controllers/authController.js` ✅
  - Lógica de `registro`, `login`, `perfil`, `limpiarCalculos` movida al controller
  - `routes/auth.js` solo define rutas + validadores

- [x] **R2-02** — Crear `server/controllers/calculoController.js` ✅
  - CRUD completo (`listar`, `obtener`, `crear`, `actualizar`, `eliminar`)
  - Filtrado por `usuario: req.usuario.id` en todas las operaciones

- [x] **R2-03** — Añadir validaciones con `express-validator` ✅
  - Instalado: `npm install express-validator`
  - `server/middleware/validation.js` con:
    - `registroValidator`: nombre (2-50), email válido, password (8+, mayúscula, número)
    - `loginValidator`: email válido, password no vacío
    - `calculoValidator`: tipo (enum), titulo (max 100), datosEntrada/resultado (objeto)
    - `handleValidationErrors`: middleware 400 con detalles

### Conexión frontend-backend

- [x] **C2-01** — `CrearCuenta.jsx`: Endpoint correcto ✅
  - Usa `auth.registro()` → `POST /api/auth/register` — coincide con backend
  - Sin `alert()` — usa `setError` / `setInfo`

- [x] **C2-02** — `Inicio.jsx`: Modal conectado con API real ✅
  - `handleLogin` → `auth.login()` → `POST /api/auth/login`
  - `handleRegister` → `auth.registro()` → `POST /api/auth/register`
  - Sin `alert()` — usa `errorMsg` / `successMsg` en modal

- [x] **C2-03** — `ConfiguracionPerfil.jsx`: Endpoint del perfil verificado ✅
  - `auth.perfil(token)` → `GET /api/auth/profile` — coincide con backend

---

## 🟢 FASE 3 — MEJORA (product quality)

> El producto funciona. Ahora se mejora la experiencia y la robustez.

### UX / UI

- [ ] **U3-01** — Crear componente `EstadoVacio.jsx` reutilizable
  - Props: `icono`, `titulo`, `descripcion`, `accion` (opcional)
  - Usar en: `HistorialCalculos.jsx`, `Notificaciones.jsx`, `SimuladorViajes.jsx`

- [ ] **U3-02** — Navbar con menús desplegables
  - Reescribir `Navbar.jsx` con las categorías definidas en las reglas del proyecto
  - Sin librerías — CSS position:absolute + estado React para visibilidad
  - Badge en "Cuenta" cuando hay notificaciones no leídas
  - Responsive: hamburger en mobile

- [ ] **U3-03** — Corregir `AsistenteIA.jsx`
  - Scroll automático al último mensaje con `useRef`
  - Usar forma funcional de `setHistorial`
  - Limpiar input antes de llamar a `procesarPregunta`

- [ ] **U3-04** — Eliminar todos los `alert()` del frontend
  - Reemplazar por estado de error/éxito visible en el UI
  - Crear componente `Toast.jsx` simple si se repite en más de 3 lugares

### Performance

- [ ] **P3-01** — `useMemo` en cálculos pesados
  - Envolver el resultado de `calcularIRPF` en `useMemo` con dependencias `[rendimientoAnual, comunidad, hijos]`
  - Envolver tabla de amortización en `SimuladorHipotecas.jsx` con `useMemo`

- [ ] **P3-02** — Lazy loading de rutas
  - En `App.jsx`, usar `React.lazy` + `Suspense` para páginas poco visitadas:
    ```jsx
    const AsistenteIA = React.lazy(() => import('./pages/AsistenteIA'))
    ```

### Limpieza de código

- [ ] **Q3-01** — Eliminar todos los `'use client'` de los archivos JSX
  - Son directivas de Next.js, no tienen efecto en Vite

- [ ] **Q3-02** — Eliminar código muerto
  - `porcentajes`/`setPorcentajes` en `SimuladorViajes.jsx`
  - `useEffect` comentado en `DetalleActivo.jsx`
  - `noLeidas` en `AsistenteIA.jsx` (implementar o eliminar)

- [ ] **Q3-03** — Mover `memory/` fuera del repo
  - Añadir `memory/` al `.gitignore`
  - Si `memory/PROGRESO.md` es útil, moverlo a `docs/PROGRESO.md`

### Backend

- [ ] **B3-01** — Logging estructurado con Winston
  - `npm install winston`
  - Crear `server/utils/logger.js`
  - Reemplazar todos los `console.log/error` por el logger

- [ ] **B3-02** — Añadir índices a MongoDB
  - En `Calculo`: índice compuesto `{ usuario: 1, createdAt: -1 }`
  - En `Prestamo`: índice `{ usuario: 1 }`

- [ ] **B3-03** — Rate limiting diferenciado por endpoint
  - Endpoint de login: máximo 5 intentos por IP cada 15 minutos
  - Endpoints generales: 100/15min (ya configurado)

---

## 🔵 FASE 4 — PRODUCCIÓN (deploy real)

> El producto es estable. Se prepara para usuarios reales.

### Seguridad avanzada

- [ ] **S4-01** — Evaluar migración de JWT a httpOnly cookies
  - Documentar decisión en las reglas del proyecto (riesgo vs complejidad)
  - Si se migra: añadir `cookie-parser`, cambiar `localStorage` por cookies

- [ ] **S4-02** — Revisar y endurecer Content-Security-Policy de helmet

- [ ] **S4-03** — Implementar refresh tokens para sesiones largas

### Infraestructura

- [ ] **D4-01** — Crear `Dockerfile` para el cliente (build Vite + nginx)

- [ ] **D4-02** — Crear `Dockerfile` para el servidor (Node.js + PM2)

- [ ] **D4-03** — Crear `docker-compose.yml` con MongoDB, cliente y servidor

- [ ] **D4-04** — Script de validación de variables de entorno al arrancar
  ```javascript
  // server/config/validateEnv.js
  const required = ['JWT_SECRET', 'MONGODB_URI', 'ALLOWED_ORIGINS']
  required.forEach(key => {
    if (!process.env[key]) {
      throw new Error(`Variable de entorno requerida: ${key}`)
    }
  })
  ```

- [ ] **D4-05** — Configurar `vite.config.js` para build de producción
  - `build.outDir`, `build.sourcemap: false`, `build.minify: 'terser'`

### Testing

- [ ] **T4-01** — Tests de integración para endpoints de auth con `supertest`
  - POST `/api/auth/register` → 201 con datos válidos, 409 con email duplicado
  - POST `/api/auth/login` → 200 con credenciales válidas, 401 con incorrectas
  - GET `/api/auth/profile` → 200 con token, 401 sin token

- [ ] **T4-02** — Tests unitarios para `calcularIRPF.js` (ya existe, completar)

- [ ] **T4-03** — Tests unitarios para `calcularDeudas` / liquidación de viajes

---

## Métricas de progreso

| Fase | Tareas | Completadas | % |
|------|--------|-------------|---|
| 🔴 Fase 1 | 13 | 13/13 | 100% |
| 🟡 Fase 2 | 9 | 9/9 | 100% |
| 🟢 Fase 3 | 12 | 0/12 | 0% |
| 🔵 Fase 4 | 11 | 0/11 | 0% |
| **Total** | **45** | **22** | **49%** |

> Actualizar esta tabla al completar tareas.
