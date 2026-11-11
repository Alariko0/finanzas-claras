const express = require('express')
const router = express.Router()
const fiscalController = require('../controllers/fiscalController')
const { limitadorCalculos } = require('../middleware/rateLimit')
const {
  fiscalIrpfValidator,
  fiscalNominaValidator,
  fiscalAhorroValidator
} = require('../middleware/validation')

// Calculadoras públicas: sin sesión, con límite propio y holgado
router.use(limitadorCalculos)

router.post('/irpf', fiscalIrpfValidator, fiscalController.irpf)
router.post('/nomina', fiscalNominaValidator, fiscalController.nomina)
router.post('/ahorro', fiscalAhorroValidator, fiscalController.ahorro)

module.exports = router
