/**
 * FinanzasClaras - Servidor Backend (Express + MongoDB)
 *
 * Arquitectura MERN:
 * - Express: Servidor HTTP
 * - MongoDB: Base de datos documental
 * - Mongoose: ODM para MongoDB
 * - JWT: Autenticación
 * - bcryptjs: Hashing de contraseñas
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

// Configuración del servidor
const app = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finanzas-claras'

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting (preparado para Fase 3)
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 solicitudes por ventana
})
app.use('/api/', limiter)

// Routes
const authRoutes = require('./routes/auth')
const calculoRoutes = require('./routes/calculos')
const irpfRoutes = require('./routes/irpf')
const nominaRoutes = require('./routes/nomina')

// Definir rutas
app.use('/api/auth', authRoutes)
app.use('/api/calculos', calculoRoutes)
app.use('/api/irpf', irpfRoutes)
app.use('/api/nomina', nominaRoutes)

// Conexión a MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Conexión a MongoDB establecida'))
  .catch((err) => console.error('❌ Error de conexión a MongoDB:', err.message))

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FinanzasClaras API está funcionando',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`📡 API disponible en http://localhost:${PORT}/api`)
  console.log(`🏥 Salud en http://localhost:${PORT}/health`)
})

module.exports = app
