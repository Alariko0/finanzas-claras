const express = require('express')
const router = express.Router()
const calculoController = require('../controllers/calculoController')
const { authenticate } = require('../middleware/auth')
const { calculoValidator } = require('../middleware/validation')

// Aplicar autenticación a todas las rutas
router.use(authenticate)

// Rutas
router.get('/', calculoController.listar)
router.get('/:id', calculoController.obtener)
router.post('/', calculoValidator, calculoController.crear)
router.put('/:id', calculoController.actualizar)
router.delete('/:id', calculoController.eliminar)

module.exports = router
