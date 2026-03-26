const mongoose = require('mongoose')

/**
 * IrpfConfig - Configuración de tramos IRPF por Comunidad Autónoma
 * Lógica fiscal 2025
 */

const irpfSchema = new mongoose.Schema({
  comunidad: {
    type: String,
    enum: [
      'Andalucía',
      'Aragón',
      'Asturias',
      'Baleares',
      'Canarias',
      'Cantabria',
      'Castilla y León',
      'Castilla-La Mancha',
      'Cataluña',
      'Ceuta',
      'Comunidad Valenciana',
      'Comunidad de Madrid',
      'Extremadura',
      'Galicia',
      'Illes Balears',
      'La Rioja',
      'Melilla',
      'Comunidad de Madrid',
      'Murcia',
      'Navarra',
      'País Vasco',
      'La Rioja',
      'Madrid'
    ],
    required: true
  },
  tramos: [{
    minimo: { type: Number, required: true },
    maximo: { type: Number, required: true },
    porcentaje: { type: Number, required: true },
    reducción: { type: Number, default: 0 }
  }],
  deduccionExemptas: {
    type: Number,
    default: 0
  },
  efectivoSolidario: {
    minimo: { type: Number, default: 0 },
    maximo: { type: Number, default: 0 },
    porcentaje: { type: Number, default: 2.5 }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('IrpfConfig', irpfSchema)
