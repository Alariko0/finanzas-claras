const { proyectarJubilacion } = require('../services/jubilacion')
const { calcularPlanPensionesPrivado } = require('../services/fiscal/planPensionesPrivado')
const { personas } = require('./fiscalController')
const { copiar, responderCalculo } = require('./responderCalculo')

// Lista blanca de campos: nunca se pasa req.body entero al servicio
const proyeccion = responderCalculo((b) =>
  proyectarJubilacion(copiar(b, [
    'edadActual', 'edadJubilacion', 'ahorroActual', 'aportacionMensual', 'crecimientoAportacion',
    'rentabilidad', 'rentabilidadJubilacion', 'inflacion', 'tasaRetiro', 'rentaDeseadaMensual',
    'pensionPublicaMensual'
  ]))
)

// Plan de pensiones privado: datos de la nómina + supuestos de jubilación + aportaciones
const planPrivado = responderCalculo((b) =>
  calcularPlanPensionesPrivado({
    ...copiar(b, [
      'brutoAnual', 'grupoCotizacion', 'contrato', 'comunidad', 'movilidadGeografica',
      'edadActual', 'edadJubilacion', 'rentabilidad', 'rentabilidadJubilacion', 'inflacion',
      'crecimientoAportacion', 'tasaRetiro', 'pensionPublicaMensual',
      'aportacionAnual', 'contribucionEmpresaAnual', 'saldoActual'
    ]),
    ...personas(b)
  })
)

module.exports = { proyeccion, planPrivado }
