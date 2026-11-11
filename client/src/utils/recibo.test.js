import { describe, expect, test } from 'vitest'
import { aEntradaRecibo, aFormulario, aplicarRetribucionConvenio, categoriasDisponibles, hayDevengos, linea, reciboInicial, tramosDeNominas } from './recibo'

describe('aEntradaRecibo', () => {
  test('envía solo lo escrito: los campos vacíos y las líneas sin nada no viajan', () => {
    const f = reciboInicial(2026, 3)
    f.devengos.salarioBase = '2000'
    f.devengos.complementos = [linea('Antigüedad', '100'), linea('', '')]
    f.deducciones.ss.contingenciasComunes = '117.5'
    f.deducciones.irpf = { base: '', tipo: '12', importe: '300' }
    f.encabezado.empresa = '  Acme SL '
    f.encabezado.grupoCotizacion = '1'

    expect(aEntradaRecibo(f)).toEqual({
      anio: 2026,
      mes: 3,
      tipo: 'ordinaria',
      encabezado: { empresa: 'Acme SL', grupoCotizacion: 1 },
      devengos: { salarioBase: 2000, complementos: [{ concepto: 'Antigüedad', importe: 100 }], noSalariales: [] },
      deducciones: { ss: { contingenciasComunes: 117.5 }, irpf: { tipo: 12, importe: 300 }, otras: [] },
      bases: {}
    })
  })

  test('el cero escrito es un valor (no es lo mismo que dejarlo vacío)', () => {
    const f = reciboInicial(2026, 1)
    f.devengos.salarioBase = '1500'
    f.deducciones.ss.mei = '0'
    expect(aEntradaRecibo(f).deducciones.ss).toEqual({ mei: 0 })
  })
})

describe('hayDevengos', () => {
  test('hace falta algún devengo mayor que 0', () => {
    const f = reciboInicial(2026, 1)
    expect(hayDevengos(f)).toBe(false)
    f.devengos.noSalariales = [linea('Dietas', '30')]
    expect(hayDevengos(f)).toBe(true)
  })
})

describe('aFormulario', () => {
  test('recupera el formulario de una nómina guardada y vuelve a dar la misma entrada', () => {
    const f = reciboInicial(2026, 3)
    f.devengos.salarioBase = '2000'
    f.devengos.noSalariales = [linea('Transporte', '50')]
    f.deducciones.irpf = { base: '2000', tipo: '12', importe: '240' }
    f.encabezado.empresa = 'Acme SL'
    f.encabezado.grupoCotizacion = '1'
    const entrada = aEntradaRecibo(f)

    const guardada = { anio: 2026, mes: 3, tipo: 'ordinaria', fechaCobro: null, datos: entrada }
    expect(aEntradaRecibo(aFormulario(guardada))).toEqual(entrada)
  })
})

describe('tramosDeNominas', () => {
  test('un tramo de un mes por cada base registrada', () => {
    expect(tramosDeNominas([{ mes: '2026-01', base: 2400 }])).toEqual([{ desde: '2026-01', hasta: '2026-01', baseMensual: 2400 }])
  })
})

describe('convenio', () => {
  const convenio = {
    categorias: [
      { nivel: 'III', nombre: 'Camarero/a' },
      { nivel: 'II-C', nombre: 'Cocinero/a de Catering' },
      { nivel: 'III-B', nombre: 'Ayudante de Equipo de Catering' }
    ]
  }

  test('II-C y III-B solo salen en catering', () => {
    expect(categoriasDisponibles(convenio, 'B').map((c) => c.nombre)).toEqual(['Camarero/a'])
    expect(categoriasDisponibles(convenio, 'D')).toHaveLength(3)
  })

  test('aplicar la retribución del convenio pone el salario base y sustituye sus pluses anteriores', () => {
    const f = reciboInicial(2025, 3)
    f.devengos.complementos = [linea('Antigüedad', '50'), linea('Plus convenio', '100')]
    const r = {
      lineas: [
        { tipo: 'salarioBase', concepto: 'Salario base (convenio)', importe: 1250.91 },
        { tipo: 'complemento', concepto: 'Plus convenio', importe: 191.22 }
      ]
    }
    const nuevo = aplicarRetribucionConvenio(f, r)
    expect(nuevo.devengos.salarioBase).toBe('1250.91')
    expect(nuevo.devengos.complementos.map((l) => [l.concepto, l.importe])).toEqual([
      ['Antigüedad', '50'],
      ['Plus convenio', '191.22']
    ])
  })
})
