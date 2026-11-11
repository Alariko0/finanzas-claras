/**
 * app.js - Aplicación Express (sin listen)
 * Separada de index.js para poder testearla con Supertest.
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { limitadorGeneral, limitadorEscritura } = require('./middleware/rateLimit')

const app = express()

// Detrás de un proxy inverso: TRUST_PROXY = nº de saltos de confianza (p. ej. 1)
const saltosProxy = Number.parseInt(process.env.TRUST_PROXY, 10)
if (Number.isInteger(saltosProxy) && saltosProxy > 0) {
  app.set('trust proxy', saltosProxy)
}

app.disable('x-powered-by')

// Seguridad básica con helmet
app.use(helmet())

// CORS con orígenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3000']
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  }
}))

// Body parser con límite explícito
app.use(express.json({ limit: '100kb' }))

// Salud (sin rate limit para que los balanceadores no se bloqueen)
app.use(require('./routes/health'))

// Rate limiting: general para toda la API y más estricto en escrituras
app.use('/api/', limitadorGeneral)
app.use('/api/', limitadorEscritura)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/calculos', require('./routes/calculos'))

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' })
})

// Error handling middleware (último)
app.use((err, req, res, _next) => {
  // JSON mal formado o demasiado grande → error del cliente, no 500
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'JSON no válido' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Petición demasiado grande' })
  }

  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : (err.message || 'Error interno del servidor')
  })
})

module.exports = app
