/**
 * FinanzasClaras - Entry point del servidor
 * Carga entorno, valida configuración y arranca el servidor HTTP.
 */

require('dotenv').config()

const { leerConfig } = require('./config/supabase')

try {
  leerConfig()
} catch (error) {
  console.error(`❌ ${error.message}. El servidor no puede arrancar.`)
  process.exit(1)
}

const app = require('./app')
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`📡 API disponible en http://localhost:${PORT}/api`)
  console.log(`🏥 Salud en http://localhost:${PORT}/health`)
})
