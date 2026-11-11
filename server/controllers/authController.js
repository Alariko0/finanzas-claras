/**
 * authController.js - Controlador de autenticación
 * Registro, Login, Perfil y utilidades de admin
 */

const Usuario = require('../models/Usuario')
const Calculo = require('../models/Calculo')

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
exports.registro = async (req, res) => {
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
    const usuario = new Usuario({ nombre, email, password, rol })
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
      }
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Login y obtener JWT
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Obtener perfil de usuario (con token JWT)
 * GET /api/auth/profile
 */
exports.perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password')

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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Limpiar todos los cálculos (admin only)
 * DELETE /api/auth/clean-calculations
 */
exports.limpiarCalculos = async (req, res) => {
  try {
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
