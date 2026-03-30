# FinanzasClaras - Backend API

## Configuración Inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Clonar el archivo .env.example
cp .env.example .env

# 3. Editar .env con tus valores
# - MONGODB_URI: Tu conexión a MongoDB
# - JWT_SECRET: Genera un secreto seguro
# - ALLOWED_ORIGINS: URLs permitidas para CORS

# 4. Iniciar el servidor
npm run dev
```

## Estructura de la API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Obtener perfil (con token)

### Cálculos
- `GET /api/calculos` - Listar cálculos
- `GET /api/calculos/:id` - Obtener cálculo
- `POST /api/calculos` - Guardar cálculo
- `PUT /api/calculos/:id` - Actualizar cálculo
- `DELETE /api/calculos/:id` - Eliminar cálculo

### Hipotecas
- `GET /api/hipotecas` - Listar hipotecas
- `POST /api/hipotecas` - Guardar hipoteca

### IRPF
- `GET /api/irpf/config` - Configuración tramos
- `POST /api/irpf/calcular` - Calcular IRPF

### Nómina
- `GET /api/nomina/config` - Configuración nómina
- `POST /api/nomina/calcular` - Calcular nómina

## MongoDB Atlas

Si usas MongoDB Atlas:
1. Ve a https://cloud.mongodb.com/
2. Crea una nueva cluster gratuito
3. Copia la conexión de tu cluster
4. Edita `.env` con tu `MONGODB_URI`
5. Añade tu IP a la lista blanca de accesos

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servidor | 3001 |
| MONGODB_URI | Conexión a MongoDB | mongodb://localhost:27017/finanzas-claras |
| JWT_SECRET | Secret para JWT | finances-claras-dev-secret-key-2026 |
| JWT_EXPIRES_IN | Expiración token | 7d |
| SHARED_LINK_SECRET | Secret enlaces compartidos | finances-claras-dev-link-secret-2026 |
| ALLOWED_ORIGINS | CORS whitelist | http://localhost:5173,http://localhost:3000 |
| LOG_LEVEL | Nivel de logging | info |
| NODE_ENV | Entorno | development |

## Scripts de Desarrollo

```bash
# Desarrollo con nodemon
npm run dev

# Producción
npm start

# Lint
npm run lint
```

## Pruebas API

```bash
# Probar con curl
# Registro
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@ejemplo.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@ejemplo.com","password":"password123"}'
```

## Seguridad

- Contraseñas hashadas con bcryptjs
- JWT con expiración
- CORS configurado
- Rate limiting para proteger de ataques DDoS
- Validación de inputs

## Logs

Los logs se escriben en stderr. Para producción, configurar un logger con Winston o similar.

## Contribución

1. Clone el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abra un Pull Request