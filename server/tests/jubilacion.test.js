const { proyectarJubilacion } = require('../services/jubilacion')

/*
 * Casos calculados aparte del servicio: sumas directas con rentabilidad 0 y la anualidad
 * clásica (1,005^360 − 1) / 0,005 = 1004,5150 con tipo mensual del 0,5 %.
 */

const base = { edadActual: 35, edadJubilacion: 45, rentabilidad: 0 }

describe('proyectarJubilacion: capitalización', () => {
  test('rentabilidad 0 sin dividir por cero: ahorro + aportaciones', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 10000, aportacionMensual: 500 })
    expect(r.capital).toBe(70000) // 10.000 + 500 × 12 × 10
    expect(r.totalAportado).toBe(70000)
    expect(r.rendimientos).toBe(0)
    expect(r.anosHastaJubilacion).toBe(10)
  })

  test('anualidad clásica: 500 €/mes a 30 años con 0,5 % mensual = 502.257,52 €', () => {
    const efectiva = (Math.pow(1.005, 12) - 1) * 100
    const r = proyectarJubilacion({ edadActual: 35, edadJubilacion: 65, rentabilidad: efectiva, aportacionMensual: 500 })
    expect(r.capital).toBeCloseTo(502257.52, 1)
    expect(r.totalAportado).toBe(180000)
  })

  test('ahorro inicial con interés compuesto anual: 10.000 € al 5 % a 10 años', () => {
    const r = proyectarJubilacion({ ...base, rentabilidad: 5, ahorroActual: 10000 })
    expect(r.capital).toBeCloseTo(16288.95, 2) // 10.000 × 1,05^10
  })

  test('la aportación puede crecer cada año', () => {
    const r = proyectarJubilacion({
      edadActual: 40, edadJubilacion: 42, rentabilidad: 0, aportacionMensual: 100, crecimientoAportacion: 10
    })
    expect(r.capital).toBe(2520) // 1.200 + 1.320
  })

  test('euros de hoy: 100.000 € a 10 años con inflación del 2 %', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 100000, inflacion: 2 })
    expect(r.capital).toBe(100000)
    expect(r.capitalReal).toBeCloseTo(82034.83, 2)
  })

  test('serie anual: arranca hoy y acaba en la jubilación', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 1000, aportacionMensual: 100 })
    expect(r.serie).toHaveLength(11)
    expect(r.serie[0]).toMatchObject({ edad: 35, capital: 1000 })
    expect(r.serie[10]).toMatchObject({ edad: 45, capital: r.capital })
  })

  test('rentabilidad negativa reduce el capital', () => {
    const r = proyectarJubilacion({ ...base, rentabilidad: -2, ahorroActual: 10000 })
    expect(r.capital).toBeCloseTo(10000 * Math.pow(0.98, 10), 2)
    expect(r.rendimientos).toBeLessThan(0)
  })

  test('efecto de aportar 100 € más al mes (lineal)', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 5000 })
    expect(r.efectoAportacionExtra).toEqual({ importeMensual: 100, capitalExtra: 12000 })
  })
})

describe('proyectarJubilacion: renta y cobertura', () => {
  test('regla del 4 %: 600.000 € dan 2.000 € al mes', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 600000 })
    expect(r.renta).toMatchObject({ tasaRetiro: 4, mensual: 2000, mensualReal: 2000 })
  })

  test('renta en euros de hoy con inflación', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 600000, inflacion: 2 })
    expect(r.renta.mensualReal).toBeCloseTo(2000 / Math.pow(1.02, 10), 2)
  })

  test('sin rentabilidad ni inflación, 120.000 € retirando 1.000 €/mes duran justo 10 años', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 120000, rentaDeseadaMensual: 1000 })
    expect(r.cobertura).toMatchObject({ meses: 120, anos: 10, perpetua: false, edadAgotamiento: 55 })
  })

  test('la inflación encarece el retiro y acorta la cobertura', () => {
    // 12 retiros de 1.218,99 € (14.627,9 €) y luego 1.243,37 € (×1,02): 7 más con lo que queda
    const r = proyectarJubilacion({
      ...base, ahorroActual: 24000, rentaDeseadaMensual: 1000, inflacion: 2, rentabilidadJubilacion: 0
    })
    // A la jubilación 1.000 € de hoy son 1.000 × 1,02^10 = 1.218,99 €/mes
    expect(r.cobertura.retiroMensualInicial).toBeCloseTo(1218.99, 2)
    expect(r.cobertura.meses).toBe(19) // 24.000 / 1.218,99 ≈ 19,7 → 19 retiros completos
  })

  test('con rentabilidad mayor que el retiro el capital no se agota (perpetua)', () => {
    const r = proyectarJubilacion({ ...base, rentabilidad: 6, ahorroActual: 600000 })
    expect(r.cobertura.perpetua).toBe(true)
    expect(r.cobertura.edadAgotamiento).toBeNull()
  })

  test('sin capital no hay cobertura', () => {
    expect(proyectarJubilacion(base).cobertura).toBeNull()
  })
})

describe('proyectarJubilacion: objetivo de renta', () => {
  test('capital necesario y falta, con pensión pública', () => {
    const r = proyectarJubilacion({
      ...base, ahorroActual: 100000, rentaDeseadaMensual: 2500, pensionPublicaMensual: 1500
    })
    // Hay que cubrir 1.000 €/mes = 12.000 €/año → 12.000 / 0,04 = 300.000 €
    expect(r.objetivo).toMatchObject({
      rentaACubrirConAhorro: 1000, capitalNecesario: 300000, falta: 200000, cumplido: false
    })
  })

  test('la aportación extra calculada alcanza justo el capital necesario', () => {
    const entrada = { edadActual: 35, edadJubilacion: 65, rentabilidad: 4, ahorroActual: 20000, rentaDeseadaMensual: 1500 }
    const r = proyectarJubilacion(entrada)
    expect(r.objetivo.cumplido).toBe(false)
    const con = proyectarJubilacion({ ...entrada, aportacionMensual: r.objetivo.aportacionExtraMensual })
    expect(con.capital).toBeGreaterThanOrEqual(con.objetivo.capitalNecesario - 5)
    expect(con.capital).toBeLessThan(con.objetivo.capitalNecesario + 50)
  })

  test('objetivo cumplido: falta 0', () => {
    const r = proyectarJubilacion({ ...base, ahorroActual: 1000000, rentaDeseadaMensual: 2000 })
    expect(r.objetivo).toMatchObject({ falta: 0, cumplido: true, aportacionExtraMensual: 0 })
  })

  test('con inflación, el capital necesario se expresa también en euros de hoy', () => {
    const r = proyectarJubilacion({ ...base, inflacion: 3, rentaDeseadaMensual: 1000 })
    expect(r.objetivo.capitalNecesarioReal).toBeCloseTo(300000, 1) // 1.000 × 12 / 0,04
    expect(r.objetivo.capitalNecesario).toBeCloseTo(300000 * Math.pow(1.03, 10), 1)
  })
})

describe('proyectarJubilacion: validación', () => {
  test.each([
    ['sin entrada', undefined],
    ['edad de jubilación no mayor que la actual', { ...base, edadJubilacion: 35 }],
    ['edad con decimales', { ...base, edadActual: 35.5 }],
    ['sin rentabilidad', { edadActual: 35, edadJubilacion: 65 }],
    ['rentabilidad fuera de rango', { ...base, rentabilidad: 80 }],
    ['ahorro negativo', { ...base, ahorroActual: -1 }],
    ['ahorro como texto', { ...base, ahorroActual: '1000' }],
    ['tasa de retiro cero', { ...base, tasaRetiro: 0 }]
  ])('rechaza %s', (_nombre, entrada) => {
    expect(() => proyectarJubilacion(entrada)).toThrow(expect.objectContaining({ name: 'ErrorEntrada' }))
  })

  test('incluye avisos de estimación', () => {
    expect(proyectarJubilacion(base).avisos.length).toBeGreaterThanOrEqual(3)
  })
})
