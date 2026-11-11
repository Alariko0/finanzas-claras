'use strict'

const { MINIMOS_ESTATALES, MINIMOS_AUTONOMICOS } = require('./datos2026')
const { aCentimos } = require('./escalas')

/*
 * Mínimo personal y familiar (LIRPF arts. 56 a 61) en céntimos enteros.
 * Reglas de edad y de cómputo tomadas del algoritmo de retenciones AEAT 2026 (págs. 9-28):
 *  - edad = 2026 − año de nacimiento (edad a 31-12-2026).
 *  - mayor de 65 / 75: edad ≥ 65 / ≥ 75.
 *  - descendiente: menor de 25 años, o con discapacidad a cualquier edad. Menor de 3: edad < 3.
 *  - descendientes ordenados del mayor al menor para asignar 1.º, 2.º, 3.º, 4.º y siguientes.
 *  - descendiente compartido con el otro progenitor: se computa por mitad.
 *  - ascendiente: ≥ 65 años o con discapacidad; el importe se reparte entre los que conviven.
 *
 * El que declara garantiza los requisitos que no se calculan (convivencia, rentas del
 * descendiente/ascendiente ≤ 8.000 €). Aquí solo se lista a quien los cumple.
 */

// Mínimos aplicables a un ámbito: 'estatal' o la clave de comunidad.
function resolverMinimos(ambito) {
  if (ambito === 'estatal') return MINIMOS_ESTATALES
  return { ...MINIMOS_ESTATALES, ...(MINIMOS_AUTONOMICOS[ambito] || {}) }
}

function gradoDiscapacidad(d) {
  return d === '65' ? 65 : d === '33' ? 33 : 0
}

// Importe de discapacidad + asistencia para una persona, en céntimos (sin dividir ni ponderar).
function discapacidadCentimos(m, grado, movilidadReducida, esDescendiente) {
  const base33 = esDescendiente && m.discapacidadDescendiente33 !== undefined ? m.discapacidadDescendiente33 : m.discapacidad33
  const base65 = esDescendiente && m.discapacidadDescendiente65 !== undefined ? m.discapacidadDescendiente65 : m.discapacidad65
  if (grado === 65) return aCentimos(base65) + aCentimos(m.asistencia)
  if (grado === 33) return aCentimos(base33) + (movilidadReducida ? aCentimos(m.asistencia) : 0)
  return 0
}

function calcularMinimos(ambito, personas = {}) {
  const m = resolverMinimos(ambito)
  const contribuyente = personas.contribuyente || {}
  const descendientes = personas.descendientes || []
  const ascendientes = personas.ascendientes || []

  // A. Contribuyente
  const edad = contribuyente.edad || 0
  let minContribuyente = aCentimos(m.contribuyente)
  if (edad >= 65) minContribuyente += aCentimos(m.contribuyenteMayor65)
  if (edad >= 75) minContribuyente += aCentimos(m.contribuyenteMayor75)

  // D1. Discapacidad del contribuyente
  const minDiscContribuyente = discapacidadCentimos(
    m, gradoDiscapacidad(contribuyente.discapacidad), !!contribuyente.movilidadReducida, false
  )

  // B. Descendientes (en medios céntimos para poder aplicar el 50 % sin decimales)
  const elegibles = descendientes
    .filter((d) => d.edad < 25 || gradoDiscapacidad(d.discapacidad) > 0)
    .sort((a, b) => b.edad - a.edad)
  let medios = 0
  let mediosDisc = 0
  elegibles.forEach((d, i) => {
    const factor = d.computoPorMitad ? 1 : 2 // medios de céntimo: entero = 2, mitad = 1
    const tramo = Math.min(i, m.descendientes.length - 1)
    medios += aCentimos(m.descendientes[tramo]) * factor
    if (d.edad < 3) medios += aCentimos(m.descendienteMenor3) * factor
    mediosDisc += discapacidadCentimos(m, gradoDiscapacidad(d.discapacidad), !!d.movilidadReducida, true) * factor
  })
  const minDescendientes = Math.round(medios / 2)
  const minDiscDescendientes = Math.round(mediosDisc / 2)

  // C. Ascendientes
  let asc = 0
  let ascDisc = 0
  ascendientes
    .filter((a) => a.edad >= 65 || gradoDiscapacidad(a.discapacidad) > 0)
    .forEach((a) => {
      const n = Math.max(1, a.compartidoCon || 1)
      if (a.edad >= 65) asc += aCentimos(m.ascendiente) / n
      if (a.edad >= 75) asc += aCentimos(m.ascendienteMayor75) / n
      ascDisc += discapacidadCentimos(m, gradoDiscapacidad(a.discapacidad), !!a.movilidadReducida, false) / n
    })
  const minAscendientes = Math.round(asc)
  const minDiscAscendientes = Math.round(ascDisc)

  const total =
    minContribuyente + minDiscContribuyente + minDescendientes + minDiscDescendientes + minAscendientes + minDiscAscendientes

  return {
    total,
    desglose: {
      contribuyente: minContribuyente,
      discapacidadContribuyente: minDiscContribuyente,
      descendientes: minDescendientes,
      discapacidadDescendientes: minDiscDescendientes,
      ascendientes: minAscendientes,
      discapacidadAscendientes: minDiscAscendientes
    }
  }
}

module.exports = { calcularMinimos, resolverMinimos }
