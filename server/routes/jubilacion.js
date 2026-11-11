const express = require('express')
const router = express.Router()
const jubilacionController = require('../controllers/jubilacionController')
const { limitadorCalculos } = require('../middleware/rateLimit')
const { jubilacionProyeccionValidator, jubilacionPlanPrivadoValidator } = require('../middleware/validation')

// Calculadoras públicas: sin sesión, con límite propio y holgado.
router.use(limitadorCalculos)

router.post('/proyeccion', jubilacionProyeccionValidator, jubilacionController.proyeccion)
router.post('/plan-privado', jubilacionPlanPrivadoValidator, jubilacionController.planPrivado)

module.exports = router
