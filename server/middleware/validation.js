/**
 * validation.js - Validaciones con express-validator
 * Middleware de validación para endpoints de la API
 */

const { body, param, query, validationResult } = require('express-validator')

const TIPOS_CALCULO = [
  'irpf', 'nomina', 'hipoteca', 'prestamo', 'amortizacion',
  'inversion_inmobiliaria', 'inversion_mobiliaria', 'jubilacion', 'pensiones',
  'gastos', 'presupuesto', 'viaje'
]

const MODULOS_PREFERENCIAS = [
  'modulo_hipotecas', 'modulo_inversion', 'modulo_viajes', 'modulo_jubilacion'
]

// Límite de tamaño de los objetos JSON guardados (bytes serializados)
const MAX_JSON_BYTES = 50 * 1024

/**
 * Middleware que maneja errores de validación
 * Debe ir después de los validadores en la cadena de middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    })
  }
  next()
}

const esObjetoPlano = (valor) =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor)

const objetoJsonAcotado = (campo) =>
  body(campo)
    .custom(esObjetoPlano)
    .withMessage(`${campo} debe ser un objeto`)
    .bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage(`${campo} es demasiado grande`)

const idValidator = [
  param('id').isUUID().withMessage('Identificador no válido'),
  handleValidationErrors
]

const paginacionValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero ≥ 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100').toInt(),
  handleValidationErrors
]

/**
 * Crear cálculo
 */
const calculoValidator = [
  body('tipo').isIn(TIPOS_CALCULO).withMessage('Tipo de cálculo no válido'),
  body('titulo')
    .isString().withMessage('El título debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  objetoJsonAcotado('datosEntrada'),
  objetoJsonAcotado('resultado'),
  handleValidationErrors
]

/**
 * Actualizar cálculo: solo titulo, datosEntrada y resultado (todos opcionales)
 */
const calculoActualizarValidator = [
  body('titulo')
    .optional()
    .isString().withMessage('El título debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  body('datosEntrada').optional().custom(esObjetoPlano).withMessage('datosEntrada debe ser un objeto')
    .bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage('datosEntrada es demasiado grande'),
  body('resultado').optional().custom(esObjetoPlano).withMessage('resultado debe ser un objeto')
    .bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage('resultado es demasiado grande'),
  body().custom((valor) =>
    ['titulo', 'datosEntrada', 'resultado'].some((campo) => valor && valor[campo] !== undefined)
  ).withMessage('No hay campos que actualizar'),
  handleValidationErrors
]

/**
 * Actualizar perfil: nombre y preferencias de módulos
 */
const perfilValidator = [
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('preferencias')
    .optional()
    .custom((valor) =>
      esObjetoPlano(valor) &&
      Object.entries(valor).every(
        ([clave, v]) => MODULOS_PREFERENCIAS.includes(clave) && typeof v === 'boolean'
      )
    )
    .withMessage('Preferencias no válidas'),
  body().custom((valor) =>
    ['nombre', 'preferencias'].some((campo) => valor && valor[campo] !== undefined)
  ).withMessage('No hay campos que actualizar'),
  handleValidationErrors
]

module.exports = {
  TIPOS_CALCULO,
  MODULOS_PREFERENCIAS,
  handleValidationErrors,
  idValidator,
  paginacionValidator,
  calculoValidator,
  calculoActualizarValidator,
  perfilValidator
}
