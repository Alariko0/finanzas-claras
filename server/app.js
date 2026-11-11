/**
 * app.js - Aplicación Express (sin listen ni conexión a BD)
 * Separada de index.js para poder testearla con Supertest.
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')

const app = express()

// Seguridad básica con helmet
app.use(helmet())

// CORS con orígenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  }
}))

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Protección contra inyección MongoDB (después de parsear el body)
app.use(mongoSanitize())

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use('/api/', limiter)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/calculos', require('./routes/calculos'))
app.use('/api/irpf', require('./routes/irpf'))
app.use('/api/nomina', require('./routes/nomina'))
app.use('/api/gastos', require('./routes/gastos'))
app.use('/api/hipotecas', require('./routes/hipotecas'))

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FinanzasClaras API está funcionando',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : (err.message || 'Error interno del servidor')
  })
})

module.exports = app
