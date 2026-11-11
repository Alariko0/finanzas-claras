const {
  estimarPensionJubilacion, porcentajeBase, porcentajeDemora, edadOrdinariaMeses, ventanaDe
} = require('../services/pension/pensionJubilacion')
const ipc = require('../services/pension/ipcIndice')
const datos = require('../services/pension/datosPension2026')
const { liquidacionIRPF } = require('../services/fiscal/liquidacionIRPF')

/*
 * Casos calculados a mano a partir del texto de la LGSS (arts. 205, 209, 210 y DT 7.ª, 9.ª, 40.ª).
 */

describe('datos de la pensión', () => {
  test('la serie del INE es mensual y completa: enero 2002 a diciembre 2025', () => {
    expect(ipc.INICIO).toBe('2002-01')
    expect(ipc.VALORES).toHaveLength(288)
    expect(ipc.VALORES.every((v) => v > 0)).toBe(true)
  })

  test('el porcentaje de la ley llega justo al 100 % (37 años desde 2027, 37 y 6 meses antes)', () => {
    for (const r of datos.PORCENTAJES.porAnio) {
      const total = datos.PORCENTAJES.porcentajeBase + r.tramos.reduce((s, t) => s + t.meses * t.porcentaje, 0)
      expect(total).toBeCloseTo(100, 6)
    }
  })

  test('cada año de transición tiene más meses y divisor mayor que el anterior', () => {
    const t = datos.BASE_REGULADORA.transitoria
    for (let a = 2027; a <= 2036; a++) {
      expect(t[a].mejores).toBeGreaterThan(t[a - 1].mejores)
      expect(t[a].divisor).toBeGreaterThan(t[a - 1].divisor)
    }
  })

  test('la máxima mensual × 14 = máxima anual del RD 241/2026', () => {
    expect(datos.LIMITES.maximaMensual * 14).toBeCloseTo(datos.LIMITES.maximaAnual, 2)
  })
})

describe('reglas por año', () => {
  test('ventana de la base reguladora (DT 40.ª)', () => {
    expect(ventanaDe(2026)).toEqual({ ventana: 304, mejores: 302, divisor: 352.33 })
    expect(ventanaDe(2031)).toEqual({ ventana: 324, mejores: 312, divisor: 364 })
    expect(ventanaDe(2037)).toEqual({ ventana: 348, mejores: 324, divisor: 378 })
    expect(ventanaDe(2060)).toEqual({ ventana: 348, mejores: 324, divisor: 378 })
    expect(() => ventanaDe(2025)).toThrow(expect.objectContaining({ name: 'ErrorEntrada' }))
  })

  test('edad ordinaria (art. 205 y DT 7.ª)', () => {
    expect(edadOrdinariaMeses(2030, 462)).toBe(65 * 12) // 38 años y 6 meses
    expect(edadOrdinariaMeses(2030, 461)).toBe(67 * 12)
    expect(edadOrdinariaMeses(2026, 459)).toBe(65 * 12) // 38 años y 3 meses
    expect(edadOrdinariaMeses(2026, 458)).toBe(66 * 12 + 10)
  })

  test('porcentaje por meses cotizados desde 2027', () => {
    expect(porcentajeBase(2058, 180)).toBe(50)
    expect(porcentajeBase(2058, 179)).toBe(50)
    expect(porcentajeBase(2058, 180 + 248)).toBeCloseTo(97.12, 6) // 50 + 248 × 0,19
    expect(porcentajeBase(2058, 180 + 264)).toBeCloseTo(100, 6) // + 16 × 0,18
    expect(porcentajeBase(2058, 600)).toBe(100)
  })

  test('porcentaje por meses cotizados 2023-2026 (DT 9.ª)', () => {
    expect(porcentajeBase(2026, 180 + 49)).toBeCloseTo(50 + 49 * 0.21, 6) // 60,29
    expect(porcentajeBase(2026, 180 + 258)).toBeCloseTo(100, 6) // 37 años y 6 meses
  })

  test('demora: 4 % por año completo y 2 % por >6 meses desde el segundo año', () => {
    expect(porcentajeDemora(11)).toBe(0)
    expect(porcentajeDemora(12)).toBe(4)
    expect(porcentajeDemora(18)).toBe(4) // en el primer año las fracciones no cuentan
    expect(porcentajeDemora(24)).toBe(8)
    expect(porcentajeDemora(30)).toBe(8) // 6 meses justos no pasan de 6
    expect(porcentajeDemora(31)).toBe(10)
  })
})

describe('estimarPensionJubilacion', () => {
  // 37 años, base constante de 3.000 €/mes durante 30 años, sin inflación: toda la ventana es futuro
  const llana = { fechaActual: '2026-11', edadActual: 37, edadJubilacion: 67, baseMensualActual: 3000 }

  test('base reguladora = 324 × 3.000 / 378 y 84,2 % por 30 años (hecho causante 2056)', () => {
    const r = estimarPensionJubilacion(llana)
    expect(r.cumpleRequisitos).toBe(true)
    expect(r.hechoCausante).toBe('2056-11')
    expect(r.mesesCotizados).toBe(360)
    expect(r.aniosCotizados).toBe(30)
    expect(r.baseReguladora).toMatchObject({ ventanaMeses: 348, mejoresMeses: 324, divisor: 378, lagunas: 0 })
    expect(r.baseReguladora.mensual).toBeCloseTo((324 * 3000) / 378, 2) // 2.571,43
    // 50 % + 180 meses × 0,19 % = 84,2 %
    expect(r.porcentaje).toEqual({ base: 84.2, demora: 0, total: 84.2 })
    expect(r.pension.mensual).toBeCloseTo(2165.14, 2)
    expect(r.pension.anual).toBeCloseTo(30312, 1) // 14 pagas
    expect(r.pension.limitadaPorMaxima).toBe(false)
    expect(r.tasaSustitucion).toBeCloseTo((30312 / 36000) * 100, 1)
  })

  test('la inflación pasa la pensión a euros de hoy', () => {
    const r = estimarPensionJubilacion({ ...llana, inflacion: 2, crecimientoBases: 0 })
    expect(r.pension.mensualReal).toBeCloseTo(r.pension.mensual / Math.pow(1.02, 30), 1)
  })

  test('jubilarse más tarde suma el 4 % por año de demora', () => {
    // 32 años cotizados (384 meses): 50 + 204 × 0,19 = 88,76 %; demora de 2 años = +8 %
    const r = estimarPensionJubilacion({ ...llana, edadJubilacion: 69 })
    expect(r.porcentaje).toEqual({ base: 88.76, demora: 8, total: 96.76 })
    expect(r.pension.mensual).toBeCloseTo(((324 * 3000) / 378) * 0.9676, 2)
  })

  test('el tope máximo limita la pensión (3.359,60 €/mes, 47.034,40 €/año)', () => {
    const r = estimarPensionJubilacion({ fechaActual: '2026-11', edadActual: 25, edadJubilacion: 67, baseMensualActual: 5101.2 })
    // 42 años cotizados: 100 %, y a los 67 hay 2 años de demora sobre los 65 (+8 %)
    expect(r.porcentaje).toEqual({ base: 100, demora: 8, total: 108 })
    expect(r.pension.limitadaPorMaxima).toBe(true)
    expect(r.pension.mensual).toBe(3359.6)
    expect(r.pension.anual).toBe(47034.4)
  })

  test('una base por encima de la máxima se limita y avisa', () => {
    const r = estimarPensionJubilacion({ ...llana, baseMensualActual: 9000 })
    expect(r.avisos.join(' ')).toMatch(/base máxima/)
    expect(r.baseReguladora.mensual).toBeCloseTo((324 * 5101.2) / 378, 2)
  })

  test('historial pasado: bases antiguas actualizadas con el IPC y las 24 últimas a valor nominal', () => {
    const e = {
      fechaActual: '2026-11', edadActual: 63, edadJubilacion: 67, inflacion: 2, crecimientoBases: 0,
      baseMensualActual: 2000, tramos: [{ desde: '2000-01', hasta: '2026-10', baseMensual: 2000 }]
    }
    const r = estimarPensionJubilacion(e)
    // Hecho causante 2030-11: 320 meses de ventana, 310 mejores, ÷361,67 (DT 40.ª)
    const idx = (a, m) => a * 12 + m - 1
    const c = idx(2030, 11)
    const i0 = idx(2002, 1)
    const fin = i0 + ipc.VALORES.length - 1
    const I = (m) => (m <= fin ? ipc.VALORES[m - i0] : ipc.VALORES[ipc.VALORES.length - 1] * Math.pow(1.02, (m - fin) / 12))
    const valores = []
    for (let m = c - 1 - 320; m <= c - 2; m++) valores.push(m > c - 2 - 24 ? 2000 : 2000 * (I(c - 26) / I(m)))
    const esperado = valores.sort((a, b) => b - a).slice(0, 310).reduce((s, v) => s + v, 0) / 361.67
    expect(r.baseReguladora).toMatchObject({ ventanaMeses: 320, mejoresMeses: 310, divisor: 361.67, lagunas: 0 })
    expect(r.baseReguladora.mensual).toBeCloseTo(esperado, 1)
    expect(r.mesesCotizados).toBe(idx(2030, 11) - idx(2000, 1))
  })

  test('lagunas: los meses sin cotizar de la ventana se rellenan y se avisa', () => {
    // Cotiza desde ahora y se jubila en 2046-11: los 109 meses de 2017-10 a 2026-10 son lagunas
    const r = estimarPensionJubilacion({ fechaActual: '2026-11', edadActual: 47, edadJubilacion: 67, baseMensualActual: 3000 })
    expect(r.baseReguladora.lagunas).toBe(109)
    expect(r.avisos.join(' ')).toMatch(/109 meses/)
    expect(r.baseReguladora.mensual).toBeLessThan((324 * 3000) / 378)
  })

  test('no cumple los 15 años cotizados: sin importe y con el motivo', () => {
    const r = estimarPensionJubilacion({ fechaActual: '2026-11', edadActual: 57, edadJubilacion: 67, baseMensualActual: 3000 })
    expect(r.cumpleRequisitos).toBe(false)
    expect(r.motivos.join(' ')).toMatch(/15 años/)
    expect(r.pension).toBeUndefined()
  })

  test('jubilación anticipada: no incluida, con la edad ordinaria', () => {
    const r = estimarPensionJubilacion({ ...llana, edadJubilacion: 64, edadActual: 34 })
    expect(r.cumpleRequisitos).toBe(false)
    expect(r.motivos.join(' ')).toMatch(/anticipada/)
    expect(r.edadOrdinaria).toEqual({ meses: 804, texto: '67 años' })
  })

  test('65 años con 38 años y 6 meses cotizados (art. 205.1.a)', () => {
    const r = estimarPensionJubilacion({ fechaActual: '2026-11', edadActual: 23, edadJubilacion: 65, baseMensualActual: 2000 })
    expect(r.mesesCotizados).toBe(504) // 42 años
    expect(r.edadOrdinaria.texto).toBe('65 años')
    expect(r.cumpleRequisitos).toBe(true)
  })

  test('IRPF de la pensión con la comunidad, en euros de hoy', () => {
    const r = estimarPensionJubilacion({ ...llana, comunidad: 'madrid' })
    const l = liquidacionIRPF({ comunidad: 'madrid', rendimientoIntegro: r.pension.anualReal, contribuyente: { edad: 67 } })
    expect(r.irpf.cuotaAnual).toBe(l.cuotaIntegra)
    expect(r.irpf.netoAnual).toBeCloseTo(r.pension.anualReal - l.cuotaIntegra, 2)
    expect(r.irpf.netoMensual).toBeCloseTo(r.irpf.netoAnual / 14, 1)
  })

  test('régimen foral: la pensión se calcula pero el IRPF devuelve aviso', () => {
    const r = estimarPensionJubilacion({ ...llana, comunidad: 'navarra' })
    expect(r.pension.mensual).toBeGreaterThan(0)
    expect(r.irpf).toMatchObject({ soportado: false })
  })

  test('por debajo de la mínima avisa del complemento', () => {
    const r = estimarPensionJubilacion({ fechaActual: '2026-11', edadActual: 45, edadJubilacion: 67, baseMensualActual: 1424.4 })
    expect(r.pension.anual).toBeLessThan(r.pension.minimaAnual)
    expect(r.pension.bajoMinima).toBe(true)
    expect(r.pension.minimaAnual).toBe(13106.8)
    expect(r.avisos.join(' ')).toMatch(/complemento por mínimos/)
  })

  test('la mínima depende de la situación familiar', () => {
    const base = { fechaActual: '2026-11', edadActual: 45, edadJubilacion: 67, baseMensualActual: 1424.4 }
    expect(estimarPensionJubilacion({ ...base, situacionMinimo: 'conyugeACargo' }).pension.minimaAnual).toBe(17592.4)
    expect(estimarPensionJubilacion({ ...base, situacionMinimo: 'conyugeNoACargo' }).pension.minimaAnual).toBe(12441.8)
  })
})

describe('estimarPensionJubilacion: validación', () => {
  const ok = { fechaActual: '2026-11', edadActual: 37, edadJubilacion: 67, baseMensualActual: 3000 }
  test.each([
    ['sin entrada', undefined],
    ['edad con decimales', { ...ok, edadActual: 37.5 }],
    ['jubilación antes que hoy', { ...ok, edadJubilacion: 30 }],
    ['fecha mal escrita', { ...ok, fechaActual: '11/2026' }],
    ['base negativa', { ...ok, baseMensualActual: -1 }],
    ['tramo con hasta antes que desde', { ...ok, tramos: [{ desde: '2010-05', hasta: '2010-01', baseMensual: 1000 }] }],
    ['tramo que llega al mes actual', { ...ok, tramos: [{ desde: '2020-01', hasta: '2026-11', baseMensual: 1000 }] }],
    ['tramos solapados', { ...ok, tramos: [{ desde: '2010-01', hasta: '2012-12', baseMensual: 1000 }, { desde: '2012-12', hasta: '2013-12', baseMensual: 1000 }] }],
    ['situación de mínimos desconocida', { ...ok, situacionMinimo: 'viudo' }],
    ['jubilación antes de 2026', { ...ok, fechaActual: '2020-01', edadActual: 30, edadJubilacion: 35 }]
  ])('rechaza %s', (_n, mala) => {
    expect(() => estimarPensionJubilacion(mala)).toThrow(expect.objectContaining({ name: 'ErrorEntrada' }))
  })
})
