const express = require('express')
const router = express.Router()
const nominasController = require('../controllers/nominasController')
const { authenticate, conSupabaseUsuario } = require('../middleware/auth')
const { idValidator, nominaReciboValidator, nominaConsultaValidator } = require('../middleware/validation')

// Todas las rutas exigen sesión y usan el cliente del usuario (RLS)
router.use(authenticate, conSupabaseUsuario)

router.get('/', nominaConsultaValidator, nominasController.listar)
router.get('/resumen', nominaConsultaValidator, nominasController.resumen)
router.post('/', nominaReciboValidator, nominasController.crear)
router.put('/:id', idValidator, nominaReciboValidator, nominasController.actualizar)
router.delete('/:id', idValidator, nominasController.eliminar)

module.exports = router
