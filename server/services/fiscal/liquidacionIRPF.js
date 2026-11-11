'use strict'

const datos = require('./datos2026')
const { aCentimos, prepararEscala, cuotaConMinimo } = require('./escalas')
const { calcularMinimos } = require('./minimos')

/*
 * Liquidación del IRPF, base general, rendimientos del trabajo — ejercicio 2026.
 *   rendimiento íntegro − cotizaciones SS − otros gastos − reducción art. 20 = base liquidable general
 *   cuota íntegra = (escala estatal sobre BL − escala sobre mínimo estatal)
 *                 + (escala autonómica sobre BL − escala sobre mínimo autonómico)
 * No incluye deducciones ni retenciones: es la cuota íntegra, no el resultado de la declaración.
 *
 * Función pura, importes de entrada y salida en euros; internamente céntimos enteros.
 * ESTIMACIÓN: hay que mostrarla con `fechaDatos`.
 */

const ESCALA_ESTATAL = prepararEscala(datos.ESCALA_ESTATAL_GENERAL)
const ESCALAS_AUTONOMICAS = Object.fromEntries(
  Object.entries(datos.ESCALAS_AUTONOMICAS).map(([clave, v]) => [clave, prepararEscala(v.tramos)])
)

// Comunidades con mínimos propios sin cifra oficial 2026 (ver datos2026.js, MINIMOS_AUTONOMICOS).
const MINIMOS_POR_CONTRASTAR = ['andalucia', 'galicia', 'canarias', 'madrid']

const COMUNIDADES_SOPORTADAS = Object.keys(datos.ESCALAS_AUTONOMICAS)
const COMUNIDADES_NO_SOPORTADAS = Object.keys(datos.REGIMENES_NO_SOPORTADOS)

class ErrorEntrada extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'ErrorEntrada'
  }
}

function importe(valor, nombre, { minimo = 0 } = {}) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < minimo) {
    throw new ErrorEntrada(`${nombre} debe ser un número ≥ ${minimo}`)
  }
  return valor
}

function gradoDiscapacidad(d) {
  return d === '65' ? 65 : d === '33' ? 33 : 0
}

// Reducción por obtención de rendimientos del trabajo (LIRPF art. 20), céntimos.
function reduccionArticulo20(rntCentimos, otrasRentasCentimos) {
  const r = datos.REDUCCION_TRABAJO
  if (otrasRentasCentimos > aCentimos(r.limiteOtrasRentas)) return 0
  const rnt = rntCentimos
  if (rnt >= aCentimos(r.tramo3Hasta)) return 0
  if (rnt <= aCentimos(r.hastaRendimiento)) return aCentimos(r.maxima)
  if (rnt <= aCentimos(r.tramo2Hasta)) {
    return Math.round(aCentimos(r.maxima) - r.coeficienteTramo2 * (rnt - aCentimos(r.hastaRendimiento)))
  }
  return Math.round(aCentimos(r.baseTramo3) - r.coeficienteTramo3 * (rnt - aCentimos(r.tramo2Hasta)))
}

// Otros gastos deducibles (LIRPF art. 19.2.f), céntimos.
function otrosGastos({ movilidadGeografica, contribuyente, rntCentimos }) {
  const g = datos.GASTOS_TRABAJO
  let total = aCentimos(g.otrosGastos)
  if (movilidadGeografica) total += aCentimos(g.incrementoMovilidadGeografica)
  const grado = gradoDiscapacidad(contribuyente.discapacidad)
  if (grado === 65 || (grado === 33 && contribuyente.movilidadReducida)) {
    total += aCentimos(g.incrementoDiscapacidad65OMovilidad)
  } else if (grado === 33) {
    total += aCentimos(g.incrementoDiscapacidad33)
  }
  return Math.min(total, Math.max(0, rntCentimos)) // límite: rendimiento tras cotizaciones
}

function liquidacionIRPF(entrada = {}) {
  const comunidad = entrada.comunidad

  if (COMUNIDADES_NO_SOPORTADAS.includes(comunidad)) {
    return {
      soportado: false,
      aviso: datos.REGIMENES_NO_SOPORTADOS[comunidad],
      ejercicio: datos.EJERCICIO,
      fechaDatos: datos.FECHA_DATOS
    }
  }
  if (!COMUNIDADES_SOPORTADAS.includes(comunidad)) {
    throw new ErrorEntrada('comunidad no reconocida')
  }

  const rendimiento = aCentimos(importe(entrada.rendimientoIntegro, 'rendimientoIntegro'))
  const cotizaciones = aCentimos(importe(entrada.cotizacionesSS ?? 0, 'cotizacionesSS'))
  const otrasRentas = aCentimos(importe(entrada.otrasRentas ?? 0, 'otrasRentas'))
  if (cotizaciones > rendimiento) throw new ErrorEntrada('cotizacionesSS no puede superar rendimientoIntegro')

  const contribuyente = entrada.contribuyente || {}
  const personas = {
    contribuyente,
    descendientes: entrada.descendientes || [],
    ascendientes: entrada.ascendientes || []
  }

  // Rendimiento neto previo (base de la reducción del art. 20)
  const rnt = rendimiento - cotizaciones
  const gastos = otrosGastos({ movilidadGeografica: !!entrada.movilidadGeografica, contribuyente, rntCentimos: rnt })
  const reduccion = reduccionArticulo20(rnt, otrasRentas)
  const baseLiquidableGeneral = Math.max(0, rnt - gastos - reduccion)

  const minEstatal = calcularMinimos('estatal', personas)
  const minAutonomico = calcularMinimos(comunidad, personas)

  const cuotaEstatal = cuotaConMinimo(baseLiquidableGeneral, minEstatal.total, ESCALA_ESTATAL)
  const cuotaAutonomica = cuotaConMinimo(baseLiquidableGeneral, minAutonomico.total, ESCALAS_AUTONOMICAS[comunidad])
  const cuotaIntegra = cuotaEstatal + cuotaAutonomica

  const avisos = [
    'Estimación con la normativa de 2026. No incluye deducciones ni retenciones practicadas.'
  ]
  if (MINIMOS_POR_CONTRASTAR.includes(comunidad)) {
    avisos.push('Los mínimos autonómicos de esta comunidad son los de 2025 y están pendientes de confirmar para 2026.')
  }

  const euros = (c) => c / 100
  return {
    soportado: true,
    ejercicio: datos.EJERCICIO,
    fechaDatos: datos.FECHA_DATOS,
    comunidad,
    rendimientoNetoPrevio: euros(rnt),
    otrosGastos: euros(gastos),
    reduccionTrabajo: euros(reduccion),
    baseLiquidableGeneral: euros(baseLiquidableGeneral),
    minimoEstatal: euros(minEstatal.total),
    minimoAutonomico: euros(minAutonomico.total),
    cuotaEstatal: euros(cuotaEstatal),
    cuotaAutonomica: euros(cuotaAutonomica),
    cuotaIntegra: euros(cuotaIntegra),
    tipoMedio: baseLiquidableGeneral > 0 ? Math.round((cuotaIntegra / baseLiquidableGeneral) * 10000) / 100 : 0,
    avisos
  }
}

module.exports = {
  liquidacionIRPF,
  ErrorEntrada,
  COMUNIDADES_SOPORTADAS,
  COMUNIDADES_NO_SOPORTADAS,
  importe,
  reduccionArticulo20,
  otrosGastos
}
