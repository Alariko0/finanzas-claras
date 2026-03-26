const mongoose = require('mongoose')

/**
 * NominaConfig - Configuración para cálculo de nóminas
 * Convenios colectivos y retenciones 2025
 */

const nominaSchema = new mongoose.Schema({
  convenio: {
    type: String,
    enum: [
      'General',
      'Metalurgia',
      'Comercio',
      'Osteópatas',
      'Enfermería',
      'Abogados',
      'Médicos',
      'Arquitectos',
      'Docentes',
      'Otro'
    ],
    required: true
  },
  tiposRetenciones: {
    cta: { type: Number, default: 0 }, // Cotización a cargo trabajador
    cea: { type: Number, default: 0 }, // Cotización empresa
    retenIrf: { type: Number, default: 0 } // Retención IRPF
  },
  bases: {
    baseMinimo: { type: Number, default: 1265.5 }, // 2025
    baseMaximo: { type: Number, default: 100000 }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('NominaConfig', nominaSchema)
