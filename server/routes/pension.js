const express = require('express')
const router = express.Router()
const pensionController = require('../controllers/pensionController')
const { limitadorCalculos } = require('../middleware/rateLimit')
const { pensionJubilacionValidator } = require('../middleware/validation')

// Calculadora pública: sin sesión, con límite propio y holgado.
router.use(limitadorCalculos)

router.post('/jubilacion', pensionJubilacionValidator, pensionController.jubilacion)

module.exports = router
