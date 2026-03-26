const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Usuario = require('../models/Usuario')

// Registro de usuario
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email })
    if (usuarioExistente) {
      return res.status(400).json({
        message: 'El correo electrónico ya está registrado'
      })
    }

    // Crear nuevo usuario con contraseña hash
    const usuario = new Usuario({
      nombre,
      email,
      password: bcrypt.hashSync(password, 10),
      preferencias: {
        modulo_hipotecas: true,
        modulo_inversion: true,
        modulo_viajes: true,
        modulo_jubilacion: true
      }
    })

    await usuario.save()

    // Generar JWT token
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al registrar usuario',
      error: error.message
    })
  }
})

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Buscar usuario
    const usuario = await Usuario.findOne({ email })
    if (!usuario) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      })
    }

    // Verificar contraseña
    const esContraseñaValida = bcrypt.compareSync(password, usuario.password)
    if (!esContraseñaValida) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      })
    }

    // Generar JWT token
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al iniciar sesión',
      error: error.message
    })
  }
})

// Obtener perfil de usuario
router.get('/perfil', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password')

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      })
    }

    res.json({
      usuario
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener perfil',
      error: error.message
    })
  }
})

// Middleware de autenticación
router.use((req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Falta el token de autenticación' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
})

module.exports = router
