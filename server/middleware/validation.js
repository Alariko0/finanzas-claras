/**
 * validation.js - Validaciones con express-validator
 * Middleware de validación para endpoints de la API
 */

const { body, validationResult } = require('express-validator')

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

/**
 * Validación para registro de usuario
 */
const registroValidator = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Introduce un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número'),
  handleValidationErrors
]

/**
 * Validación para login
 */
const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Introduce un correo electrónico válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  handleValidationErrors
]

/**
 * Validación para crear/actualizar cálculo
 */
const calculoValidator = [
  body('tipo')
    .isIn(['irpf', 'nomina', 'hipoteca', 'prestamo', 'inversion', 'gastos', 'viajes', 'jubilacion'])
    .withMessage('Tipo de cálculo no válido'),
  body('titulo')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  body('datosEntrada')
    .isObject()
    .withMessage('Los datos de entrada deben ser un objeto'),
  body('resultado')
    .isObject()
    .withMessage('El resultado debe ser un objeto'),
  handleValidationErrors
]

module.exports = {
  registroValidator,
  loginValidator,
  calculoValidator,
  handleValidationErrors
}
