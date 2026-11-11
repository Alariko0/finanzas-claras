'use strict'

const { liquidacionAhorro } = require('../services/fiscal/ahorro')
const { ErrorEntrada } = require('../services/fiscal/liquidacionIRPF')

/*
 * Esperados calculados a mano con la escala del ahorro por parte (9,5 / 10,5 / 11,5 / 13,5 / 15 %
 * desde 0 / 6.000 / 50.000 / 200.000 / 300.000). Aragón tiene los mínimos estatales.
 */

const e = { comunidad: 'aragon', contribuyente: { edad: 40 } }

describe('liquidacionAhorro', () => {
  test('base general suficiente para el mínimo: sin reducción', () => {
    // 6.000 × 9,5 % + 4.000 × 10,5 % = 990 por parte → 1.980
    const r = liquidacionAhorro({ ...e, baseLiquidableAhorro: 10000, baseLiquidableGeneral: 30000 })
    expect(r.cuotaIntegra).toBe(1980)
    expect(r.tipoMedio).toBe(19.8)
  })

  test('sin base general: el mínimo de 5.550 € reduce la base del ahorro', () => {
    // escala(5.550) = 527,25 → (990 − 527,25) × 2 = 925,50
    const r = liquidacionAhorro({ ...e, baseLiquidableAhorro: 10000 })
    expect(r.cuotaIntegra).toBe(925.5)
  })

  test('base general parcial: solo el mínimo no absorbido reduce el ahorro', () => {
    // remanente 5.550 − 3.000 = 2.550; escala(2.550) = 242,25 → (990 − 242,25) × 2 = 1.495,50
    const r = liquidacionAhorro({ ...e, baseLiquidableAhorro: 10000, baseLiquidableGeneral: 3000 })
    expect(r.cuotaIntegra).toBe(1495.5)
  })

  test('60.000 €: 5.190 + 10.000 × 11,5 % = 6.340 por parte → 12.680', () => {
    expect(liquidacionAhorro({ ...e, baseLiquidableAhorro: 60000, baseLiquidableGeneral: 30000 }).cuotaIntegra).toBe(12680)
  })

  test('el tipo marginal máximo es el 30 % (más de 300.000 €)', () => {
    const a = liquidacionAhorro({ ...e, baseLiquidableAhorro: 300000, baseLiquidableGeneral: 30000 })
    const b = liquidacionAhorro({ ...e, baseLiquidableAhorro: 310000, baseLiquidableGeneral: 30000 })
    expect(Math.round((b.cuotaIntegra - a.cuotaIntegra) * 100) / 100).toBe(3000)
  })

  test('base del ahorro cero: cuota cero', () => {
    expect(liquidacionAhorro({ ...e, baseLiquidableAhorro: 0 }).cuotaIntegra).toBe(0)
  })

  test('régimen foral: aviso y ningún importe', () => {
    const r = liquidacionAhorro({ ...e, comunidad: 'navarra', baseLiquidableAhorro: 1000 })
    expect(r.soportado).toBe(false)
    expect(r.cuotaIntegra).toBeUndefined()
  })

  test('entradas inválidas', () => {
    expect(() => liquidacionAhorro({ ...e, baseLiquidableAhorro: -1 })).toThrow(ErrorEntrada)
    expect(() => liquidacionAhorro({ ...e, comunidad: 'xx', baseLiquidableAhorro: 1 })).toThrow(ErrorEntrada)
    expect(() => liquidacionAhorro({ ...e })).toThrow(ErrorEntrada)
  })
})
