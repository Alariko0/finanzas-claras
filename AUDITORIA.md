# AUDITORÍA TÉCNICA — FinanzasClaras
**Fecha:** 2026-03-30  
**Auditor:** Principal Engineer (auditoría automática)  
**Versión del proyecto analizada:** Estado a 2026-03-30

---

## 1. Resumen Ejecutivo

### Estado real: 35% completado

El proyecto tiene una base estructural válida y un design system bien definido, pero **no compila** en su estado actual. Hay errores que impiden el arranque del cliente, crashes garantizados en el servidor, y lógica fiscal incorrecta en el núcleo del producto.

### Principales riesgos

| Riesgo | Severidad | Impacto |
|--------|-----------|---------|
| Frontend no compila (hooks fuera de componente) | 🔴 Crítico | App inutilizable |
| Backend crashea en endpoints clave | 🔴 Crítico | API no funcional |
| CORS abierto a cualquier origen | 🔴 Crítico | Seguridad comprometida |
| JWT secret con fallback hardcodeado | 🔴 Crítico | Tokens falsificables |
| Lógica fiscal IRPF incorrecta | 🔴 Crítico | Producto engaña usuarios |
| Sin autenticación en rutas de cálculos | 🔴 Crítico | Datos expuestos |
| Sin sanitización NoSQL | 🟡 Importante | Inyección posible |
| Sin helmet.js | 🟡 Importante | Headers inseguros |

### Viabilidad

El proyecto **es viable**. La arquitectura base, el design system y la estructura de rutas son correctos. Los bugs son corregibles de forma quirúrgica. Estimación para alcanzar estado production-ready: 40-60 horas de trabajo efectivo.

---

## 2. Arquitectura

### Problemas estructurales

**No existe separación controller/route en el backend.** Toda la lógica de negocio vive dentro de los archivos de rutas:
- `server/routes/auth.js` maneja routing, validación, lógica de negocio y definición de middleware en el mismo archivo.
- `server/routes/calculos.js` referencia `req.usuario.id` sin tener middleware de autenticación aplicado.

**El middleware `authenticate` está definido DESPUÉS de las rutas que lo usan** dentro de `auth.js`. Funciona por hoisting de `function` declaration, pero es frágil y confuso para cualquier desarrollador que lea el código.

**No existe `controllers/`, `middleware/`, ni `services/`.** El backend no implementa ningún patrón arquitectónico reconocible.

**La carpeta `memory/` dentro del repositorio** contiene archivos de progreso de desarrollo que no deben existir en un repo profesional.

### Escalabilidad

- Sin patrón Repository — las queries MongoDB están inline en los controllers mezclados con routes.
- Sin abstracción de servicios — imposible reutilizar lógica entre endpoints.
- Sin índices definidos en `Calculo` — las queries de historial por usuario serán O(n) completas a escala.
- `datosEntrada` y `resultado` en el modelo `Calculo` son `Mixed` — imposible indexar, validar o hacer queries eficientes sobre ellos.

### Separación de responsabilidades

| Capa | Estado |
|------|--------|
| Rutas (definición HTTP) | 🟡 Parcial — mezcladas con lógica |
| Controladores (lógica de negocio) | ❌ No existe como capa |
| Servicios (lógica de dominio) | ❌ No existe |
| Middleware (cross-cutting) | 🟡 Existe pero inline |
| Modelos (acceso a datos) | ✅ Correcto |
| Utils frontend (lógica de cálculo) | ✅ Bien separada en utils/ |

---

## 3. Frontend

### Bugs críticos (impiden compilación o causan crash en runtime)

#### BUG-01 — `Inicio.jsx`: Hooks fuera del componente
**Archivo:** `client/src/pages/Inicio.jsx`, líneas 6-10  
**Problema:** Los `useState` para `activeTab` y `formData` están declarados a nivel de módulo, fuera de cualquier componente funcional. React lanza "Invalid hook call" y la app crashea al cargar `/`.
```jsx
// NIVEL DE MÓDULO — INVÁLIDO
const [activeTab, setActiveTab] = useState('login')
const [formData, setFormData] = useState({...})
```
**Impacto:** La ruta `/` es inutilizable. La app no puede servir su página principal.

#### BUG-02 — `App.jsx`: `Inicio` no importado
**Archivo:** `client/src/App.jsx`  
**Problema:** La ruta `path="/"` usa `<Inicio />` pero `Inicio` no aparece en los imports del archivo.  
**Impacto:** Error de compilación "Inicio is not defined".

#### BUG-03 — `global.css`: Tags HTML dentro de CSS
**Archivo:** `client/src/styles/global.css`  
**Problema:** El archivo contiene literalmente:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
dentro del CSS. Esto es inválido y puede causar errores de parseo.

#### BUG-04 — `Nomina.jsx`: Variables no declaradas
**Archivo:** `client/src/pages/Nomina.jsx`  
**Problema:** El JSX referencia `salario` (el estado se llama `salarioMensual`), `cua` y `retencionIrf` sin declararlas. El componente no puede renderizarse.

#### BUG-05 — `SimuladorViajes.jsx`: Estado duplicado y SyntaxError
**Archivo:** `client/src/pages/SimuladorViajes.jsx`  
**Problema 1:** Los useState de `participantes`, `gastos`, `nuevoGasto`, `nuevoParticipante` y `porcentajes` están declarados dos veces consecutivas.  
**Problema 2:** La función `calcularLiquidacion` tiene un bloque `forEach` con un paréntesis de cierre mal colocado — SyntaxError que impide la compilación del archivo.

#### BUG-06 — `PlanPensiones.jsx`: ReferenceError de capitalización
**Archivo:** `client/src/pages/PlanPensiones.jsx`  
**Problema:** Usa `LIMITE_Fiscal` (F minúscula) pero está declarada como `LIMITE_FISCAL`. JavaScript es case-sensitive.

### Problemas de estado

- Varios componentes (`AsistenteIA.jsx`) usan `setHistorial([...historial, nuevo])` en lugar de la forma funcional `setHistorial(prev => [...prev, nuevo])` — causa pérdida de mensajes por closure stale en llamadas asíncronas.
- No hay estado global ni Context API. Aceptable para la escala actual, pero la ausencia de contexto de autenticación significa que cada componente que necesita saber si hay usuario logueado tiene que leer directamente de `localStorage` de forma ad-hoc.

### Problemas de UX/UI

- Múltiples componentes usan `alert()` para feedback — reemplazar por estado de error en UI.
- El chat de `AsistenteIA.jsx` no hace scroll automático al último mensaje.
- No hay loading states reales — solo texto "Creando..." en botones.
- Algunos componentes tienen listas que pueden quedar vacías sin ningún feedback al usuario.

### Código duplicado

- `TRAMOS_AUTONOMICOS_2025` está definido tanto en `IRPF.jsx` como en `calcularIRPF.js`. Una sola fuente de verdad: el util.
- Patrones de formulario repetidos en `CrearCuenta.jsx`, `ConfiguracionPerfil.jsx` e `Inicio.jsx` sin componente reutilizable.

---

## 4. Backend

### Errores de runtime garantizados

#### CRASH-01 — `auth.js`: `Calculo` usado sin importar
**Archivo:** `server/routes/auth.js`, endpoint `DELETE /clean-calculations`  
**Código:** `await Calculo.deleteMany({})` — `Calculo` no está importado.  
**Resultado:** `ReferenceError: Calculo is not defined` al llamar al endpoint.

#### CRASH-02 — `calculos.js`: `req.usuario` undefined
**Archivo:** `server/routes/calculos.js`, `POST /`  
**Código:** `usuario: req.usuario.id` — no hay middleware `authenticate` aplicado a estas rutas.  
**Resultado:** `TypeError: Cannot read properties of undefined (reading 'id')` en cualquier POST.

#### CRASH-03 — Rutas inexistentes importadas en `index.js`
**Archivo:** `server/index.js`  
**Problema:** Se importan `./routes/irpf` y `./routes/nomina`. Si estos archivos no existen en el filesystem, el servidor falla al arrancar con `MODULE_NOT_FOUND`.

### Seguridad

Ver sección 6 (Seguridad) para detalle completo.

### Falta de middleware/controladores

- No existe `middleware/auth.js` — el middleware `authenticate` está definido al final de `auth.js` y exportado implícitamente a través de closure. No hay forma limpia de importarlo en otros routers.
- No hay validación de inputs en ningún endpoint excepto los básicos de auth.
- No hay manejo de errores async — los try/catch son inconsistentes y algunos devuelven la propiedad `error: error.message` en producción, exponiendo información de la stack.

### Problemas de diseño

- `IrpfConfig` en MongoDB duplica datos que ya están hardcodeados en `calcularIRPF.js`. Dos fuentes de verdad para los mismos datos fiscales.
- `NominaConfig` existe en el modelo pero el endpoint de nómina en `routes/nomina.js` no lo usa — calcula con valores hardcodeados inline.
- El endpoint `GET /api/irpf/configuracion/:comunidad` crea documentos en MongoDB si no existen — una query GET con efecto de escritura es una mala práctica.

---

## 5. Base de Datos

### Modelado

| Modelo | Estado | Problema |
|--------|--------|----------|
| `Usuario` | ✅ Correcto | Bcrypt + JWT bien implementados |
| `Calculo` | 🟡 Funcional | `datosEntrada`/`resultado` como `Mixed` no permite indexación |
| `Prestamo` | 🟡 Funcional | Sin índice por usuario |
| `IrpfConfig` | 🔴 Problemático | Duplica datos del código; enum con entradas duplicadas |
| `NominaConfig` | 🔴 Problemático | No usado en ningún endpoint real |
| `Activo` | 🟡 Funcional | Sin relaciones reales con Calculo |

### Problemas de escalabilidad

- Sin índices compuestos en `Calculo` para `{ usuario: 1, createdAt: -1 }` — queries de historial lentas a escala.
- `IrpfConfig.comunidad` tiene `'Comunidad de Madrid'` duplicado en el enum y `'Madrid'` como entrada separada — creará documentos duplicados con datos inconsistentes.
- Sin estrategia de paginación en ningún endpoint de listado.

---

## 6. Seguridad

### Vulnerabilidades críticas

#### SEC-01 — CORS completamente abierto
```javascript
app.use(cors()) // Acepta cualquier origen
```
En producción, cualquier web puede hacer requests autenticados a la API usando las credenciales del usuario. Debe configurarse con `origin` específico desde variable de entorno.

#### SEC-02 — JWT secret con fallback conocido
```javascript
const secret = process.env.JWT_SECRET || 'FC_SECRET_KEY_CHANGE_ME_IN_PRODUCTION'
```
Si el servidor se deploya sin `.env`, la app funciona con un secret público y conocido. Cualquiera puede forjar tokens válidos. **La aplicación debe fallar al arrancar si `JWT_SECRET` no está definido.**

#### SEC-03 — Rutas de cálculos sin autenticación
`POST /api/calculos` y `PUT /api/calculos/:id` no tienen middleware `authenticate`. Cualquier request sin token que no use `req.usuario.id` funcionará — y los que sí lo usan, crashearán. No hay protección real.

#### SEC-04 — Sin sanitización NoSQL
Sin `express-mongo-sanitize`, un atacante puede enviar:
```json
{ "email": { "$gt": "" }, "password": { "$gt": "" } }
```
y potencialmente bypassear la autenticación dependiendo de cómo Mongoose maneje el objeto. Riesgo real.

#### SEC-05 — Sin headers de seguridad HTTP
Sin `helmet.js`, el servidor expone:
- `X-Powered-By: Express` (fingerprinting del servidor)
- Sin `Content-Security-Policy`
- Sin `X-Frame-Options` (clickjacking posible)
- Sin `Strict-Transport-Security`

#### SEC-06 — JWT en localStorage (XSS risk)
Los tokens se almacenan en `localStorage` con clave `fc_token`. Si hay cualquier XSS, los tokens son robables. El estándar más seguro es `httpOnly` cookies. Para la fase actual es aceptable, pero debe documentarse el riesgo.

#### SEC-07 — Exposición de stack traces en producción
```javascript
error: error.message // Expuesto en respuestas de error
```
Los mensajes de error de Mongoose/Node pueden revelar estructura de la base de datos, nombres de colecciones y rutas internas.

### Riesgos adicionales

- Sin rate limiting diferenciado por endpoint — el endpoint de login debería tener límites más agresivos (5 intentos/15min) que el límite general (100/15min).
- Sin expiración de sesión del lado del cliente — el token JWT dura 7 días y no hay mecanismo de revocación.

---

## 7. Calidad del Código

### Inconsistencias graves

- **Mix de directivas Next.js en proyecto Vite:** `'use client'` aparece en la mayoría de los componentes. No tiene efecto en Vite pero indica copy-paste de otro contexto y confunde a cualquier desarrollador.
- **Variables en dos idiomas sin criterio:** `rendaMensual` vs `salarioBruto`, `gastosFamiliares` vs `expenseList`, `cuotaMensual` vs `monthlyPayment`.
- **Naming inconsistente en la función `calcularIRPF`:** Recibe `salarioBruto` como parámetro pero uno de los campos de retorno también se llama `salarioBruto` — difícil saber si es el input o un cálculo derivado.

### Lógica fiscal incorrecta (bug de negocio)

La función `calcularIRPF` en `calcularIRPF.js` tiene errores conceptuales graves:

1. **`cuotaLiquida` calculada incorrectamente:**
   ```javascript
   const cuotaLiquida = Math.max(0, impuestoTotal - reduccionesTotales - reduccionExtra)
   ```
   Las reducciones (mínimo personal) **ya se aplican para calcular la base liquidable**. Restarlas de nuevo de la cuota íntegra produce valores incorrectos. La cuota líquida se calcula aplicando los tramos sobre el mínimo personal y restando esa cantidad de la cuota íntegra.

2. **`netoMensual` calculado incorrectamente:**
   ```javascript
   const netoMensual = cuotaLiquida / 14
   ```
   El neto mensual no es la cuota dividida entre 14 — es `(salarioBruto - SS - cuotaLiquida) / 12` (o `/14` para 14 pagas). El resultado actual es el impuesto mensual, no el salario neto.

3. **`seguridadSocial` calculada sobre `baseLiquidable`** en lugar de sobre `salarioBruto`. La cotización a la SS se aplica sobre el salario bruto (con límites de base de cotización), no sobre la base imponible fiscal.

### Código muerto

- `porcentajes` y `setPorcentajes` en `SimuladorViajes.jsx` — declarados, nunca usados.
- `useEffect` completamente comentado en `DetalleActivo.jsx`.
- Variables `calcularCuota` definida dos veces en `PrestamosPersonales.jsx` (una como función interna, otra inline en el map).
- `noLeidas` en `AsistenteIA.jsx` — estado declarado pero nunca actualizado ni mostrado.

---

## 8. DevOps / Producción

### Qué falta para producción real

| Elemento | Estado | Prioridad |
|----------|--------|-----------|
| `Dockerfile` cliente | ❌ No existe | 🟡 |
| `Dockerfile` servidor | ❌ No existe | 🟡 |
| `docker-compose.yml` | ❌ No existe | 🟡 |
| CI/CD pipeline | ❌ No existe | 🟢 |
| Logging estructurado (Winston/Pino) | ❌ Solo console.log | 🟡 |
| Validación de env vars al arrancar | ❌ No existe | 🔴 |
| Build de producción Vite configurado | 🟡 Parcial | 🟡 |
| `package.json` en raíz del proyecto | ❌ No existe | 🟡 |
| Health check endpoint `/api/health` | ❌ Solo `/health` sin `/api` | 🟢 |
| Estrategia de backup MongoDB | ❌ No existe | 🟡 |
| Variables de entorno validadas | ❌ No existe | 🔴 |

### Notas de deploy

- El `README.md` indica `npm install && npm run dev` desde la raíz pero no hay `package.json` en la raíz — el comando falla.
- `vite.config.js` no tiene configuración de `build` para producción.
- No hay configuración de proxy inverso (nginx) ni de PM2 para el servidor Node.

---

## 9. Conclusión

**El proyecto NO está listo para usuarios reales.** No en su estado actual.

Los problemas no son de complejidad arquitectónica sino de bugs básicos que bloquean el arranque. La base es sólida: el design system es profesional, la estructura de rutas está pensada correctamente, y los utils de cálculo tienen la dirección correcta aunque la implementación sea incorrecta.

**Lo que hace falta para ir a producción:**

1. Que compile el frontend (1-2 horas de trabajo)
2. Que el backend arranque sin crashes (2-3 horas)
3. Que la lógica fiscal sea correcta (3-4 horas)
4. Seguridad mínima aceptable (2-3 horas)
5. Conexión real frontend-backend (4-6 horas)

**Total estimado para MVP usable: 15-20 horas de trabajo efectivo.**

Sin priorizar en este orden, cualquier trabajo adicional (nuevas páginas, nuevas funcionalidades) se construirá sobre una base rota.
