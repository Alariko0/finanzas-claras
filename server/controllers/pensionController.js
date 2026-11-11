const { estimarPensionJubilacion } = require('../services/pension/pensionJubilacion')
const { copiar, responderCalculo } = require('./responderCalculo')

// Lista blanca de campos: nunca se pasa req.body entero al servicio
const jubilacion = responderCalculo((b) =>
  estimarPensionJubilacion({
    ...copiar(b, [
      'fechaActual', 'edadActual', 'edadJubilacion', 'inflacion', 'baseMensualActual',
      'crecimientoBases', 'situacionMinimo', 'comunidad'
    ]),
    tramos: b.tramos?.map((t) => copiar(t, ['desde', 'hasta', 'baseMensual']))
  })
)

module.exports = { jubilacion }
