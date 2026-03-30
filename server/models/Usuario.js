const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

/**
 * Usuario - Modelo de autenticación con JWT seguro
 * Implementación completa Fase 3+
 *
 * @see ../server/index.js - Configuración principal
 */

/**
 * Esquema de usuario con password hash
 */
const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, introduce un correo electrónico válido']
  },
  password: {
    type: String,
    required: true,
    minlength: 8, // Aumentado para seguridad
    select: false // No devolver en queries por defecto
  },
  rol: {
    type: String,
    enum: ['usuario', 'admin'],
    default: 'usuario'
  },
  preferencias: {
    modulo_hipotecas: { type: Boolean, default: true },
    modulo_inversion: { type: Boolean, default: true },
    modulo_viajes: { type: Boolean, default: true },
    modulo_jubilacion: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

/**
 * Hash password antes de guardar
 */
userSchema.pre('save', async function (next) {
  // Salt si password no está hashado
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

/**
 * Comprobar si password es correcto
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

/**
 * Generar JWT token
 */
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { id: this._id, email: this.email, rol: this.rol },
    process.env.JWT_SECRET || 'FC_SECRET_KEY_CHANGE_ME_IN_PRODUCTION',
    {
      expiresIn: '7d', // 7 días
      issuer: 'finanzas-claras'
    }
  )
}

/**
 * Validar email duplicado
 */
userSchema.index({ email: 1 }, { unique: true })

module.exports = mongoose.model('Usuario', userSchema)
