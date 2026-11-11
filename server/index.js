/**
 * FinanzasClaras - Entry point del servidor
 * Carga entorno, conecta a la BD y arranca el servidor HTTP.
 */

require('dotenv').config()

const mongoose = require('mongoose')

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finanzas-claras'

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET no está definido en .env. El servidor no puede arrancar.')
  process.exit(1)
}

const app = require('./app')

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Conexión a MongoDB establecida'))
  .catch((err) => console.error('❌ Error de conexión a MongoDB:', err.message))

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`📡 API disponible en http://localhost:${PORT}/api`)
  console.log(`🏥 Salud en http://localhost:${PORT}/health`)
})
