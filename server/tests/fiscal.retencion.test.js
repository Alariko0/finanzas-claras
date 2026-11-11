'use strict'

const { estimarRetencionNomina } = require('../services/fiscal/retencionNomina')
const { ErrorEntrada } = require('../services/fiscal/liquidacionIRPF')

/*
 * Valores esperados calculados a mano siguiendo el algoritmo de la AEAT 2026 (págs. 22-33),
 * no con el código del servicio. Pendiente de contrastar con el simulador de la AEAT (Puerta 3).
 */

describe('estimarRetencionNomina', () => {
  test('30.000 €, soltero sin hijos, SS 1.905 €: tipo 16,46 %', () => {
    // RNT 28.095 − 2.000 = 26.095 (art. 20 = 0). Cuota1 = 4.225,50 + 5.895 × 0,30 = 5.994
    // Cuota2 = 5.550 × 0,19 = 1.054,50. Cuota = 4.939,50 → 16,465 → trunca 16,46. Importe 4.938,00.
    const r = estimarRetencionNomina({ retribucionAnual: 30000, cotizacionesSS: 1905, contribuyente: { edad: 35 } })
    expect(r.exento).toBe(false)
    expect(r.baseRetencion).toBe(26095)
    expect(r.cuota).toBe(4939.5)
    expect(r.tipo).toBe(16.46)
    expect(r.importeAnual).toBe(4938)
  })

  test('15.000 € situación 3 sin hijos: exento (≤ 15.876 €)', () => {
    const r = estimarRetencionNomina({ retribucionAnual: 15000, cotizacionesSS: 952.5, contribuyente: { edad: 35 } })
    expect(r.exento).toBe(true)
    expect(r.tipo).toBe(0)
    expect(r.importeAnual).toBe(0)
  })

  test('16.000 €: la cuota 68,97 queda limitada al 43 % del exceso (53,32) → tipo 0,33 %', () => {
    // RNT 14.984; art. 20 = 7.302 − 1,75 × 132 = 7.071; base = 14.984 − 2.000 − 7.071 = 5.913
    // Cuota = 5.913 × 0,19 − 1.054,50 = 68,97; límite = (16.000 − 15.876) × 0,43 = 53,32
    const r = estimarRetencionNomina({ retribucionAnual: 16000, cotizacionesSS: 1016, contribuyente: { edad: 35 } })
    expect(r.reduccionTrabajo).toBe(7071)
    expect(r.cuota).toBe(53.32)
    expect(r.tipo).toBe(0.33)
    expect(r.importeAnual).toBe(52.8)
    expect(r.avisos.join(' ')).toMatch(/43 %/)
  })

  test('40.000 € con 3 hijos (10, 7 y 2 años): reducción de 600 € y mínimo 17.450 €', () => {
    // RNT 37.460 − 2.000 = 35.460; − 600 = 34.860. Cuota1 = 4.225,50 + 14.660 × 0,30 = 8.623,50
    // Mínimo = 5.550 + (2.400 + 2.700 + 4.000) + 2.800 = 17.450 → cuota2 = 2.365,50 + 5.000 × 0,24 = 3.565,50
    // Cuota = 5.058 → 12,645 → 12,64. Importe 5.056,00.
    const r = estimarRetencionNomina({
      retribucionAnual: 40000,
      cotizacionesSS: 2540,
      contribuyente: { edad: 38 },
      descendientes: [{ edad: 10 }, { edad: 7 }, { edad: 2 }]
    })
    expect(r.minimoPersonalFamiliar).toBe(17450)
    expect(r.baseRetencion).toBe(34860)
    expect(r.cuota).toBe(5058)
    expect(r.tipo).toBe(12.64)
    expect(r.importeAnual).toBe(5056)
  })

  test('contrato especial: mínimo del 15 %', () => {
    const r = estimarRetencionNomina({
      retribucionAnual: 16000, cotizacionesSS: 1016, contrato: 'especial', contribuyente: { edad: 35 }
    })
    expect(r.tipo).toBe(15)
    expect(r.importeAnual).toBe(2400)
  })

  test('contrato de duración inferior a un año: mínimo del 2 %', () => {
    const r = estimarRetencionNomina({
      retribucionAnual: 16000, cotizacionesSS: 1016, contrato: 'inferiorAnio', contribuyente: { edad: 35 }
    })
    expect(r.tipo).toBe(2)
  })

  test('préstamo de vivienda: resta el 2 % de la retribución a la cuota', () => {
    // 30.000 €: minoPago = 600 → (4.939,50 − 600) / 30.000 = 14,465 → 14,46
    const r = estimarRetencionNomina({
      retribucionAnual: 30000, cotizacionesSS: 1905, prestamoVivienda: true, contribuyente: { edad: 35 }
    })
    expect(r.tipo).toBe(14.46)
  })

  test('el préstamo de vivienda no aplica con retribución ≥ 33.007,20 €', () => {
    const con = estimarRetencionNomina({ retribucionAnual: 34000, cotizacionesSS: 2159, prestamoVivienda: true })
    const sin = estimarRetencionNomina({ retribucionAnual: 34000, cotizacionesSS: 2159 })
    expect(con.tipo).toBe(sin.tipo)
  })

  test('desempleado: la retribución exenta sube 1.200 €', () => {
    // 17.000 ≤ 15.876 + 1.200 = 17.076 → exento
    expect(estimarRetencionNomina({ retribucionAnual: 17000, situacionLaboral: 'desempleado' }).exento).toBe(true)
    expect(estimarRetencionNomina({ retribucionAnual: 17000 }).exento).toBe(false)
  })

  test('el resultado no depende del orden de los hijos', () => {
    const a = estimarRetencionNomina({ retribucionAnual: 40000, cotizacionesSS: 2540, descendientes: [{ edad: 2 }, { edad: 10 }] })
    const b = estimarRetencionNomina({ retribucionAnual: 40000, cotizacionesSS: 2540, descendientes: [{ edad: 10 }, { edad: 2 }] })
    expect(a.tipo).toBe(b.tipo)
  })

  test('entradas inválidas lanzan ErrorEntrada', () => {
    expect(() => estimarRetencionNomina({ retribucionAnual: -1 })).toThrow(ErrorEntrada)
    expect(() => estimarRetencionNomina({})).toThrow(ErrorEntrada)
    expect(() => estimarRetencionNomina({ retribucionAnual: 1000, cotizacionesSS: 2000 })).toThrow(ErrorEntrada)
    expect(() => estimarRetencionNomina({ retribucionAnual: 30000, situacionFamiliar: 4 })).toThrow(ErrorEntrada)
    expect(() => estimarRetencionNomina({ retribucionAnual: 30000, situacionFamiliar: 1 })).toThrow(ErrorEntrada)
    expect(() => estimarRetencionNomina({ retribucionAnual: 30000, contrato: 'x' })).toThrow(ErrorEntrada)
  })
})
