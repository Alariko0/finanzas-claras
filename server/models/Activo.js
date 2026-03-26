const mongoose = require('mongoose')

/**
 * Activo - Modelos de activos de inversión (inmobiliario, mobiliario)
 */

const activoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['inmobiliario', 'mobiliario', 'acciones', 'fondos', 'cripto'],
    required: true
  },
  adquisicionFecha: {
    type: Date,
    required: true
  },
  adquisicionPrecio: {
    type: Number,
    required: true
  },
  valorActual: {
    type: Number,
    default: 0
  },
  ingresos: {
    alquilerMensual: { type: Number, default: 0 },
    dividendos: { type: Number, default: 0 }
  },
  gastos: {
    mantenimiento: { type: Number, default: 0 },
    impuestos: { type: Number, default: 0 }
  },
  notas: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Activo', activoSchema)
