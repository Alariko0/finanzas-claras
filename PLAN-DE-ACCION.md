# Plan de acción — FinanzasClaras → MVP en producción (v2)

Fecha: 2026-11-11 · Base: auditoría del mismo día, re-auditada. Esta versión incorpora tus decisiones: **MVP con el máximo de módulos**, **lógica fiscal en el servidor**, **base de datos Supabase**, despliegue aún sin definir.

## Estado (actualizado 2026-11-11)

| Fase | Estado | Rama |
|---|---|---|
| F0 Preparación | ✅ hecha | `fase-0-preparacion` |
| F1 Supabase, auth y RLS | ✅ hecha y validada (puerta 1 superada) | `fase-1-supabase-auth` |
| F2 Plataforma backend | ✅ hecha (58 tests) | `fase-2-plataforma-backend` |
| F3 Motor fiscal | ⏳ siguiente | — |
| F4–F9 | pendientes | — |

Decisiones D8 (calculadoras públicas, guardar con sesión), D9 (confirmación de correo) y D10 (el servidor usa el JWT del usuario) aprobadas. Nota: en F2 no se creó la capa `repositories/`; los controladores usan `req.supabase` directamente.

## Cómo trabajamos

- Yo programo; tú validas en cada **puerta** (⛳) antes de pasar a la siguiente fase.
- Una rama por fase (`fase-N-nombre`), commits pequeños. **No hago commit ni merge sin tu OK** (regla de las reglas del proyecto).
- Cada tarea tiene un criterio de aceptación comprobable. Si no puedo comprobarlo, lo digo.
- Gestor de paquetes: **pnpm** (hoy hay `package-lock.json` en ambos paquetes).
- Cifras fiscales: las busco en BOE/AEAT durante F3 y dejo la fuente citada junto a cada dato. Nada de memoria.
- Secretos: nunca los pegues en el chat. Van en `server/.env` y `client/.env` (ignorados por git).

## Decisiones tomadas

| # | Decisión | Resultado |
|---|---|---|
| D1 | Alcance | Máximo de módulos: las 22 pantallas se vuelven reales (ver F6–F8). Lo que no esté listo al llegar a F9 se oculta, no se deja con datos falsos. |
| D2 | Lógica fiscal | **En el servidor** (`server/services/`, CommonJS, funciones puras + datos con fuente). El cliente solo muestra resultados. |
| D4 | Sesión | **Supabase Auth** (email + contraseña) reemplaza el auth propio. El cliente usa `@supabase/supabase-js` (token de acceso de ~1 h con refresco automático) y lo manda como `Bearer` a Express. Motivo: no hay SSR, la API está en otro origen, y las cookies `httpOnly` exigirían un proxy extra. Se compensa con CSP estricta (helmet), sin `dangerouslySetInnerHTML` y tokens cortos. |
| D5 | Asistente | Se mantiene, basado en reglas (sin LLM), con contenido reescrito y verificado (F8). |
| D3 | Régimen foral | Sin cambios: País Vasco y Navarra devuelven aviso "no soportado". |
| D6 | Nómina | Sin cambios: pagas, situación familiar y comunidad editables; se etiqueta como estimación. |
| D7 | Despliegue | **Abierto.** Se diseña neutral: Express sin estado, configuración por variables de entorno, `Dockerfile`, cliente estático. Decides al llegar a F9. |

## Decisiones nuevas (con mi recomendación)

| # | Pregunta | Recomendación |
|---|---|---|
| D8 | ¿Calculadoras abiertas sin cuenta? | Sí: calcular es público con rate limit por IP; **guardar** exige sesión. |
| D9 | ¿Confirmación de email en Supabase? | Activada. |
| D10 | ¿El servidor accede a la BD con el JWT del usuario (RLS activo) o con la clave de servicio? | Con el JWT del usuario. La clave de servicio nunca se usa en peticiones normales, solo en scripts de administración. |

## Arquitectura objetivo

```
client (React/Vite, estático)
  ├─ supabase-js ── login/registro/refresco ──► Supabase Auth
  └─ fetch Bearer <access_token> ──► server (Express, CommonJS)
                                        ├─ middleware: verifica JWT de Supabase
                                        ├─ services/fiscal, services/prestamos, ... (puro, con tests)
                                        └─ repositories ──► Supabase Postgres (RLS por user_id)
supabase/migrations/*.sql   ← esquema + políticas RLS versionados en el repo
```

Se retiran: Mongoose, MongoDB, `express-mongo-sanitize`, `bcryptjs`, firma de JWT propia, modelo `Usuario` y `authController` (login/registro).

## F0 — Preparación (~4 h)

- F0.1 Con tu permiso, guardar el trabajo actual sin commitear en una rama `wip-base` (sin tocar `main`).
- F0.2 Migrar a pnpm (borrar `package-lock.json`, `pnpm install`).
- F0.3 ESLint con config real en el servidor; Jest + Supertest en el servidor; Vitest en el cliente.
- F0.4 Separar `app.js` (Express) de `index.js` (`listen`), para poder testear.
- F0.5 **Tú:** crear el proyecto Supabase y dejar `SUPABASE_URL`, `SUPABASE_ANON_KEY` (y `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor) en los `.env`. Yo creo los `.env.example`.
- ⛳ Aceptación: `pnpm lint`, `pnpm test` y `pnpm build` corren; el servidor arranca leyendo variables de Supabase.

## F1 — Supabase: esquema, Auth y autorización (~18 h)

| ID | Tarea | Aceptación |
|---|---|---|
| F1.1 | Migraciones SQL en `supabase/migrations`: `profiles` (id → `auth.users`, nombre, preferencias `jsonb`), `calculos`, `prestamos`, `activos`, `notificaciones`, `gastos_familiares`, `presupuestos`, `viajes` | Migraciones se aplican en limpio |
| F1.2 | **RLS activado en todas las tablas**; política única `user_id = auth.uid()`; `profiles` creado por trigger al registrarse | Test con dos usuarios: A no ve ni modifica datos de B |
| F1.3 | Rol admin solo en `app_metadata` (no editable por el usuario). No hay endpoint de limpieza global | Intentar autoasignarse admin falla |
| F1.4 | Middleware Express: verifica el JWT de Supabase (JWKS local o `getUser`, según la configuración del proyecto), fija `algorithms`/`issuer`/`aud`, expone `req.user` | Token manipulado o expirado → 401 |
| F1.5 | Cliente: `AuthProvider`, rutas protegidas, logout real, 401 → cierre de sesión | Flujo completo manual |
| F1.6 | Eliminar auth propio (Mongoose, bcrypt, `Usuario`, `authController`); arreglar `CrearCuenta` (decide por éxito real, muestra errores de validación) | No quedan referencias; `pnpm lint` limpio |
| F1.7 | Políticas de contraseña y confirmación de email en Supabase (D9) | Documentado en README |

⛳ **Puerta 1:** registras usuario, confirmas email, entras, sales, y compruebas con una segunda cuenta que no ves datos ajenos.

## F2 — Backend: plataforma común (~10 h)

- F2.1 Formato de respuesta único `{success, message, data?, errors?}`; nunca `error.message` ni `err` en producción (`index.js:98` y todas las rutas).
- F2.2 Validación con `express-validator` en cada endpoint con lista blanca de campos (se acaba el `...req.body` de `hipotecas.js:71-75` y el `req.body` directo de `calculoController.js:101`).
- F2.3 Rate limit: estricto para escritura/auth, más holgado para calculadoras públicas (D8); `trust proxy` configurable.
- F2.4 Capa `repositories/` sobre Supabase con cliente por petición (JWT del usuario, D10).
- F2.5 CRUD de cálculos (`tipo` unificado entre validador y BD), paginación e índices.
- F2.6 `/health` con estado de la BD; arranque falla si falta configuración.
- Aceptación: tests Supertest de cada endpoint (caso feliz, 401, 400, recurso ajeno).

## F3 — Motor fiscal en el servidor (~48 h) — el bloque más pesado

Principio: datos separados del código (`server/services/fiscal/datos2025.js`), cada dato con su fuente (BOE/AEAT) en un comentario.

| ID | Tarea | Aceptación |
|---|---|---|
| F3.1 | Investigar y registrar datos 2025: escala estatal, escalas autonómicas por comunidad, SS (incl. MEI) con bases mín/máx, reducción por rendimientos del trabajo, gastos deducibles, mínimos personales/familiares por orden de hijo, escala del ahorro | Fichero con fuente por entrada; **te lo enseño antes de programar** |
| F3.2 | `liquidacionIRPF` (base general): rendimiento neto → reducción → base liquidable → cuota estatal + autonómica − cuota del mínimo | Casos contrastados con el simulador de la AEAT |
| F3.3 | `estimarRetencionNomina`, separada de la liquidación anual y etiquetada como estimación | Casos documentados con tolerancia explícita |
| F3.4 | Nómina completa: SS trabajador y empresa, 12/14 pagas, prorrateo | Tests con importes conocidos |
| F3.5 | Base del ahorro (cripto, acciones, intereses) con la escala vigente | Tests |
| F3.6 | Regímenes no soportados (foral, etc.) devuelven aviso, nunca un número falso | Test |
| F3.7 | Endpoints `POST /api/fiscal/irpf`, `/nomina`, `/ahorro` (públicos con rate limit, D8) con validación | Tests Supertest |
| F3.8 | Borrar `client/src/utils/calcularIRPF.js` y tests muertos; el cliente llama a la API (con debounce) | `pnpm test` verde |

⛳ **Puerta 3:** te paso una tabla de 8–10 casos (bruto, comunidad, hijos → resultado) y los contrastas tú con el simulador de la AEAT. Si no cuadran, no avanzo.

## F4 — Préstamos e hipotecas (~16 h)

- F4.1 `server/services/prestamos.js` puro: cuota francesa con `n` en meses, 0 % sin división por cero, tabla de amortización completa con fechas reales, TAE por TIR con comisiones. En céntimos (enteros).
- F4.2 Amortización anticipada real (reducir cuota o reducir plazo, comisión parametrizable).
- F4.3 Endpoints públicos de cálculo y CRUD autenticado de préstamos guardados.
- F4.4 Rehacer `SimuladorHipotecas`, `PrestamosPersonales` y `AmortizacionAnticipada` sobre la API (200.000 €, 3,5 %, 300 meses ≈ 1.001 €).
- Aceptación: tests contra tablas conocidas; el ahorro de intereses coincide con la tabla completa.

## F5 — Cliente ↔ API (~24 h)

- F5.1 Capa de API del cliente unificada con manejo de errores (usa `message` y `errors[]` del servidor).
- F5.2 "Guardar cálculo" en IRPF, Nómina, Hipoteca, Préstamo y Amortización.
- F5.3 `HistorialCalculos` real (listar, abrir, borrar, paginar).
- F5.4 Perfil real contra `profiles` (nombre, preferencias, cambio de contraseña vía Supabase); `PersonalizarModulos` persiste en `profiles.preferencias`. Se elimina el uso de `localStorage` para datos de usuario.
- F5.5 Estados de carga/error y validación numérica (min/max, NaN) en todas las calculadoras.

⛳ **Puerta 5:** recorrido completo: alta → calcular → guardar → historial → logout, delante de ti.

## F6 — Inversión y planificación (~40 h)

Leo primero las páginas que aún no he revisado a fondo (`GestionInversiones`, `DetalleActivo`, `DashboardPatrimonio`, `PlanPensiones`) y te confirmo el alcance exacto antes de programar.

- F6.1 `SimuladorMobiliaria`: sustituir tramos inventados por la escala real del ahorro (reusa F3.5); rentabilidad y plusvalías con datos introducidos por el usuario.
- F6.2 `SimuladorInmobiliaria`: rentabilidad bruta/neta, financiación (reusa F4), ITP/AJD y IRPF del alquiler, punto de equilibrio correcto; sin Infinity.
- F6.3 `PlanJubilacion`: interés compuesto con aportaciones mensuales, inflación opcional, retirada sostenible (regla del 4 %) bien definida; arregla la división por cero con rentabilidad 1 %.
- F6.4 `PlanPensiones`: aportación máxima y ahorro fiscal por tramo (con datos oficiales).
- F6.5 `GestionInversiones`, `DetalleActivo` y `DashboardPatrimonio` sobre la tabla `activos` (CRUD real, valor total, distribución, evolución).
- Aceptación: tests de cada servicio con casos calculados a mano; sin datos mock en pantalla.

## F7 — Gastos, presupuestos, viajes y notificaciones (~22 h)

- F7.1 `GastosFamiliares` y `PresupuestosAhorro` (50/30/20) persistidos por usuario.
- F7.2 `SimuladorViajes`: liquidación mínima de deudas con tests; persistencia opcional del viaje.
- F7.3 `Notificaciones`: tabla + endpoints (listar, marcar leída, limpiar); generación de avisos reales (p. ej. fin de campaña de renta, aviso de cuota alta) sin datos de ejemplo.
- Aceptación: sin mocks; cada módulo guarda y recupera sus datos.

## F8 — Asistente fiscal (~10 h)

- F8.1 Reescribir las 15 respuestas con fuente AEAT/BOE y revisar punto por punto los errores detectados (cripto, deducciones inexistentes, Modelo 720, campaña de renta, plusvalía municipal, IRPH).
- F8.2 Matching correcto (normalizar ambos lados, palabras clave, sinónimos); fallback útil con enlaces oficiales.
- F8.3 Cada respuesta muestra la fuente y la fecha de revisión.
- Aceptación: tests con 30 preguntas de ejemplo; ninguna respuesta sin fuente.

## F9 — Calidad y despliegue (~20 h)

- F9.1 CI (GitHub Actions): lint + test + build en cada PR.
- F9.2 Logging estructurado sin datos personales; apagado limpio.
- F9.3 Producción: `NODE_ENV`, CORS (`ALLOWED_ORIGINS`), CSP, HTTPS, secretos en el proveedor.
- F9.4 `Dockerfile` para el servidor y build estático del cliente; **aquí decides el destino (D7)**.
- F9.5 Revisión de seguridad completa (RLS, rate limits, cabeceras) y barrido de datos mock restantes.
- F9.6 README: arranque, variables, migraciones, cómo actualizar los datos fiscales cada año.

## Resumen de esfuerzo

| Fase | Horas |
|---|---|
| F0 Preparación | 4 |
| F1 Supabase y auth | 18 |
| F2 Plataforma backend | 10 |
| F3 Motor fiscal | 48 |
| F4 Préstamos | 16 |
| F5 Cliente ↔ API | 24 |
| F6 Inversión y planificación | 40 |
| F7 Gastos, viajes, notificaciones | 22 |
| F8 Asistente | 10 |
| F9 Calidad y despliegue | 20 |
| **Total** | **~212 h** (rango 190–260) |

La estimación de F6–F7 es la menos firme: aún no he leído a fondo la mitad de esas páginas.

## Riesgos

- **Datos fiscales autonómicos:** lo más propenso a error. Mitigación: fuente por dato y puerta 3 con contraste manual tuyo.
- **Retención de nómina:** el algoritmo oficial de la AEAT es más complejo que la liquidación anual; si no lo implemento completo se etiqueta como estimación.
- **Cálculo en servidor:** cada cambio de input llama a la API. Mitigación: debounce, rate limit holgado para calculadoras y respuestas pequeñas.
- **RLS mal escrito** expone datos entre usuarios. Mitigación: test con dos usuarios en F1 y revisión en F9.
- **El trabajo actual sin commitear** podría perderse: F0.1 lo resuelve primero.
