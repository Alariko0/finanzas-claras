const mongoose = require('mongoose')

/**
 * Usuario - Modelo de autenticación
 * Preparado para Fase 3 con JWT
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
    minlength: 6
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
  }
})

module.exports = mongoose.model('Usuario', userSchema)
