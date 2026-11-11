const { repartoGastos } = require('../services/gastosHogar')
const { calcularPresupuesto } = require('../services/presupuesto')
const { copiar, responderCalculo } = require('./responderCalculo')

// Lista blanca de campos: nunca se pasa req.body entero al servicio
const reparto = responderCalculo((b) => repartoGastos(copiar(b, ['personas', 'gastosCompartidos', 'metodo'])))

const presupuesto = responderCalculo((b) =>
  calcularPresupuesto(copiar(b, [
    'modo', 'ingresoMensual', 'porcentajes', 'gastado', 'partidas', 'objetivoAhorro', 'ahorroActual'
  ]))
)

module.exports = { reparto, presupuesto }
