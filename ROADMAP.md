# ROADMAP — FinanzasClaras
**Última actualización:** 2026-03-30  
**Estado:** Fase 1 pendiente

> Este documento es la fuente de verdad del trabajo pendiente.  
> Actualizar el estado de cada tarea al completarla.  
> Al completar una fase, actualizar también `CLAUDE.md`.

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

- [ ] **L2-01** — Reescribir `calcularIRPF.js` con fórmula correcta
  - Fórmula actual es incorrecta conceptualmente (ver AUDITORIA.md §3 y §7)
  - Fórmula correcta:
    1. SS = `salarioBruto × 6.35%` (sobre bruto, no sobre base)
    2. Reducción rendimientos trabajo: escalonada según renta (máx 6.498€)
    3. Base liquidable = `salarioBruto - SS - reducción_rendimientos`
    4. Cuota íntegra = aplicar tramos sobre base liquidable
    5. Cuota sobre mínimo personal = aplicar tramos sobre `5.550 + (hijos × 2.400)`
    6. Cuota líquida = `cuota_íntegra - cuota_mínimo_personal`
    7. Salario neto = `salarioBruto - SS.total - cuotaLiquida`
    8. Neto mensual 12 pagas = `salarioNeto / 12`
    9. Neto mensual 14 pagas = `salarioNeto / 14`
  - Exportar además `TRAMOS_AUTONOMICOS_2025` para que `IRPF.jsx` lo importe
  - Resultado esperado: cálculos dentro del ±5% de calculadoras fiscales oficiales

- [ ] **L2-02** — Actualizar `calcularIRPF.test.js` con valores reales
  - Casos a verificar (tolerancia ±300€):
    - SMI 2025 (15.876€), Madrid, soltero → neto ~13.800€/año
    - 30.000€, Cataluña, soltero → neto ~22.500€/año
    - 60.000€, Madrid, 2 hijos → neto ~41.000€/año
    - 100.000€, País Vasco, soltero → neto ~63.000€/año
  - Resultado esperado: tests pasan con valores reales verificables

- [ ] **L2-03** — Actualizar `IRPF.jsx` y `Nomina.jsx` para usar nuevos campos del resultado
  - El shape del objeto retornado por `calcularIRPF` cambia en L2-01
  - Actualizar todos los `resultado.XXX` en los JSX
  - Eliminar la definición duplicada de `TRAMOS_AUTONOMICOS_2025` en `IRPF.jsx` — importar desde utils

### Refactorización del backend

- [ ] **R2-01** — Crear `server/controllers/authController.js`
  - Mover lógica de `registro`, `login` y `perfil` desde `auth.js` al controller
  - El archivo `routes/auth.js` solo debe definir rutas y llamar al controller
  - Estructura del controller:
    ```javascript
    exports.registro = async (req, res) => {...}
    exports.login = async (req, res) => {...}
    exports.perfil = async (req, res) => {...}
    ```

- [ ] **R2-02** — Crear `server/controllers/calculoController.js`
  - Mover lógica de `calculos.js` al controller
  - Mismo patrón que authController

- [ ] **R2-03** — Añadir validaciones con `express-validator`
  - Instalar: `npm install express-validator`
  - Crear `server/middleware/validation.js` con:
    - `registroValidator`: nombre (2-50 chars), email (formato válido), password (min 8, mayúscula, número)
    - `loginValidator`: email (formato válido), password (no vacío)
    - `calculoValidator`: tipo (enum), titulo (max 100 chars), datosEntrada (objeto)
    - `handleValidationErrors`: middleware que devuelve 400 si hay errores

### Conexión frontend-backend

- [ ] **C2-01** — `CrearCuenta.jsx`: Verificar endpoint correcto
  - La API llama a `/api/auth/registro` pero el backend expone `/api/auth/register`
  - Corregir en `api.js` o en el backend (elegir uno y ser consistente)
  - Eliminar `alert()` — reemplazar por `setError` / `setInfo` según resultado

- [ ] **C2-02** — `Inicio.jsx`: Conectar modal con API real
  - `handleLogin` y `handleRegister` ya tienen la lógica — verificar que funcionan tras B1-02
  - Eliminar `alert()` — reemplazar por mensajes de error dentro del modal
  - Al login exitoso: cerrar modal, actualizar estado `user`

- [ ] **C2-03** — `ConfiguracionPerfil.jsx`: Corregir endpoint del perfil
  - Llama a `auth.perfil` que hace GET `/api/auth/profile` — verificar que coincide con el backend

---

## 🟢 FASE 3 — MEJORA (product quality)

> El producto funciona. Ahora se mejora la experiencia y la robustez.

### UX / UI

- [ ] **U3-01** — Crear componente `EstadoVacio.jsx` reutilizable
  - Props: `icono`, `titulo`, `descripcion`, `accion` (opcional)
  - Usar en: `HistorialCalculos.jsx`, `Notificaciones.jsx`, `SimuladorViajes.jsx`

- [ ] **U3-02** — Navbar con menús desplegables
  - Reescribir `Navbar.jsx` con las categorías definidas en `CLAUDE.md`
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
  - Documentar decisión en `CLAUDE.md` (riesgo vs complejidad)
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
| 🔴 Fase 1 | 13 | 13/13 (Frontend + Backend) | 100% |
| 🟡 Fase 2 | 11 | 0/11 | 0% |
| 🟢 Fase 3 | 12 | 0/12 | 0% |
| 🔵 Fase 4 | 11 | 0/11 | 0% |
| **Total** | **47** | **13** | **28%** |

> Actualizar esta tabla al completar tareas.
