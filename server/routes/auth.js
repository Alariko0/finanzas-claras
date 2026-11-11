/**
 * Auth routes
 *
 * El registro, login, logout y refresco de sesión los hace el cliente con
 * Supabase Auth. El servidor solo expone el perfil del usuario autenticado.
 *
 * @route GET   /api/auth/profile - Obtener perfil
 * @route PATCH /api/auth/profile - Actualizar nombre y preferencias
 */

const express = require('express')
const router = express.Router()
const perfilController = require('../controllers/perfilController')
const { authenticate, conSupabaseUsuario } = require('../middleware/auth')
const { perfilValidator } = require('../middleware/validation')

router.use(authenticate, conSupabaseUsuario)

router.get('/profile', perfilController.obtener)
router.patch('/profile', perfilValidator, perfilController.actualizar)

module.exports = router
