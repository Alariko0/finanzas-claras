/**
 * Auth routes - Autenticación con JWT
 * Registro, Login y perfil de usuario
 *
 * @route POST /api/auth/register - Registrar usuario nuevo
 * @route POST /api/auth/login - Login y obtener JWT
 * @route GET /api/auth/profile - Obtener perfil usuario (con token)
 */

const express = require('express')
const router = express.Router()
const Usuario = require('../models/Usuario')
const jwt = require('jsonwebtoken')

/**
 * Validación de usuario
 */
const validateUser = (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y password son requeridos'
    })
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 8 caracteres'
    })
  }

  next()
}

/**
 * Registro de nuevo usuario
 */
router.post('/register', validateUser, async (req, res) => {
  try {
    const { nombre, email, password, rol = 'usuario' } = req.body

    // Verificar si email ya existe
    const usuarioExistente = await Usuario.findOne({ email })

    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      })
    }

    // Crear nuevo usuario
    const usuario = new Usuario({
      nombre,
      email,
      password,
      rol
    })

    // Guardar en base de datos
    await usuario.save()

    // Generar JWT
    const token = usuario.generateJWT()

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
        // No incluir password
      }
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    })
  }
})

/**
 * Login y obtener JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son requeridos'
      })
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email })

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      })
    }

    // Comparar password
    const isPasswordValid = await usuario.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      })
    }

    // Generar nuevo JWT
    const token = usuario.generateJWT()

    // Limpiar usuario (no incluir password)
    const usuarioData = usuario.toJSON()
    delete usuarioData.password

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: usuarioData
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: error.message
    })
  }
})

/**
 * Obtener perfil de usuario (con token JWT)
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    // Verificar si usuario existe
    const usuario = await Usuario.findById(req.usuario.id)
      .select('-password') // No incluir password

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      usuario: usuario.toJSON()
    })
  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    })
  }
})

/**
 * Middleware para verificar JWT
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado o inválido'
      })
    }

    const token = authHeader.split(' ')[1]

    const secret = process.env.JWT_SECRET || 'FC_SECRET_KEY_CHANGE_ME_IN_PRODUCTION'

    const decoded = jwt.verify(token, secret)

    req.usuario = decoded
    next()
  } catch (error) {
    console.error('Error verificando token:', error)
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    })
  }
}

/**
 * Limpiar todos los cálculos (endpoint de utilidad)
 */
router.delete('/clean-calculations', authenticate, async (req, res) => {
  try {
    // Verificar si usuario es admin
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo admins pueden limpiar datos'
      })
    }

    await Calculo.deleteMany({})

    res.json({
      success: true,
      message: 'Todos los cálculos han sido eliminados'
    })
  } catch (error) {
    console.error('Error limpiando cálculos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al limpiar cálculos',
      error: error.message
    })
  }
})

module.exports = router