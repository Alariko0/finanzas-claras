'use strict'

const datos = require('../services/fiscal/datos2026')
const { aCentimos, prepararEscala, cuotaEnUnidades, unidadesACentimos } = require('../services/fiscal/escalas')

// La cuota acumulada calculada de cada tramo debe coincidir con la cifra oficial publicada (±1 céntimo).
function comprobarEscala(tramos) {
  const escala = prepararEscala(tramos)
  tramos.forEach((t, i) => {
    if (t.cuotaPublicada === undefined) return
    const calculada = unidadesACentimos(cuotaEnUnidades(escala[i].desde, escala))
    expect(Math.abs(calculada - aCentimos(t.cuotaPublicada))).toBeLessThanOrEqual(1)
  })
}

describe('datos2026: cuotas publicadas = cuotas calculadas', () => {
  test('escala estatal general', () => comprobarEscala(datos.ESCALA_ESTATAL_GENERAL))
  test('escala del ahorro (por parte)', () => comprobarEscala(datos.ESCALA_AHORRO_POR_PARTE))
  test('escala de retención', () => comprobarEscala(datos.ESCALA_RETENCION))
  test.each(Object.keys(datos.ESCALAS_AUTONOMICAS))('escala autonómica %s', (clave) => {
    comprobarEscala(datos.ESCALAS_AUTONOMICAS[clave].tramos)
  })
})

describe('datos2026: estructura', () => {
  test('15 comunidades de régimen común', () => {
    expect(Object.keys(datos.ESCALAS_AUTONOMICAS)).toHaveLength(15)
  })
  test('toda escala empieza en 0 y es creciente', () => {
    Object.values(datos.ESCALAS_AUTONOMICAS).forEach(({ tramos }) => {
      expect(tramos[0].desde).toBe(0)
      tramos.slice(1).forEach((t, i) => expect(t.desde).toBeGreaterThan(tramos[i].desde))
    })
  })
  test('toda escala autonómica cita su fuente', () => {
    Object.values(datos.ESCALAS_AUTONOMICAS).forEach((e) => expect(e.fuente).toMatch(/\S/))
  })
  test('tipo total del ahorro: 19/21/23/27/30 %', () => {
    expect(datos.ESCALA_AHORRO_POR_PARTE.map((t) => t.tipo * 2)).toEqual([19, 21, 23, 27, 30])
  })
  test('cotización del trabajador 2026 = 6,50 % con desempleo indefinido', () => {
    const ss = datos.SEGURIDAD_SOCIAL
    const total = ss.contingenciasComunes.trabajador + ss.mei.trabajador + ss.desempleoIndefinido.trabajador + ss.formacionProfesional.trabajador
    expect(Math.round(total * 100) / 100).toBe(6.5)
  })
  test('mínimos con tope legal = estatal × 1,10 (Asturias, Valencia)', () => {
    ['asturias', 'valencia'].forEach((c) => {
      const m = datos.MINIMOS_AUTONOMICOS[c]
      expect(m.contribuyente).toBeCloseTo(datos.MINIMOS_ESTATALES.contribuyente * 1.1, 2)
      expect(m.discapacidad33).toBeCloseTo(datos.MINIMOS_ESTATALES.discapacidad33 * 1.1, 2)
      m.descendientes.forEach((v, i) => expect(v).toBeCloseTo(datos.MINIMOS_ESTATALES.descendientes[i] * 1.1, 2))
    })
  })
})
