const { liquidacionIRPF } = require('../services/fiscal/liquidacionIRPF')
const { calcularNomina } = require('../services/fiscal/nomina')
const { liquidacionAhorro } = require('../services/fiscal/ahorro')
const { copiar, responderCalculo: responder } = require('./responderCalculo')

/*
 * Calculadoras fiscales públicas. Lista blanca de campos: nunca se pasa req.body entero al servicio.
 */

const PERSONA = ['edad', 'discapacidad', 'movilidadReducida']

// 'ninguna' equivale a no indicar discapacidad
const limpiarPersona = (p, extras = []) => {
  const r = copiar(p, [...PERSONA, ...extras])
  if (r.discapacidad === 'ninguna') delete r.discapacidad
  return r
}

const personas = (b) => ({
  contribuyente: b.contribuyente ? limpiarPersona(b.contribuyente) : undefined,
  descendientes: b.descendientes?.map((d) => limpiarPersona(d, ['computoPorMitad'])),
  ascendientes: b.ascendientes?.map((a) => limpiarPersona(a, ['compartidoCon']))
})

const irpf = responder((b) =>
  liquidacionIRPF({
    ...copiar(b, ['comunidad', 'rendimientoIntegro', 'cotizacionesSS', 'otrasRentas', 'movilidadGeografica']),
    ...personas(b)
  })
)

const nomina = responder((b) =>
  calcularNomina({
    ...copiar(b, [
      'brutoAnual', 'pagas', 'prorrateo', 'grupoCotizacion', 'contrato', 'contratoRetencion',
      'situacionFamiliar', 'tasaAccidentes', 'movilidadGeografica', 'prestamoVivienda'
    ]),
    ...personas(b)
  })
)

const ahorro = responder((b) =>
  liquidacionAhorro({
    ...copiar(b, ['comunidad', 'baseLiquidableAhorro', 'baseLiquidableGeneral']),
    ...personas(b)
  })
)

module.exports = { irpf, nomina, ahorro, personas }
