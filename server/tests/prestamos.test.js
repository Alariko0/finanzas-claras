'use strict'

const {
  cuotaFrancesa, cuadroAmortizacion, amortizacionAnticipada, ErrorEntrada, fechaCuota, analizarFecha
} = require('../services/prestamos')

/*
 * Valores de referencia independientes del código:
 *  - Cuotas de tablas financieras conocidas (100.000 € al 5 % a 20 años = 659,96 €;
 *    12.000 € al 12 % a 12 meses = 1.066,19 €; 200.000 € al 3,5 % a 25 años = 1.001,25 €).
 *  - TAE de un préstamo sin gastos = (1 + TIN/12)^12 − 1 (12 % nominal → 12,68 %).
 *  - Fórmula cerrada del número de cuotas: n = −ln(1 − S·i/c) / ln(1 + i).
 */

describe('cuotaFrancesa', () => {
  test('tablas conocidas', () => {
    expect(cuotaFrancesa(100000, 5, 240)).toBe(659.96)
    expect(cuotaFrancesa(12000, 12, 12)).toBe(1066.19)
    expect(cuotaFrancesa(200000, 3.5, 300)).toBe(1001.25)
  })

  test('tipo 0 %: capital / meses, sin dividir por cero', () => {
    expect(cuotaFrancesa(12000, 0, 12)).toBe(1000)
    expect(cuotaFrancesa(1000, 0, 3)).toBe(333.33)
  })

  test('entradas inválidas', () => {
    expect(() => cuotaFrancesa(0, 3, 12)).toThrow(ErrorEntrada)
    expect(() => cuotaFrancesa(1000, -1, 12)).toThrow(ErrorEntrada)
    expect(() => cuotaFrancesa(1000, 3, 0)).toThrow(ErrorEntrada)
    expect(() => cuotaFrancesa(1000, 3, 601)).toThrow(ErrorEntrada)
    expect(() => cuotaFrancesa(1000, 3, 12.5)).toThrow(ErrorEntrada)
    expect(() => cuotaFrancesa('1000', 3, 12)).toThrow(ErrorEntrada)
  })
})

describe('cuadroAmortizacion', () => {
  const entrada = { capital: 100000, tin: 5, meses: 240, fechaInicio: '2026-01-31' }
  const r = cuadroAmortizacion(entrada)

  test('el capital amortizado suma exactamente el principal y el saldo final es 0', () => {
    const capital = r.filas.reduce((t, f) => t + Math.round(f.capital * 100), 0)
    expect(capital).toBe(10000000)
    expect(r.filas).toHaveLength(240)
    expect(r.filas[239].saldo).toBe(0)
  })

  test('primera fila: interés = 100.000 × 5 % / 12 = 416,67 €', () => {
    expect(r.filas[0]).toMatchObject({ numero: 1, cuota: 659.96, intereses: 416.67, capital: 243.29, saldo: 99756.71 })
  })

  test('intereses totales = cuotas − capital y coinciden con la suma de filas', () => {
    const intereses = r.filas.reduce((t, f) => t + Math.round(f.intereses * 100), 0)
    expect(Math.round(r.totalIntereses * 100)).toBe(intereses)
    expect(Math.round(r.totalCuotas * 100) - 10000000).toBe(intereses)
    // 240 × 659,96 − 100.000 = 58.390,40; la última cuota difiere unos céntimos
    expect(r.totalIntereses).toBeGreaterThan(58380)
    expect(r.totalIntereses).toBeLessThan(58400)
  })

  test('fechas: la primera cuota un mes después y el día 31 se recorta', () => {
    expect(r.filas[0].fecha).toBe('2026-02-28')
    expect(r.filas[1].fecha).toBe('2026-03-31')
    expect(r.filas[2].fecha).toBe('2026-04-30')
    expect(r.fechaFin).toBe('2046-01-31')
  })

  test('año bisiesto: 31 de enero → 29 de febrero', () => {
    expect(fechaCuota(analizarFecha('2027-01-31'), 13)).toBe('2028-02-29')
  })

  test('TAE sin gastos = (1 + TIN/12)^12 − 1', () => {
    expect(cuadroAmortizacion({ capital: 10000, tin: 12, meses: 24 }).tae).toBe(12.68)
    const esperada = Math.round((Math.pow(1 + 0.05 / 12, 12) - 1) * 1e4) / 1e2
    expect(r.tae).toBe(esperada)
  })

  test('TAE con comisión de apertura es mayor que el TIN compuesto', () => {
    const con = cuadroAmortizacion({ capital: 10000, tin: 12, meses: 24, comisionApertura: 2 })
    expect(con.comisionApertura).toBe(200)
    expect(con.tae).toBeGreaterThan(12.68)
    expect(con.costeTotal).toBe(Math.round((con.totalIntereses + 200) * 100) / 100)
  })

  test('los gastos mensuales (seguros) suben la TAE pero no el cuadro', () => {
    const sin = cuadroAmortizacion({ capital: 10000, tin: 6, meses: 24 })
    const con = cuadroAmortizacion({ capital: 10000, tin: 6, meses: 24, gastosMensuales: 10 })
    expect(con.tae).toBeGreaterThan(sin.tae)
    expect(con.cuota).toBe(sin.cuota)
    expect(con.totalPagado).toBe(Math.round((sin.totalPagado + 240) * 100) / 100)
  })

  test('tipo 0 %: sin intereses y TAE 0', () => {
    const c = cuadroAmortizacion({ capital: 1200, tin: 0, meses: 12 })
    expect(c.cuota).toBe(100)
    expect(c.totalIntereses).toBe(0)
    expect(c.tae).toBe(0)
  })

  test('un solo mes', () => {
    const c = cuadroAmortizacion({ capital: 1000, tin: 12, meses: 1 })
    expect(c.filas).toEqual([{ numero: 1, cuota: 1010, intereses: 10, capital: 1000, saldo: 0 }])
  })

  test('resumen anual: suma de intereses por año', () => {
    const suma = r.resumenAnual.reduce((t, a) => t + Math.round(a.intereses * 100), 0)
    expect(suma).toBe(Math.round(r.totalIntereses * 100))
    expect(r.resumenAnual[0].anio).toBe(2026)
    expect(r.resumenAnual[r.resumenAnual.length - 1].saldoFinal).toBe(0)
  })

  test('fecha inválida', () => {
    expect(() => cuadroAmortizacion({ ...entrada, fechaInicio: '2026-02-30' })).toThrow(ErrorEntrada)
    expect(() => cuadroAmortizacion({ ...entrada, fechaInicio: '31/01/2026' })).toThrow(ErrorEntrada)
  })
})

describe('amortizacionAnticipada', () => {
  const base = { capital: 100000, tin: 5, meses: 240 }

  test('tipo 0 %: reducir plazo (12.000 € a 12 meses, amortizar 2.000 tras la cuota 2)', () => {
    // Saldo tras 2 cuotas: 10.000 − 2.000 = 8.000 → 8 cuotas más → 10 meses en total
    const r = amortizacionAnticipada({
      capital: 12000, tin: 0, meses: 12, mesAmortizacion: 2, importe: 2000, modo: 'reducirPlazo', comisionPct: 1
    })
    expect(r.saldoAntes).toBe(10000)
    expect(r.saldoDespues).toBe(8000)
    expect(r.mesesNuevos).toBe(10)
    expect(r.mesesAhorrados).toBe(2)
    expect(r.cuotaNueva).toBe(1000)
    expect(r.ahorroIntereses).toBe(0)
    expect(r.comision).toBe(20)
    expect(r.ahorroNeto).toBe(-20)
  })

  test('tipo 0 %: reducir cuota (8.000 € en los 10 meses restantes = 800 €)', () => {
    const r = amortizacionAnticipada({
      capital: 12000, tin: 0, meses: 12, mesAmortizacion: 2, importe: 2000, modo: 'reducirCuota'
    })
    expect(r.cuotaNueva).toBe(800)
    expect(r.mesesNuevos).toBe(12)
  })

  test('reducir cuota al inicio = cuota francesa del capital restante', () => {
    const r = amortizacionAnticipada({ ...base, mesAmortizacion: 0, importe: 20000, modo: 'reducirCuota' })
    expect(r.cuotaNueva).toBe(cuotaFrancesa(80000, 5, 240))
    expect(r.mesesNuevos).toBe(240)
    expect(r.ahorroIntereses).toBeGreaterThan(0)
  })

  test('reducir plazo al inicio: nº de cuotas por la fórmula cerrada', () => {
    const c = cuotaFrancesa(100000, 5, 240)
    const i = 0.05 / 12
    const n = Math.ceil(-Math.log(1 - (80000 * i) / c) / Math.log(1 + i))
    const r = amortizacionAnticipada({ ...base, mesAmortizacion: 0, importe: 20000, modo: 'reducirPlazo' })
    expect(r.mesesNuevos).toBe(n)
    expect(r.cuotaNueva).toBe(c)
  })

  test('mismo importe: reducir plazo ahorra más intereses que reducir cuota', () => {
    const plazo = amortizacionAnticipada({ ...base, mesAmortizacion: 24, importe: 20000, modo: 'reducirPlazo' })
    const cuota = amortizacionAnticipada({ ...base, mesAmortizacion: 24, importe: 20000, modo: 'reducirCuota' })
    expect(plazo.ahorroIntereses).toBeGreaterThan(cuota.ahorroIntereses)
    expect(plazo.mesesAhorrados).toBeGreaterThan(0)
    expect(cuota.mesesAhorrados).toBe(0)
  })

  test('el ahorro coincide con la diferencia de intereses de los cuadros completos', () => {
    const r = amortizacionAnticipada({ ...base, mesAmortizacion: 36, importe: 15000, modo: 'reducirPlazo' })
    expect(Math.round((r.interesesActuales - r.interesesNuevos) * 100)).toBe(Math.round(r.ahorroIntereses * 100))
    expect(r.interesesActuales).toBe(cuadroAmortizacion(base).totalIntereses)
  })

  test('comisión: porcentaje de lo amortizado y ahorro neto', () => {
    const r = amortizacionAnticipada({ ...base, mesAmortizacion: 24, importe: 20000, comisionPct: 0.5 })
    expect(r.comision).toBe(100)
    expect(r.ahorroNeto).toBe(Math.round((r.ahorroIntereses - 100) * 100) / 100)
  })

  test('importe mayor que el saldo: liquida el préstamo', () => {
    const r = amortizacionAnticipada({ ...base, mesAmortizacion: 120, importe: 999999 })
    expect(r.liquidaPrestamo).toBe(true)
    expect(r.saldoDespues).toBe(0)
    expect(r.importeAmortizado).toBe(r.saldoAntes)
    expect(r.mesesNuevos).toBe(120)
  })

  test('nuevo tipo más bajo desde la amortización reduce la cuota', () => {
    const r = amortizacionAnticipada({ ...base, mesAmortizacion: 24, importe: 10000, modo: 'reducirCuota', nuevoTin: 3 })
    const sinCambio = amortizacionAnticipada({ ...base, mesAmortizacion: 24, importe: 10000, modo: 'reducirCuota' })
    expect(r.cuotaNueva).toBeLessThan(sinCambio.cuotaNueva)
  })

  test('reducir plazo con un tipo nuevo que la cuota no cubre → error', () => {
    expect(() => amortizacionAnticipada({
      capital: 100000, tin: 1, meses: 240, mesAmortizacion: 0, importe: 1000, modo: 'reducirPlazo', nuevoTin: 50
    })).toThrow(/intereses/)
  })

  test('fechas del fin antes y después', () => {
    const r = amortizacionAnticipada({ ...base, fechaInicio: '2026-01-15', mesAmortizacion: 24, importe: 30000 })
    expect(r.fechaFinActual).toBe('2046-01-15')
    expect(r.fechaFinNueva < r.fechaFinActual).toBe(true)
  })

  test('entradas inválidas', () => {
    expect(() => amortizacionAnticipada({ ...base, mesAmortizacion: 240, importe: 1 })).toThrow(ErrorEntrada)
    expect(() => amortizacionAnticipada({ ...base, mesAmortizacion: 1, importe: 0 })).toThrow(ErrorEntrada)
    expect(() => amortizacionAnticipada({ ...base, mesAmortizacion: 1, importe: 1, modo: 'x' })).toThrow(ErrorEntrada)
  })
})
