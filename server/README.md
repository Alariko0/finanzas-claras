# FinanzasClaras - Backend API

API Express (CommonJS) sobre **Supabase** (Postgres + Auth). El registro, login, logout
y refresco de sesión los hace el cliente con Supabase Auth; el servidor verifica el JWT
y accede a la base de datos **como el usuario** (RLS activo).

## Configuración inicial

```bash
pnpm install
cp .env.example .env     # y rellena los valores (nunca subas .env)
pnpm dev
```

### Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `SUPABASE_URL` | URL del proyecto (Settings > API) | — (obligatoria) |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publishable (`sb_publishable_…`) | — (obligatoria) |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos, separados por coma | `http://localhost:3000` |
| `PORT` | Puerto del servidor | `3001` |
| `TRUST_PROXY` | Saltos de proxy de confianza (p. ej. `1` tras un balanceador); necesario para que el rate limit use la IP real | desactivado |
| `NODE_ENV` | Entorno (`production` oculta detalles de error) | `development` |

El servidor no usa la clave de servicio (`service_role`) en ninguna petición.

## Base de datos

El esquema y las políticas RLS están versionados en `supabase/migrations/`.
Cada tabla de usuario solo permite acceso a las filas con `user_id = auth.uid()`.

## API

Todas las rutas (salvo `/health` y los cálculos públicos) exigen `Authorization: Bearer <access_token>`.
Respuesta: `{ success, message?, data?, errors? }`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Liveness: el proceso responde |
| GET | `/health/ready` | Readiness: Supabase alcanzable (200/503) |
| GET | `/api/auth/profile` | Perfil del usuario autenticado |
| PATCH | `/api/auth/profile` | Actualizar `nombre` y `preferencias` |
| GET | `/api/calculos?page&limit` | Listar cálculos propios (paginado) |
| GET | `/api/calculos/:id` | Obtener un cálculo |
| POST | `/api/calculos` | Guardar (`tipo`, `titulo`, `datosEntrada`, `resultado`) |
| PUT | `/api/calculos/:id` | Actualizar `titulo`, `datosEntrada`, `resultado` |
| DELETE | `/api/calculos/:id` | Eliminar |

Los cálculos fiscales y financieros viven como funciones puras en `server/services/` (hoy
`services/fiscal/`: datos 2026 con fuente, escalas, mínimos y `liquidacionIRPF`). Los endpoints
`/api/fiscal/*` y los préstamos se añaden en las fases 3 y 4 del desarrollo.

## Scripts

```bash
pnpm dev     # nodemon
pnpm start   # producción
pnpm lint    # ESLint
pnpm test    # Jest + Supertest
```

## Seguridad

- JWT de Supabase verificado con las claves públicas (JWKS), emisor, audiencia y algoritmo.
- El rol de administrador solo se lee de `app_metadata` (no editable por el usuario).
- RLS en todas las tablas; el servidor actúa con el token del usuario.
- Validación con `express-validator` y lista blanca de campos en cada escritura.
- CORS restringido, `helmet`, rate limiting y errores sin detalles internos en producción.
