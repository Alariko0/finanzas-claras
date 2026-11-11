const express = require('express')
const router = express.Router()
const calculoController = require('../controllers/calculoController')
const { authenticate, conSupabaseUsuario } = require('../middleware/auth')
const {
  calculoValidator,
  calculoActualizarValidator,
  idValidator,
  paginacionValidator
} = require('../middleware/validation')

// Todas las rutas exigen sesión y usan el cliente del usuario (RLS)
router.use(authenticate, conSupabaseUsuario)

router.get('/', paginacionValidator, calculoController.listar)
router.get('/:id', idValidator, calculoController.obtener)
router.post('/', calculoValidator, calculoController.crear)
router.put('/:id', idValidator, calculoActualizarValidator, calculoController.actualizar)
router.delete('/:id', idValidator, calculoController.eliminar)

module.exports = router
