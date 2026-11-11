const datos = require('../services/fiscal/datos2026')
const {
  calcularPlanPensionesPrivado, reduccionPrevision, aportacionPropiaMaxima
} = require('../services/fiscal/planPensionesPrivado')
const { liquidacionIRPF } = require('../services/fiscal/liquidacionIRPF')

/*
 * Límites del art. 52 LIRPF (BOE-A-2006-20764) calculados a mano a partir del texto del BOE.
 */

const rn = 40000
const lim = (propia, empresa, rendimientoNeto = rn, rendimientosEmpresa = 30000) =>
  reduccionPrevision({ propia, empresa, rendimientoNeto, rendimientosEmpresa })

describe('datos2026: PREVISION_SOCIAL', () => {
  test('cifras del art. 52', () => {
    const p = datos.PREVISION_SOCIAL
    expect([p.porcentajeRendimientos, p.limiteGeneral, p.incrementoContribucionEmpresa, p.umbralMultiplicadorUno])
      .toEqual([30, 1500, 8500, 60000])
  })
})

describe('reduccionPrevision (art. 52.1)', () => {
  test('sin empresa: 1.500 € de límite', () => {
    expect(lim(3000, 0)).toMatchObject({ limite: 1500, aplicada: 1500, exceso: 1500, incremento: 0 })
  })

  test('el 30 % de los rendimientos netos limita si es menor', () => {
    expect(lim(1000, 0, 3000)).toMatchObject({ limite: 900, aplicada: 900, exceso: 100 })
  })

  test('contribución de la empresa de 2.000 € y propia de 1.000 €: límite 1.500 + 3.000', () => {
    // M(2.000) = 2.000 × 1; emparejada = 1.000; incremento = 2.000 + 1.000
    expect(lim(1000, 2000)).toMatchObject({ incremento: 3000, limite: 4500, aportado: 3000, aplicada: 3000, exceso: 0 })
  })

  test('tramo hasta 500 € multiplica por 2,5 (empresa 400 → hasta 1.000 € del trabajador)', () => {
    expect(lim(2000, 400)).toMatchObject({ incremento: 1400, limite: 2900, aportado: 2400, aplicada: 2400 })
  })

  test('tramo 500–1.500 €: empresa 1.000 → 1.250 + 0,25 × 500 = 1.375 €', () => {
    expect(lim(5000, 1000)).toMatchObject({ incremento: 2375 })
  })

  test('con más de 60.000 € de la empresa el multiplicador es siempre 1', () => {
    // empresa 400: M = 400 (no 1.000)
    expect(lim(2000, 400, rn, 70000)).toMatchObject({ incremento: 800 })
  })

  test('el incremento nunca pasa de 8.500 €: máximo conjunto 10.000 €', () => {
    expect(lim(0, 9000, 100000)).toMatchObject({ incremento: 8500, limite: 10000, aplicada: 9000 })
    expect(lim(5000, 9000, 100000)).toMatchObject({ aplicada: 10000, exceso: 4000 })
  })
})

describe('aportacionPropiaMaxima = mayor aportación que se reduce entera', () => {
  // Contraste por fuerza bruta con reduccionPrevision, de euro en euro
  const brutaMaxima = (empresa, rendimientoNeto, rendimientosEmpresa) => {
    let mejor = 0
    for (let a = 0; a <= 12000; a++) {
      const r = reduccionPrevision({ propia: a, empresa, rendimientoNeto, rendimientosEmpresa })
      if (r.exceso < 1e-9) mejor = a
    }
    return mejor
  }

  test.each([
    [0, 40000, 30000],
    [0, 3000, 30000],
    [400, 40000, 30000],
    [1000, 40000, 30000],
    [2000, 40000, 30000],
    [2000, 40000, 70000],
    [5000, 100000, 30000],
    [9000, 100000, 30000],
    [3000, 8000, 30000]
  ])('empresa %i €, rendimiento neto %i €, de la empresa %i €', (empresa, neto, deEmpresa) => {
    const cierre = aportacionPropiaMaxima({ empresa, rendimientoNeto: neto, rendimientosEmpresa: deEmpresa })
    expect(Math.floor(cierre + 1e-9)).toBe(brutaMaxima(empresa, neto, deEmpresa))
  })
})

describe('calcularPlanPensionesPrivado', () => {
  const entrada = {
    brutoAnual: 50000,
    comunidad: 'madrid',
    edadActual: 35,
    edadJubilacion: 67,
    rentabilidad: 5,
    inflacion: 2,
    aportacionAnual: 1500,
    pensionPublicaMensual: 1500
  }

  // Tipo marginal de un tramo de la escala (datos2026, independiente de liquidacionIRPF)
  const tipoEn = (tramos, base) => [...tramos].reverse().find((t) => base >= t.desde).tipo

  test('el ahorro fiscal es el tipo marginal (estatal + autonómico) × lo aportado', () => {
    const r = calcularPlanPensionesPrivado(entrada)
    // 50.000 − SS 3.249,96 − 2.000 de gastos = 44.750,04 de base: tramos 18,5 % + 17,4 %
    const base = r.fiscal.rendimientoNeto
    const marginal = tipoEn(datos.ESCALA_ESTATAL_GENERAL, base) + tipoEn(datos.ESCALAS_AUTONOMICAS.madrid.tramos, base)
    expect(marginal).toBeCloseTo(35.9, 5)
    expect(r.fiscal.ahorroFiscal).toBeCloseTo((1500 * marginal) / 100, 1)
    expect(r.fiscal.tipoAhorro).toBeCloseTo(35.9, 1)
    expect(r.fiscal.costeNeto).toBeCloseTo(1500 - r.fiscal.ahorroFiscal, 2)
  })

  test('las cotizaciones y la base coinciden con la nómina (6,5 % de 50.000 €)', () => {
    const r = calcularPlanPensionesPrivado(entrada)
    expect(r.fiscal.cotizacionesSS).toBeCloseTo(3250, 0)
    expect(r.fiscal.rendimientoNeto).toBeCloseTo(50000 - r.fiscal.cotizacionesSS - 2000, 2)
  })

  test('sin aportar no hay ahorro fiscal', () => {
    const r = calcularPlanPensionesPrivado({ ...entrada, aportacionAnual: 0 })
    expect(r.fiscal.ahorroFiscal).toBe(0)
    expect(r.fiscal.tipoAhorro).toBeNull()
  })

  test('lo que pasa del límite no ahorra impuestos', () => {
    const a = calcularPlanPensionesPrivado({ ...entrada, aportacionAnual: 1500 })
    const b = calcularPlanPensionesPrivado({ ...entrada, aportacionAnual: 4000 })
    expect(b.fiscal.ahorroFiscal).toBe(a.fiscal.ahorroFiscal)
    expect(b.fiscal.exceso).toBe(2500)
    expect(b.avisos.join(' ')).toMatch(/supera el límite/)
  })

  test('la contribución de la empresa amplía lo que puedes reducir tú', () => {
    const r = calcularPlanPensionesPrivado({ ...entrada, aportacionAnual: 3000, contribucionEmpresaAnual: 3000 })
    // M(3.000) = 3.000; emparejada = 3.000; incremento = 6.000; límite 1.500 + 6.000 = 7.500; aportado 6.000
    expect(r.fiscal).toMatchObject({ limiteReduccion: 7500, incrementoEmpresa: 6000, reduccionAplicada: 6000, exceso: 0 })
    // El ahorro solo cuenta lo que pones tú: la empresa suma al rendimiento y lo reduce a la vez
    const marginal = 0.359
    expect(r.fiscal.ahorroFiscal / 3000).toBeCloseTo(marginal, 1)
  })

  test('el plan se alimenta con aportación propia + empresa y el saldo actual', () => {
    const r = calcularPlanPensionesPrivado({
      ...entrada, rentabilidad: 0, inflacion: 0, saldoActual: 1000, aportacionAnual: 1200, contribucionEmpresaAnual: 600
    })
    expect(r.proyeccion.capital).toBe(1000 + 1800 * 32) // 32 años
  })

  test('el rescate en renta tributa sumado a la pensión pública', () => {
    const r = calcularPlanPensionesPrivado(entrada)
    const jubilado = (integro) => liquidacionIRPF({ comunidad: 'madrid', rendimientoIntegro: integro, contribuyente: { edad: 67 } }).cuotaIntegra
    const esperado = jubilado(18000 + r.rescate.rentaPlanAnual) - jubilado(18000)
    expect(r.rescate.impuestoAnual).toBeCloseTo(esperado, 1)
    expect(r.rescate.netoMensual).toBeCloseTo((r.rescate.rentaPlanAnual - r.rescate.impuestoAnual) / 12, 1)
    expect(r.rescate.tipoMedio).toBeGreaterThan(0)
  })

  test('sin pensión pública el rescate paga menos impuesto', () => {
    const con = calcularPlanPensionesPrivado(entrada).rescate.tipoMedio
    const sin = calcularPlanPensionesPrivado({ ...entrada, pensionPublicaMensual: 0 }).rescate.tipoMedio
    expect(sin).toBeLessThan(con)
  })

  test('régimen foral: aviso y ningún importe', () => {
    const r = calcularPlanPensionesPrivado({ ...entrada, comunidad: 'paisVasco' })
    expect(r.soportado).toBe(false)
    expect(r.aviso).toMatch(/\S/)
    expect(r.fiscal).toBeUndefined()
  })

  test.each([
    ['sin sueldo', { ...entrada, brutoAnual: undefined }],
    ['aportación negativa', { ...entrada, aportacionAnual: -1 }],
    ['sin rentabilidad', { ...entrada, rentabilidad: undefined }],
    ['jubilación antes de hoy', { ...entrada, edadJubilacion: 30 }],
    ['comunidad desconocida', { ...entrada, comunidad: 'atlantida' }]
  ])('rechaza %s', (_n, mala) => {
    expect(() => calcularPlanPensionesPrivado(mala)).toThrow(expect.objectContaining({ name: 'ErrorEntrada' }))
  })
})

describe('liquidacionIRPF: reduccionesBase', () => {
  const base = { comunidad: 'madrid', rendimientoIntegro: 50000, cotizacionesSS: 3250 }
  test('resta de la base liquidable general', () => {
    const a = liquidacionIRPF(base)
    const b = liquidacionIRPF({ ...base, reduccionesBase: 1500 })
    expect(a.reduccionesBase).toBe(0)
    expect(b.reduccionesBase).toBe(1500)
    expect(b.baseLiquidableGeneral).toBeCloseTo(a.baseLiquidableGeneral - 1500, 2)
    expect(b.cuotaIntegra).toBeLessThan(a.cuotaIntegra)
  })
  test('no puede ser negativa', () => {
    expect(() => liquidacionIRPF({ ...base, reduccionesBase: -1 })).toThrow()
  })
})
