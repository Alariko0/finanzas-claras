/**
 * Middleware de autenticación con JWT de Supabase Auth
 *
 * Verifica la firma con las claves públicas (JWKS) del proyecto, el emisor
 * y la audiencia. No hay secretos compartidos en el servidor.
 */

const { createRemoteJWKSet, jwtVerify } = require('jose')
const { leerConfig, clienteParaUsuario } = require('../config/supabase')

const ALGORITMOS = ['ES256', 'RS256']

/**
 * Crea un middleware que verifica el Bearer token.
 * @param {Object} [opciones]
 * @param {Function|Object} [opciones.getKey] - Clave o función de claves (por defecto, JWKS de Supabase)
 * @param {string} [opciones.issuer] - Emisor esperado
 */
function crearAutenticador({ getKey, issuer } = {}) {
  let clave = getKey
  let emisor = issuer

  const resolver = () => {
    if (!clave || !emisor) {
      const { url } = leerConfig()
      emisor = emisor || `${url}/auth/v1`
      clave = clave || createRemoteJWKSet(new URL(`${emisor}/.well-known/jwks.json`))
    }
    return { clave, emisor }
  }

  return async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado o inválido'
      })
    }

    const token = authHeader.slice('Bearer '.length).trim()

    try {
      const { clave: k, emisor: iss } = resolver()
      const { payload } = await jwtVerify(token, k, {
        issuer: iss,
        audience: 'authenticated',
        algorithms: ALGORITMOS
      })

      if (!payload.sub) {
        throw new Error('Token sin sub')
      }

      req.user = {
        id: payload.sub,
        email: payload.email,
        // El rol solo se lee de app_metadata (el usuario no puede editarlo)
        rol: payload.app_metadata?.rol === 'admin' ? 'admin' : 'usuario'
      }
      req.token = token
      return next()
    } catch (error) {
      console.warn('Token rechazado:', error.code || error.message)
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      })
    }
  }
}

/**
 * Adjunta a la petición un cliente de Supabase que actúa como el usuario.
 * Debe ir después de authenticate.
 */
function conSupabaseUsuario(req, res, next) {
  try {
    req.supabase = clienteParaUsuario(req.token)
    next()
  } catch (error) {
    console.error('Error configurando Supabase:', error.message)
    res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

/**
 * Solo permite el paso a administradores. Debe ir después de authenticate.
 */
function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso denegado' })
  }
  next()
}

module.exports = {
  authenticate: crearAutenticador(),
  crearAutenticador,
  conSupabaseUsuario,
  requireAdmin
}
