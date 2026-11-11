const express = require('express')
const router = express.Router()
const conveniosController = require('../controllers/conveniosController')
const { limitadorCalculos } = require('../middleware/rateLimit')
const { convenioIdValidator, convenioRetribucionValidator } = require('../middleware/validation')

// Datos públicos de solo lectura: sin sesión, con el límite de las calculadoras
router.use(limitadorCalculos)

router.get('/', conveniosController.listar)
router.get('/:id', convenioIdValidator, conveniosController.obtener)
router.post('/:id/retribucion', convenioIdValidator, convenioRetribucionValidator, conveniosController.retribucion)

module.exports = router
