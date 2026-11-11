'use strict'

const { calcularNomina } = require('../services/fiscal/nomina')
const { ErrorEntrada } = require('../services/fiscal/liquidacionIRPF')

/*
 * Valores esperados calculados a mano (porcentajes de la Orden PJC/297/2026 aplicados a la base
 * mensual), no con el código del servicio. Pendiente de contrastar con una nómina real.
 */

const base = { brutoAnual: 30000, contribuyente: { edad: 35 } }

describe('calcularNomina — Seguridad Social', () => {
  test('30.000 €: trabajador 6,50 % (162,50 €/mes) y empresa 30,65 % (766,25 €/mes)', () => {
    // Base 2.500: CC 117,50 + MEI 3,75 + desempleo 38,75 + FP 2,50 = 162,50
    // Empresa: CC 590 + MEI 18,75 + desempleo 137,50 + FOGASA 5 + FP 15 = 766,25
    const r = calcularNomina({ ...base, pagas: 12 })
    expect(r.seguridadSocial.baseCotizacionMensual).toBe(2500)
    expect(r.seguridadSocial.trabajadorMensual).toEqual({
      contingenciasComunes: 117.5, mei: 3.75, desempleo: 38.75, formacionProfesional: 2.5
    })
    expect(r.seguridadSocial.totalTrabajadorAnual).toBe(1950)
    expect(r.seguridadSocial.totalEmpresaAnual).toBe(9195)
    expect(r.costeEmpresaAnual).toBe(39195)
  })

  test('contrato temporal: desempleo 1,60 % trabajador y 6,70 % empresa', () => {
    const r = calcularNomina({ ...base, pagas: 12, contrato: 'temporal' })
    expect(r.seguridadSocial.trabajadorMensual.desempleo).toBe(40)
    expect(r.seguridadSocial.empresaMensual.desempleo).toBe(167.5)
  })

  test('por debajo de la base mínima del grupo 1 se cotiza por 1.989,30 €', () => {
    // 18.000/12 = 1.500 < 1.989,30. CC 93,50 + MEI 2,98 + desempleo 30,83 + FP 1,99 = 129,30
    const r = calcularNomina({ brutoAnual: 18000, pagas: 12, grupoCotizacion: 1, contribuyente: { edad: 35 } })
    expect(r.seguridadSocial.baseCotizacionMensual).toBe(1989.3)
    expect(r.seguridadSocial.totalTrabajadorAnual).toBe(1551.6)
  })

  test('por encima de la base máxima: base 5.101,20 € y solidaridad por tramos', () => {
    // 120.000/12 = 10.000. Exceso 4.898,80 en tramos de 510,12 (1,15 %), 2.040,48 (1,25 %) y 2.348,20 (1,46 %)
    // Trabajador: 510,12×0,19 % + 2.040,48×0,21 % + 2.348,20×0,24 % = 10,889916 → 10,89
    // Empresa: 510,12×0,96 % + 2.040,48×1,04 % + 2.348,20×1,22 % = 54,766184 → 54,77
    const r = calcularNomina({ brutoAnual: 120000, pagas: 12, contribuyente: { edad: 35 } })
    const m = r.seguridadSocial.trabajadorMensual
    expect(r.seguridadSocial.baseCotizacionMensual).toBe(5101.2)
    expect(m.contingenciasComunes).toBe(239.76)
    expect(m.mei).toBe(7.65)
    expect(m.desempleo).toBe(79.07)
    expect(m.formacionProfesional).toBe(5.1)
    expect(m.solidaridad).toBe(10.89)
    expect(r.seguridadSocial.empresaMensual.solidaridad).toBe(54.77)
  })

  test('accidentes de trabajo solo si se indica la tasa', () => {
    const sin = calcularNomina({ ...base, pagas: 12 })
    const con = calcularNomina({ ...base, pagas: 12, tasaAccidentes: 1.5 })
    expect(sin.seguridadSocial.empresaMensual.accidentesTrabajo).toBeUndefined()
    expect(con.seguridadSocial.empresaMensual.accidentesTrabajo).toBe(37.5)
  })
})

describe('calcularNomina — IRPF y neto', () => {
  test('30.000 € en 12 pagas: tipo 16,42 %, IRPF 4.926 €, neto 23.124 € (1.927 €/mes)', () => {
    // RNT = 30.000 − 1.950 = 28.050; − 2.000 = 26.050. Cuota1 = 4.225,50 + 5.850 × 0,30 = 5.980,50
    // Cuota = 5.980,50 − 1.054,50 = 4.926 → 16,42 % exacto
    const r = calcularNomina({ ...base, pagas: 12 })
    expect(r.irpf.tipo).toBe(16.42)
    expect(r.irpf.importeAnual).toBe(4926)
    expect(r.netoAnual).toBe(23124)
    expect(r.paga.ordinaria).toEqual({ bruto: 2500, ss: 162.5, irpf: 410.5, neto: 1927 })
    expect(r.paga.extra).toBeUndefined()
  })

  test('14 pagas sin prorrateo: la paga extra solo lleva IRPF', () => {
    // Bruto por paga 2.142,86; IRPF 16,42 % = 351,86; ordinaria: − SS 162,50
    const r = calcularNomina({ ...base, pagas: 14, prorrateo: false })
    expect(r.paga.cantidad).toBe(14)
    expect(r.paga.ordinaria).toEqual({ bruto: 2142.86, ss: 162.5, irpf: 351.86, neto: 1628.5 })
    expect(r.paga.extra).toEqual({ bruto: 2142.86, ss: 0, irpf: 351.86, neto: 1791 })
  })

  test('14 pagas prorrateadas = 12 pagos mensuales idénticos a los de 12 pagas', () => {
    const a = calcularNomina({ ...base, pagas: 14, prorrateo: true })
    const b = calcularNomina({ ...base, pagas: 12 })
    expect(a.paga).toEqual(b.paga)
    expect(a.netoAnual).toBe(b.netoAnual)
  })

  test('el IRPF usa la SS del trabajador como gasto deducible', () => {
    const r = calcularNomina({ ...base, pagas: 12 })
    expect(r.irpf.baseRetencion).toBe(26050)
  })

  test('hijos: el mínimo familiar baja la retención', () => {
    const sin = calcularNomina({ ...base, pagas: 12 })
    const con = calcularNomina({ ...base, pagas: 12, descendientes: [{ edad: 5 }] })
    expect(con.irpf.tipo).toBeLessThan(sin.irpf.tipo)
  })

  test('siempre incluye avisos de estimación', () => {
    expect(calcularNomina({ ...base }).avisos.length).toBeGreaterThan(1)
  })
})

describe('calcularNomina — validación', () => {
  test('entradas inválidas lanzan ErrorEntrada', () => {
    expect(() => calcularNomina({})).toThrow(ErrorEntrada)
    expect(() => calcularNomina({ ...base, pagas: 13 })).toThrow(ErrorEntrada)
    expect(() => calcularNomina({ ...base, grupoCotizacion: 12 })).toThrow(ErrorEntrada)
    expect(() => calcularNomina({ ...base, contrato: 'fijo' })).toThrow(ErrorEntrada)
    expect(() => calcularNomina({ ...base, tasaAccidentes: -1 })).toThrow(ErrorEntrada)
  })
})
