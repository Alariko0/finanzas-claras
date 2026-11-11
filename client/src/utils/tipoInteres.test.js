import { describe, test, expect } from 'vitest'
import { FORMULARIO_TIPO_INICIAL, entradaTipo, errorTipo } from './tipoInteres'

const base = FORMULARIO_TIPO_INICIAL

describe('entradaTipo', () => {
  test('fijo: solo sistema, tipo y TIN', () => {
    expect(entradaTipo(base)).toEqual({ sistema: 'frances', tipoInteres: 'fijo', tin: 3.5 })
  })

  test('variable: Euríbor, diferencial y revisión; el TIN solo si se rellena', () => {
    const f = { ...base, tipoInteres: 'variable', tin: '', euribor: '2.5', diferencial: '0.8', periodoRevision: 6 }
    expect(entradaTipo(f)).toEqual({
      sistema: 'frances', tipoInteres: 'variable', diferencial: 0.8, euribor: 2.5, periodoRevision: 6
    })
    expect(entradaTipo({ ...f, tin: 2 }).tin).toBe(2)
  })

  test('mixto: años fijos pasados a meses', () => {
    const f = { ...base, tipoInteres: 'mixto', tin: 2, anosFijos: 10, euribor: 3, diferencial: 1 }
    expect(entradaTipo(f)).toMatchObject({ tipoInteres: 'mixto', tin: 2, mesesFijos: 120 })
  })

  test('cambios del Euríbor como puntos { mes, valor } numéricos', () => {
    const f = { ...base, tipoInteres: 'variable', tin: '', euribor: 3, diferencial: 1, cambiosEuribor: [{ mes: '13', valor: '4' }] }
    expect(entradaTipo(f).euriborFuturo).toEqual([{ mes: 13, valor: 4 }])
  })
})

describe('errorTipo', () => {
  test('fijo siempre es válido', () => {
    expect(errorTipo(base, 300)).toBe('')
  })

  test('variable exige Euríbor y diferencial: no hay valores por defecto', () => {
    const f = { ...base, tipoInteres: 'variable', tin: '' }
    expect(errorTipo(f, 300)).toMatch(/Euríbor/)
    expect(errorTipo({ ...f, euribor: 3 }, 300)).toMatch(/diferencial/)
    expect(errorTipo({ ...f, euribor: 3, diferencial: 1 }, 300)).toBe('')
  })

  test('el Euríbor puede ser 0 o negativo', () => {
    const f = { ...base, tipoInteres: 'variable', tin: '', euribor: 0, diferencial: 1 }
    expect(errorTipo(f, 300)).toBe('')
    expect(errorTipo({ ...f, euribor: -0.5 }, 300)).toBe('')
  })

  test('mixto: los años fijos deben caber en el plazo', () => {
    const f = { ...base, tipoInteres: 'mixto', tin: 2, euribor: 3, diferencial: 1, anosFijos: 25 }
    expect(errorTipo(f, 300)).toMatch(/años a tipo fijo/)
    expect(errorTipo({ ...f, anosFijos: 5 }, 300)).toBe('')
  })

  test('cambios del Euríbor incompletos', () => {
    const f = { ...base, tipoInteres: 'variable', tin: '', euribor: 3, diferencial: 1, cambiosEuribor: [{ mes: 13, valor: '' }] }
    expect(errorTipo(f, 300)).toMatch(/cambios del Euríbor/)
  })
})
