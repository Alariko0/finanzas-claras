/**
 * Middleware de autenticación JWT
 * Verifica token y añade req.usuario
 */

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no definido. Configura el archivo .env')
  process.exit(1)
}

/**
 * Verifica JWT y añade usuario al request
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado o inválido'
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, JWT_SECRET)

    req.usuario = decoded
    next()
  } catch (error) {
    console.error('Error verificando token:', error)
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    })
  }
}

module.exports = { authenticate, JWT_SECRET }
