const express = require('express')
const router = express.Router()
const hogarController = require('../controllers/hogarController')
const { limitadorCalculos } = require('../middleware/rateLimit')
const { hogarRepartoValidator, hogarPresupuestoValidator } = require('../middleware/validation')

// Calculadoras públicas: sin sesión, con límite propio y holgado.
// Guardar gastos y presupuestos exigirá sesión y irá en rutas aparte.
router.use(limitadorCalculos)

router.post('/reparto', hogarRepartoValidator, hogarController.reparto)
router.post('/presupuesto', hogarPresupuestoValidator, hogarController.presupuesto)

module.exports = router
