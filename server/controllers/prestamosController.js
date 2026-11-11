const { cuadroAmortizacion, amortizacionAnticipada } = require('../services/prestamos')
const { copiar, responderCalculo } = require('./responderCalculo')

// Lista blanca de campos: nunca se pasa req.body entero al servicio
const PRESTAMO = [
  'capital', 'tin', 'meses', 'fechaInicio', 'sistema', 'tipoInteres', 'mesesFijos', 'diferencial',
  'euribor', 'periodoRevision', 'primeraRevision', 'euriborFuturo'
]

const cuadro = responderCalculo((b) =>
  cuadroAmortizacion(copiar(b, [
    ...PRESTAMO, 'comisionApertura', 'gastosIniciales', 'gastosMensuales', 'escenariosEuribor'
  ]))
)

const amortizacion = responderCalculo((b) =>
  amortizacionAnticipada(copiar(b, [...PRESTAMO, 'mesAmortizacion', 'importe', 'modo', 'comisionPct', 'nuevoTin']))
)

module.exports = { cuadro, amortizacion }
