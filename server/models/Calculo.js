const mongoose = require('mongoose')

/**
 * Calculo - Resultado guardado de un cálculo
 * Para historial de cálculos (Fase 3)
 */

const calculoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['irpf', 'nomina', 'hipoteca', 'prestamo', 'inversion', 'gastos'],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  datosEntrada: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  resultado: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  enlaceCompartido: {
    type: String,
    default: ''
  },
  visibilidad: {
    type: String,
    enum: ['privado', 'publico'],
    default: 'privado'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Calculo', calculoSchema)
