/**
 * rateLimit.js - Límites de peticiones por IP
 *
 * - general: toda la API
 * - escritura: POST/PUT/PATCH/DELETE (más estricto)
 * - calculos: calculadoras públicas (se usan en la fase 3)
 *
 * Con proxy inverso hay que configurar TRUST_PROXY (nº de saltos) en app.js,
 * o todos los usuarios compartirán la IP del proxy.
 */

const rateLimit = require('express-rate-limit')

const MINUTO = 60 * 1000

/**
 * @param {Object} opciones
 * @param {number} opciones.windowMs - Ventana en ms
 * @param {number} opciones.max - Peticiones máximas por ventana
 * @param {string} opciones.mensaje - Mensaje del 429
 */
const crearLimitador = ({ windowMs, max, mensaje }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ success: false, message: mensaje })
    }
  })

const limitadorGeneral = crearLimitador({
  windowMs: 15 * MINUTO,
  max: 300,
  mensaje: 'Demasiadas solicitudes. Espera unos minutos.'
})

const limitadorEscritura = crearLimitador({
  windowMs: 15 * MINUTO,
  max: 60,
  mensaje: 'Demasiados cambios en poco tiempo. Espera unos minutos.'
})

// Las calculadoras se usan mientras el usuario teclea (con debounce): límite holgado
const limitadorCalculos = crearLimitador({
  windowMs: MINUTO,
  max: 120,
  mensaje: 'Demasiados cálculos seguidos. Espera un momento.'
})

const soloEscrituras = (limitador) => (req, res, next) =>
  ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? next() : limitador(req, res, next)

module.exports = {
  crearLimitador,
  limitadorGeneral,
  limitadorEscritura: soloEscrituras(limitadorEscritura),
  limitadorCalculos
}
