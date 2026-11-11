import { describe, expect, test } from 'vitest'
import { construirTramos, descendientesDe, construirEntradaNomina } from './plan'

describe('construirTramos', () => {
  const hoy = { anio: 2026, mes: 11 }

  test('media: años hacia atrás hasta el mes anterior', () => {
    const t = construirTramos({ modo: 'media', aniosCotizados: '10', baseMedia: '2000', filas: [] }, hoy)
    expect(t).toEqual([{ desde: '2016-11', hasta: '2026-10', baseMensual: 2000 }])
  })

  test('media: cruza el cambio de año cuando estamos en enero', () => {
    const t = construirTramos({ modo: 'media', aniosCotizados: '1', baseMedia: '1500', filas: [] }, { anio: 2027, mes: 1 })
    expect(t).toEqual([{ desde: '2026-01', hasta: '2026-12', baseMensual: 1500 }])
  })

  test('media: con medio año', () => {
    const t = construirTramos({ modo: 'media', aniosCotizados: '0.5', baseMedia: '1500', filas: [] }, hoy)
    expect(t[0]).toEqual({ desde: '2026-05', hasta: '2026-10', baseMensual: 1500 })
  })

  test('media vacía: sin historial', () => {
    expect(construirTramos({ modo: 'media', aniosCotizados: '', baseMedia: '', filas: [] }, hoy)).toEqual([])
    expect(construirTramos({ modo: 'media', aniosCotizados: '5', baseMedia: '', filas: [] }, hoy)).toEqual([])
  })

  test('anual: un tramo por año y el año en curso acaba el mes anterior', () => {
    const filas = [
      { id: 1, anio: '2026', base: '2100' },
      { id: 2, anio: '2025', base: '2000' },
      { id: 3, anio: '2024', base: '' }
    ]
    expect(construirTramos({ modo: 'anual', filas }, hoy)).toEqual([
      { desde: '2026-01', hasta: '2026-10', baseMensual: 2100 },
      { desde: '2025-01', hasta: '2025-12', baseMensual: 2000 }
    ])
  })

  test('anual: en enero el año en curso no aporta meses', () => {
    const filas = [{ id: 1, anio: '2027', base: '2100' }]
    expect(construirTramos({ modo: 'anual', filas }, { anio: 2027, mes: 1 })).toEqual([])
  })

  test('anual: ignora años futuros', () => {
    expect(construirTramos({ modo: 'anual', filas: [{ id: 1, anio: '2030', base: '2000' }] }, hoy)).toEqual([])
  })
})

describe('utils de nómina', () => {
  test('descendientes: menores de 3 primero', () => {
    expect(descendientesDe(3, 1)).toEqual([{ edad: 1 }, { edad: 10 }, { edad: 10 }])
    expect(descendientesDe(1, 5)).toEqual([{ edad: 1 }])
    expect(descendientesDe(0, 0)).toEqual([])
  })

  test('entrada de nómina: sin hijos la situación 1 pasa a 3 y el prorrateo solo con 14 pagas', () => {
    const base = { brutoAnual: 30000, pagas: 14, prorrateo: true, grupo: 1, contrato: 'indefinido', situacion: 1, hijos: 0, hijosMenores3: 0, edad: 40 }
    expect(construirEntradaNomina(base)).toMatchObject({ situacionFamiliar: 3, prorrateo: true, grupoCotizacion: 1, contribuyente: { edad: 40 } })
    expect(construirEntradaNomina({ ...base, pagas: 12 }).prorrateo).toBe(false)
  })
})
