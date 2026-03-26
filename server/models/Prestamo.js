const mongoose = require('mongoose')

/**
 * Prestamo - Modelos de préstamos (hipotecas, personales)
 */

const prestamoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['hipoteca', 'personal', 'coche', 'vivienda'],
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  tasa: {
    type: Number,
    required: true
  },
  plazo: {
    type: Number,
    required: true
  },
  tipoPlazo: {
    type: String,
    enum: ['meses', 'anios'],
    default: 'meses'
  },
  amortizacionAnticipada: {
    tipo: {
      type: String,
      enum: ['porcentaje', 'valor', 'anual'],
      default: 'porcentaje'
    },
    valor: {
      type: Number
    },
    porcentaje: {
      type: Number
    },
    fecha: {
      type: Date
    },
    penalizacion: {
      type: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Prestamo', prestamoSchema)
