'use strict'

const {
  cuadroAmortizacion, amortizacionAnticipada, comisionMaximaLegal, cuotaFrancesa, ErrorEntrada
} = require('../services/prestamos')

/*
 * Esperados calculados a mano o con fórmula cerrada, no con el código:
 *  - Alemán: capital constante C/n; intereses = TIN/12 × suma de saldos.
 *  - Americano: intereses constantes sobre todo el capital.
 *  - La TIR mensual de un préstamo sin gastos es TIN/12 sea cual sea el sistema → TAE = (1 + TIN/12)^12 − 1.
 *  - Topes de comisión: Ley 5/2019, art. 23 (datosHipotecas.js).
 */

describe('sistema alemán', () => {
  // 12.000 € al 12 % a 12 meses: capital 1.000/mes; interés del mes 1 = 120, del 2 = 110 ...
  const r = cuadroAmortizacion({ capital: 12000, tin: 12, meses: 12, sistema: 'aleman' })

  test('capital constante y cuota decreciente', () => {
    expect(r.filas[0]).toMatchObject({ cuota: 1120, intereses: 120, capital: 1000, saldo: 11000 })
    expect(r.filas[1]).toMatchObject({ cuota: 1110, intereses: 110, capital: 1000 })
    expect(r.filas[11]).toMatchObject({ cuota: 1010, intereses: 10, capital: 1000, saldo: 0 })
  })

  test('intereses totales = 1 % × (12.000 + 11.000 + … + 1.000) = 780', () => {
    expect(r.totalIntereses).toBe(780)
    expect(r.cuota).toBe(1120)
    expect(r.cuotaMaxima).toBe(1120)
    expect(r.cuotaMinima).toBe(1020) // la cuota 11 (sin la última fila)
  })

  test('menos intereses que el francés para el mismo préstamo', () => {
    const frances = cuadroAmortizacion({ capital: 12000, tin: 12, meses: 12 })
    expect(r.totalIntereses).toBeLessThan(frances.totalIntereses)
  })

  test('TAE sin gastos = 12,68 %', () => {
    expect(r.tae).toBe(12.68)
  })
})

describe('sistema americano', () => {
  const r = cuadroAmortizacion({ capital: 12000, tin: 12, meses: 12, sistema: 'americano' })

  test('solo intereses y el capital entero en la última cuota', () => {
    expect(r.filas[0]).toMatchObject({ cuota: 120, intereses: 120, capital: 0, saldo: 12000 })
    expect(r.filas[10]).toMatchObject({ cuota: 120, capital: 0, saldo: 12000 })
    expect(r.filas[11]).toMatchObject({ cuota: 12120, intereses: 120, capital: 12000, saldo: 0 })
    expect(r.totalIntereses).toBe(1440)
    expect(r.cuota).toBe(120)
    expect(r.ultimaCuota).toBe(12120)
  })

  test('TAE sin gastos = 12,68 % y aviso del capital final', () => {
    expect(r.tae).toBe(12.68)
    expect(r.avisos.join(' ')).toMatch(/americano/)
  })
})

describe('tipo variable', () => {
  const base = { capital: 100000, meses: 240, tipoInteres: 'variable', diferencial: 1, euribor: 3, periodoRevision: 12 }

  test('con el índice constante, la cuota es la francesa al Euríbor + diferencial (4 %)', () => {
    const r = cuadroAmortizacion(base)
    expect(r.cuota).toBe(cuotaFrancesa(100000, 4, 240))
    expect(r.tinInicial).toBe(4)
    expect(r.revisiones).toHaveLength(20) // cuotas 1, 13, 25 … 229
    expect(r.revisiones[1].numero).toBe(13)
    expect(r.revisiones.every((v) => v.tin === 4)).toBe(true)
  })

  test('el tipo inicial puede ser distinto hasta la primera revisión', () => {
    const r = cuadroAmortizacion({ ...base, tin: 2 })
    expect(r.filas[11].tin).toBe(2)
    expect(r.filas[12].tin).toBe(4)
    expect(r.cuota).toBe(cuotaFrancesa(100000, 2, 240))
    expect(r.revisiones[1].cuota).toBeGreaterThan(r.revisiones[0].cuota)
  })

  test('subida del Euríbor: en la revisión la cuota se recalcula sobre el saldo y los meses restantes', () => {
    const r = cuadroAmortizacion({ ...base, euriborFuturo: [{ mes: 13, valor: 5 }] })
    // Saldo tras 12 cuotas por fórmula cerrada, con la cuota al 4 %
    const i = 0.04 / 12
    const c = cuotaFrancesa(100000, 4, 240)
    const saldo12 = 100000 * Math.pow(1 + i, 12) - (c * (Math.pow(1 + i, 12) - 1)) / i
    const j = 0.06 / 12
    const esperada = (saldo12 * j) / (1 - Math.pow(1 + j, -228))
    expect(r.filas[12].tin).toBe(6)
    expect(r.filas[12].cuota).toBeCloseTo(esperada, 1)
    expect(r.cuotaMaxima).toBeGreaterThan(r.cuota)
    expect(r.filas[239].saldo).toBe(0)
  })

  test('sin suelo pero nunca negativo: Euríbor −1,5 % + 1 punto → 0 %', () => {
    const r = cuadroAmortizacion({ ...base, euribor: 3, euriborFuturo: [{ mes: 13, valor: -1.5 }] })
    expect(r.filas[12].tin).toBe(0)
    expect(r.filas[12].intereses).toBe(0)
  })

  test('escenarios: +1 punto cuesta más intereses, −1 punto menos', () => {
    const r = cuadroAmortizacion({ ...base, tin: 2 })
    expect(r.escenarios.map((e) => e.puntos)).toEqual([-1, 1, 2])
    const [bajada, subida, subida2] = r.escenarios
    expect(bajada.diferenciaIntereses).toBeLessThan(0)
    expect(subida.diferenciaIntereses).toBeGreaterThan(0)
    expect(subida2.diferenciaIntereses).toBeGreaterThan(subida.diferenciaIntereses)
    expect(subida.tinFinal).toBe(5) // 3 + 1 + 1
  })

  test('escenarios a medida', () => {
    const r = cuadroAmortizacion({ ...base, escenariosEuribor: [0.5] })
    expect(r.escenarios).toHaveLength(1)
    expect(r.escenarios[0].tinFinal).toBe(4.5)
  })

  test('el escenario de 0 puntos coincide con el cuadro base', () => {
    const r = cuadroAmortizacion({ ...base, escenariosEuribor: [0] })
    expect(r.escenarios[0].diferenciaIntereses).toBe(0)
    expect(r.escenarios[0].totalIntereses).toBe(r.totalIntereses)
  })

  test('la TAE usa el índice constante aunque el escenario suba', () => {
    const constante = cuadroAmortizacion(base)
    const sube = cuadroAmortizacion({ ...base, euriborFuturo: [{ mes: 13, valor: 6 }] })
    expect(sube.tae).toBe(constante.tae)
    expect(sube.totalIntereses).toBeGreaterThan(constante.totalIntereses)
  })

  test('primera revisión a los 6 meses con revisión semestral', () => {
    const r = cuadroAmortizacion({ ...base, periodoRevision: 6, tin: 3 })
    expect(r.revisiones[1].numero).toBe(7)
    expect(r.revisiones[2].numero).toBe(13)
  })

  test('sistema alemán variable: el capital se recalcula en cada revisión', () => {
    const r = cuadroAmortizacion({
      capital: 12000, meses: 12, tipoInteres: 'variable', diferencial: 0, euribor: 12, periodoRevision: 6, sistema: 'aleman'
    })
    expect(r.filas[0].capital).toBe(1000)
    expect(r.filas[6].capital).toBe(1000) // saldo 6.000 / 6 meses
    expect(r.filas[11].saldo).toBe(0)
  })
})

describe('tipo mixto', () => {
  const base = { capital: 100000, meses: 240, tipoInteres: 'mixto', tin: 2, mesesFijos: 60, diferencial: 1, euribor: 3 }

  test('tramo fijo y después Euríbor + diferencial', () => {
    const r = cuadroAmortizacion(base)
    expect(r.filas[59].tin).toBe(2)
    expect(r.filas[60].tin).toBe(4)
    expect(r.revisiones.map((v) => v.numero).slice(0, 3)).toEqual([1, 61, 73])
    expect(r.cuota).toBe(cuotaFrancesa(100000, 2, 240))
    expect(r.filas[60].cuota).toBeGreaterThan(r.filas[59].cuota)
  })

  test('TAE legal: el tipo tras el tramo fijo no baja del tipo fijado', () => {
    // Euríbor 0 + 1 punto = 1 % < 2 % fijo: la TAE supone 2 % → (1 + 0,02/12)^12 − 1 = 2,02 %
    const r = cuadroAmortizacion({ ...base, euribor: 0 })
    expect(r.filas[60].tin).toBe(1) // el cuadro real sí baja
    expect(r.tae).toBe(2.02)
  })

  test('mesesFijos debe ser menor que el plazo', () => {
    expect(() => cuadroAmortizacion({ ...base, mesesFijos: 240 })).toThrow(ErrorEntrada)
    expect(() => cuadroAmortizacion({ ...base, mesesFijos: undefined })).toThrow(ErrorEntrada)
  })
})

describe('validación de tipo y sistema', () => {
  const fijo = { capital: 1000, tin: 5, meses: 12 }

  test('datos obligatorios por tipo', () => {
    expect(() => cuadroAmortizacion({ capital: 1000, meses: 12 })).toThrow(/tin/)
    expect(() => cuadroAmortizacion({ capital: 1000, meses: 12, tipoInteres: 'variable', euribor: 3 })).toThrow(/diferencial/)
    expect(() => cuadroAmortizacion({ capital: 1000, meses: 12, tipoInteres: 'variable', diferencial: 1 })).toThrow(/euribor/)
  })

  test('valores no admitidos', () => {
    expect(() => cuadroAmortizacion({ ...fijo, tipoInteres: 'raro' })).toThrow(ErrorEntrada)
    expect(() => cuadroAmortizacion({ ...fijo, sistema: 'raro' })).toThrow(ErrorEntrada)
    expect(() => cuadroAmortizacion({
      ...fijo, tipoInteres: 'variable', diferencial: 1, euribor: 3, euriborFuturo: [{ mes: 0, valor: 3 }]
    })).toThrow(ErrorEntrada)
    expect(() => cuadroAmortizacion({
      ...fijo, tipoInteres: 'variable', diferencial: 1, euribor: 3, escenariosEuribor: [1, 2, 3, 4, 5, 6]
    })).toThrow(ErrorEntrada)
  })

  test('el tipo fijo no devuelve campos de revisión', () => {
    const r = cuadroAmortizacion(fijo)
    expect(r.revisiones).toBeUndefined()
    expect(r.escenarios).toBeUndefined()
    expect(r.filas[0].tin).toBeUndefined()
  })
})

describe('tope legal de la comisión por amortizar (Ley 5/2019, art. 23)', () => {
  const cfg = (o) => ({ tipoInteres: 'fijo', ...o })

  test('tipo fijo: 2 % en 10 años, 1,5 % después', () => {
    expect(comisionMaximaLegal(cfg(), 24).pct).toBe(2)
    expect(comisionMaximaLegal(cfg(), 120).pct).toBe(2)
    expect(comisionMaximaLegal(cfg(), 121).pct).toBe(1.5)
  })

  test('tipo variable: 0,25 % en 3 años, 0,15 % hasta 5, nada después', () => {
    const v = cfg({ tipoInteres: 'variable' })
    expect(comisionMaximaLegal(v, 24).pct).toBe(0.25)
    expect(comisionMaximaLegal(v, 36).pct).toBe(0.25)
    expect(comisionMaximaLegal(v, 48).pct).toBe(0.15)
    expect(comisionMaximaLegal(v, 61).pct).toBe(0)
  })

  test('mixto: tramo fijo con la regla del fijo, tramo variable con la del variable', () => {
    const x = cfg({ tipoInteres: 'mixto', mesesFijos: 60 })
    expect(comisionMaximaLegal(x, 30).pct).toBe(2)
    expect(comisionMaximaLegal(x, 61).pct).toBe(0)
  })

  test('novación de variable a fijo: 0,05 % en 3 años y nada después; no cambia al partir de fijo', () => {
    const v = cfg({ tipoInteres: 'variable' })
    expect(comisionMaximaLegal(v, 12, { novacionAFijo: true }).pct).toBe(0.05)
    expect(comisionMaximaLegal(v, 40, { novacionAFijo: true }).pct).toBe(0)
    expect(comisionMaximaLegal(cfg(), 12, { novacionAFijo: true }).pct).toBe(2)
  })
})

describe('amortización anticipada con otros tipos y sistemas', () => {
  const fijo = { capital: 100000, tin: 5, meses: 240 }

  test('avisa si la comisión supera el máximo legal', () => {
    const r = amortizacionAnticipada({ ...fijo, mesAmortizacion: 24, importe: 10000, comisionPct: 3 })
    expect(r.comisionMaximaLegalPct).toBe(2)
    expect(r.avisos.join(' ')).toMatch(/supera el máximo legal/)
    const ok = amortizacionAnticipada({ ...fijo, mesAmortizacion: 24, importe: 10000, comisionPct: 1 })
    expect(ok.avisos).toHaveLength(1)
  })

  test('variable pasados 5 años: la ley no permite comisión', () => {
    const r = amortizacionAnticipada({
      capital: 100000, meses: 240, tipoInteres: 'variable', diferencial: 1, euribor: 3,
      mesAmortizacion: 72, importe: 10000, comisionPct: 0.5
    })
    expect(r.comisionMaximaLegalPct).toBe(0)
    expect(r.avisos.join(' ')).toMatch(/no permite cobrar comisión/)
  })

  test('variable, reducir plazo: acaba antes y el saldo final es 0', () => {
    const r = amortizacionAnticipada({
      capital: 100000, meses: 240, tipoInteres: 'variable', diferencial: 1, euribor: 3,
      mesAmortizacion: 30, importe: 20000, modo: 'reducirPlazo'
    })
    expect(r.mesesNuevos).toBeLessThan(r.mesesActuales)
    expect(r.ahorroIntereses).toBeGreaterThan(0)
    expect(r.resumenAnualNuevo[r.resumenAnualNuevo.length - 1].saldoFinal).toBe(0)
    expect(r.revisionesNuevas.length).toBeGreaterThan(0)
  })

  test('variable, reducir cuota: mismo plazo y cuota menor', () => {
    const r = amortizacionAnticipada({
      capital: 100000, meses: 240, tipoInteres: 'variable', diferencial: 1, euribor: 3,
      mesAmortizacion: 30, importe: 20000, modo: 'reducirCuota'
    })
    expect(r.mesesNuevos).toBe(240)
    expect(r.cuotaNueva).toBeLessThan(r.cuotaActual)
  })

  test('variable → novación a tipo fijo: sin revisiones y tope del 0,05 %', () => {
    const r = amortizacionAnticipada({
      capital: 100000, meses: 240, tipoInteres: 'variable', diferencial: 1, euribor: 3,
      mesAmortizacion: 12, importe: 10000, modo: 'reducirCuota', nuevoTin: 2.5
    })
    expect(r.revisionesNuevas).toBeUndefined()
    expect(r.comisionMaximaLegalPct).toBe(0.05)
    expect(r.cuotaNueva).toBeLessThan(r.cuotaActual)
  })

  test('alemán a tipo 0 %: reducir plazo mantiene el capital mensual (1.000 €)', () => {
    const r = amortizacionAnticipada({
      capital: 12000, tin: 0, meses: 12, sistema: 'aleman', mesAmortizacion: 2, importe: 2000, modo: 'reducirPlazo'
    })
    expect(r.saldoDespues).toBe(8000)
    expect(r.mesesNuevos).toBe(10)
    expect(r.cuotaNueva).toBe(1000)
  })

  test('alemán a tipo 0 %: reducir cuota deja 800 € de capital en los 10 meses restantes', () => {
    const r = amortizacionAnticipada({
      capital: 12000, tin: 0, meses: 12, sistema: 'aleman', mesAmortizacion: 2, importe: 2000, modo: 'reducirCuota'
    })
    expect(r.mesesNuevos).toBe(12)
    expect(r.cuotaNueva).toBe(800)
  })

  test('americano: amortizar solo baja los intereses (3 × 120 + 9 × 100 = 1.260 frente a 1.440)', () => {
    const r = amortizacionAnticipada({
      capital: 12000, tin: 12, meses: 12, sistema: 'americano', mesAmortizacion: 3, importe: 2000, modo: 'reducirPlazo'
    })
    expect(r.modo).toBe('reducirCuota')
    expect(r.mesesNuevos).toBe(12)
    expect(r.interesesNuevos).toBe(1260)
    expect(r.ahorroIntereses).toBe(180)
    expect(r.avisos.join(' ')).toMatch(/americano/)
  })
})
