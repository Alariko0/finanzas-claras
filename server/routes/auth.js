/**
 * Auth routes - Autenticación con JWT
 *
 * @route POST /api/auth/register - Registrar usuario nuevo
 * @route POST /api/auth/login - Login y obtener JWT
 * @route GET /api/auth/profile - Obtener perfil usuario (con token)
 * @route DELETE /api/auth/clean-calculations - Limpiar cálculos (admin only)
 */

const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { registroValidator, loginValidator } = require('../middleware/validation')

// Rutas
router.post('/register', registroValidator, authController.registro)
router.post('/login', loginValidator, authController.login)
router.get('/profile', authenticate, authController.perfil)
router.delete('/clean-calculations', authenticate, authController.limpiarCalculos)

module.exports = router
