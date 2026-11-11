'use strict'

const { liquidacionIRPF, ErrorEntrada, COMUNIDADES_SOPORTADAS } = require('../services/fiscal/liquidacionIRPF')
const { calcularMinimos } = require('../services/fiscal/minimos')

/*
 * Valores esperados calculados aparte con una fórmula directa por tramos (Decimal), no con
 * el código del servicio. Cuando se contrasten con el simulador de la AEAT (Puerta 3) se
 * anotará aquí el resultado oficial.
 */

describe('minimos', () => {
  test('estatal: soltero sin hijos', () => {
    expect(calcularMinimos('estatal', { contribuyente: { edad: 40 } }).total).toBe(555000)
  })
  test('estatal: mayor de 65 y de 75', () => {
    expect(calcularMinimos('estatal', { contribuyente: { edad: 66 } }).total).toBe(555000 + 115000)
    expect(calcularMinimos('estatal', { contribuyente: { edad: 76 } }).total).toBe(555000 + 115000 + 140000)
  })
  test('estatal: dos hijos, uno menor de 3 (2.400 + 2.700 + 2.800)', () => {
    const r = calcularMinimos('estatal', { contribuyente: { edad: 40 }, descendientes: [{ edad: 2 }, { edad: 10 }] })
    expect(r.desglose.descendientes).toBe(240000 + 270000 + 280000)
  })
  test('los descendientes se ordenan del mayor al menor', () => {
    const a = calcularMinimos('estatal', { descendientes: [{ edad: 2 }, { edad: 10 }] })
    const b = calcularMinimos('estatal', { descendientes: [{ edad: 10 }, { edad: 2 }] })
    expect(a.desglose.descendientes).toBe(b.desglose.descendientes)
  })
  test('cuarto hijo y siguientes: 4.500', () => {
    const hijos = [20, 18, 15, 12, 9].map((edad) => ({ edad }))
    expect(calcularMinimos('estatal', { descendientes: hijos }).desglose.descendientes).toBe(240000 + 270000 + 400000 + 450000 + 450000)
  })
  test('hijo de 25 años sin discapacidad no da derecho; con discapacidad sí', () => {
    expect(calcularMinimos('estatal', { descendientes: [{ edad: 26 }] }).desglose.descendientes).toBe(0)
    const r = calcularMinimos('estatal', { descendientes: [{ edad: 30, discapacidad: '33' }] })
    expect(r.desglose.descendientes).toBe(240000)
    expect(r.desglose.discapacidadDescendientes).toBe(300000)
  })
  test('descendiente por mitad', () => {
    const r = calcularMinimos('estatal', { descendientes: [{ edad: 10, computoPorMitad: true }] })
    expect(r.desglose.descendientes).toBe(120000)
  })
  test('ascendiente de 76 años compartido entre 2: (1.150 + 1.400) / 2', () => {
    const r = calcularMinimos('estatal', { ascendientes: [{ edad: 76, compartidoCon: 2 }] })
    expect(r.desglose.ascendientes).toBe(127500)
  })
  test('discapacidad del contribuyente: 65 % = 9.000 + 3.000; 33 % con movilidad = 3.000 + 3.000', () => {
    expect(calcularMinimos('estatal', { contribuyente: { edad: 40, discapacidad: '65' } }).desglose.discapacidadContribuyente).toBe(1200000)
    expect(calcularMinimos('estatal', { contribuyente: { edad: 40, discapacidad: '33', movilidadReducida: true } }).desglose.discapacidadContribuyente).toBe(600000)
    expect(calcularMinimos('estatal', { contribuyente: { edad: 40, discapacidad: '33' } }).desglose.discapacidadContribuyente).toBe(300000)
  })
  test('Madrid: 5.956,65', () => {
    expect(calcularMinimos('madrid', { contribuyente: { edad: 40 } }).total).toBe(595665)
  })
  test('La Rioja: solo cambia la discapacidad de descendientes', () => {
    const r = calcularMinimos('laRioja', { contribuyente: { edad: 40, discapacidad: '33' }, descendientes: [{ edad: 5, discapacidad: '33' }] })
    expect(r.desglose.discapacidadContribuyente).toBe(300000)
    expect(r.desglose.discapacidadDescendientes).toBe(330000)
  })
})

describe('liquidacionIRPF', () => {
  const base = { contribuyente: { edad: 40 } }

  test('A: Madrid, 30.000 brutos, SS 1.950 → BL 26.050', () => {
    const r = liquidacionIRPF({ ...base, comunidad: 'madrid', rendimientoIntegro: 30000, cotizacionesSS: 1950 })
    expect(r.baseLiquidableGeneral).toBe(26050)
    expect(r.reduccionTrabajo).toBe(0)
    expect(r.cuotaEstatal).toBe(2463)
    expect(r.cuotaAutonomica).toBe(2135.02)
    expect(r.cuotaIntegra).toBe(4598.02)
  })

  test('B: Cataluña, 15.000 brutos → reducción máxima 7.302, cuota 0', () => {
    const r = liquidacionIRPF({ ...base, comunidad: 'cataluna', rendimientoIntegro: 15000, cotizacionesSS: 975 })
    expect(r.reduccionTrabajo).toBe(7302)
    expect(r.baseLiquidableGeneral).toBe(4723)
    expect(r.cuotaIntegra).toBe(0)
  })

  test('C: Valencia 2026, 45.000 brutos, dos hijos (10 y 2 años)', () => {
    const r = liquidacionIRPF({
      comunidad: 'valencia', rendimientoIntegro: 45000, cotizacionesSS: 2925,
      contribuyente: { edad: 40 }, descendientes: [{ edad: 10 }, { edad: 2 }]
    })
    expect(r.baseLiquidableGeneral).toBe(40075)
    expect(r.minimoEstatal).toBe(13450)
    expect(r.minimoAutonomico).toBe(14795)
    expect(r.cuotaEstatal).toBe(3961.88)
    expect(r.cuotaAutonomica).toBe(3675.74)
    expect(r.cuotaIntegra).toBe(7637.62)
  })

  test('D: Galicia, tramo con reducción decreciente (RNT 17.297,50)', () => {
    const r = liquidacionIRPF({ ...base, comunidad: 'galicia', rendimientoIntegro: 18500, cotizacionesSS: 1202.5 })
    expect(r.reduccionTrabajo).toBe(3022.38)
    expect(r.baseLiquidableGeneral).toBe(12275.12)
    expect(r.cuotaEstatal).toBe(638.89)
    expect(r.cuotaAutonomica).toBe(583.75)
    expect(r.cuotaIntegra).toBe(1222.64)
  })

  test('E: Extremadura, 150.000 brutos (escala nueva 2026)', () => {
    const r = liquidacionIRPF({ ...base, comunidad: 'extremadura', rendimientoIntegro: 150000, cotizacionesSS: 5000 })
    expect(r.baseLiquidableGeneral).toBe(143000)
    expect(r.cuotaEstatal).toBe(27098.5)
    expect(r.cuotaAutonomica).toBe(29215.38)
    expect(r.cuotaIntegra).toBe(56313.88)
  })

  test('reducción art. 20 no se aplica con otras rentas > 6.500 €', () => {
    const r = liquidacionIRPF({ ...base, comunidad: 'madrid', rendimientoIntegro: 15000, cotizacionesSS: 975, otrasRentas: 6501 })
    expect(r.reduccionTrabajo).toBe(0)
  })

  test('reducción art. 20 es continua en los cortes de tramo', () => {
    const red = (rnt) => liquidacionIRPF({ ...base, comunidad: 'madrid', rendimientoIntegro: rnt }).reduccionTrabajo
    expect(red(14852)).toBe(7302)
    expect(red(14852.01)).toBeCloseTo(7302 - 0.0175, 2)
    expect(red(17673.52)).toBeCloseTo(2364.34, 2)
    expect(red(19747.49)).toBeLessThan(0.02)
    expect(red(19747.5)).toBe(0)
  })

  test('la cuota nunca baja al subir el sueldo (monotonía) en todas las comunidades', () => {
    COMUNIDADES_SOPORTADAS.forEach((comunidad) => {
      let anterior = -1
      for (let bruto = 10000; bruto <= 400000; bruto += 3500) {
        const { cuotaIntegra } = liquidacionIRPF({ ...base, comunidad, rendimientoIntegro: bruto })
        expect(cuotaIntegra).toBeGreaterThanOrEqual(anterior)
        anterior = cuotaIntegra
      }
    })
  })

  test('sin saltos: +1 € de bruto sube la cuota menos de 1 € en todas las comunidades', () => {
    COMUNIDADES_SOPORTADAS.forEach((comunidad) => {
      for (const bruto of [14000, 14852, 17673, 19747, 20000, 35000, 60000, 130000, 305000]) {
        const a = liquidacionIRPF({ ...base, comunidad, rendimientoIntegro: bruto }).cuotaIntegra
        const b = liquidacionIRPF({ ...base, comunidad, rendimientoIntegro: bruto + 1 }).cuotaIntegra
        expect(b - a).toBeLessThan(1)
        expect(b - a).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test('cuotas en céntimos exactos (sin decimales flotantes)', () => {
    const r = liquidacionIRPF({ ...base, comunidad: 'madrid', rendimientoIntegro: 33333.33, cotizacionesSS: 2166.67 })
    ;[r.cuotaEstatal, r.cuotaAutonomica, r.cuotaIntegra].forEach((v) => {
      expect(Math.round(v * 100)).toBeCloseTo(v * 100, 6)
    })
    expect(r.cuotaIntegra).toBeCloseTo(r.cuotaEstatal + r.cuotaAutonomica, 2)
  })

  test('mínimos autonómicos pendientes: aviso en Madrid, ninguno en Cataluña', () => {
    const m = liquidacionIRPF({ ...base, comunidad: 'madrid', rendimientoIntegro: 30000 })
    const c = liquidacionIRPF({ ...base, comunidad: 'cataluna', rendimientoIntegro: 30000 })
    expect(m.avisos.some((a) => /pendientes de confirmar/.test(a))).toBe(true)
    expect(c.avisos.some((a) => /pendientes de confirmar/.test(a))).toBe(false)
  })

  test.each(['paisVasco', 'navarra', 'ceuta', 'melilla'])('%s: aviso y ningún importe', (comunidad) => {
    const r = liquidacionIRPF({ ...base, comunidad, rendimientoIntegro: 30000 })
    expect(r.soportado).toBe(false)
    expect(r.aviso).toMatch(/\S/)
    expect(r.cuotaIntegra).toBeUndefined()
    expect(r.baseLiquidableGeneral).toBeUndefined()
  })

  test('entradas inválidas', () => {
    expect(() => liquidacionIRPF({ comunidad: 'marte', rendimientoIntegro: 1 })).toThrow(ErrorEntrada)
    expect(() => liquidacionIRPF({ comunidad: 'madrid', rendimientoIntegro: -1 })).toThrow(ErrorEntrada)
    expect(() => liquidacionIRPF({ comunidad: 'madrid', rendimientoIntegro: '30000' })).toThrow(ErrorEntrada)
    expect(() => liquidacionIRPF({ comunidad: 'madrid', rendimientoIntegro: NaN })).toThrow(ErrorEntrada)
    expect(() => liquidacionIRPF({ comunidad: 'madrid', rendimientoIntegro: 1000, cotizacionesSS: 2000 })).toThrow(ErrorEntrada)
  })
})
