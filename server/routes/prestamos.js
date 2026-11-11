const express = require('express')
const router = express.Router()
const prestamosController = require('../controllers/prestamosController')
const { limitadorCalculos } = require('../middleware/rateLimit')
const { prestamoCuadroValidator, prestamoAmortizacionValidator } = require('../middleware/validation')

// Calculadoras públicas: sin sesión, con límite propio y holgado.
// Guardar un cálculo exige sesión y va por /api/calculos.
router.use(limitadorCalculos)

router.post('/cuadro', prestamoCuadroValidator, prestamosController.cuadro)
router.post('/amortizacion', prestamoAmortizacionValidator, prestamosController.amortizacion)

module.exports = router
