const { normalizarRecibo, resumenNominas } = require('../services/nominaMensual')

// Recibo calculado a mano (grupo 1, indefinido, 2026)
//   Devengos salariales: 2.000 + 100 (antigüedad) + 400 (paga extra prorrateada) = 2.500
//   No salarial: transporte 50 → bruto 2.550
//   SS sobre base 2.500: CC 4,70 % = 117,50 · desempleo 1,55 % = 38,75 · FP 0,10 % = 2,50 · MEI 0,15 % = 3,75 → 162,50
//   IRPF 12 % de 2.500 = 300 · plan de empleo 50 · anticipo 100
//   Deducciones 612,50 → líquido 2.550 − 612,50 = 1.937,50
const recibo = (cambios = {}) => ({
  anio: 2026,
  mes: 3,
  encabezado: { empresa: 'Acme SL', convenio: 'Convenio de prueba', grupoCotizacion: 1, contrato: 'indefinido' },
  devengos: {
    salarioBase: 2000,
    complementos: [{ concepto: 'Antigüedad', importe: 100 }],
    pagaExtraProrrateada: 400,
    noSalariales: [{ concepto: 'Transporte', importe: 50 }]
  },
  deducciones: {
    ss: { contingenciasComunes: 117.5, desempleo: 38.75, formacionProfesional: 2.5, mei: 3.75 },
    irpf: { base: 2500, tipo: 12, importe: 300 },
    aportacionPlanEmpleo: 50,
    otras: [{ concepto: 'Anticipo', importe: 100 }]
  },
  bases: { contingenciasComunes: 2500, contingenciasProfesionales: 2500 },
  aportacionEmpresaPlan: 50,
  liquidoDeclarado: 1937.5,
  ...cambios
})

describe('normalizarRecibo', () => {
  test('suma devengos y deducciones y calcula el líquido', () => {
    const r = normalizarRecibo(recibo())
    expect(r.totales).toMatchObject({
      devengosSalariales: 2500,
      devengosNoSalariales: 50,
      bruto: 2550,
      cotizacionesTrabajador: 162.5,
      irpf: 300,
      baseIrpf: 2500,
      aportacionPlan: 50,
      otrasDeducciones: 100,
      deducciones: 612.5,
      liquido: 1937.5,
      baseCotizacion: 2500,
      diferenciaLiquido: 0
    })
    expect(r.avisos).toEqual([])
    expect(r.tipo).toBe('ordinaria')
  })

  test('si no hay base de IRPF escrita, tributan los devengos salariales', () => {
    const r = normalizarRecibo(recibo({ deducciones: { ...recibo().deducciones, irpf: { tipo: 12, importe: 300 } } }))
    expect(r.totales.baseIrpf).toBe(2500)
  })

  test('avisa si el líquido escrito no coincide', () => {
    const r = normalizarRecibo(recibo({ liquidoDeclarado: 1900 }))
    expect(r.avisos.join(' ')).toMatch(/no coincide con el que escribiste/)
    expect(r.totales.diferenciaLiquido).toBe(37.5)
  })

  test('avisa si una cotización no es la oficial de 2026', () => {
    const base = recibo()
    const r = normalizarRecibo(recibo({
      deducciones: { ...base.deducciones, ss: { ...base.deducciones.ss, contingenciasComunes: 100 } },
      liquidoDeclarado: undefined
    }))
    expect(r.avisos.join(' ')).toMatch(/contingencias comunes/)
  })

  test('avisa si la retención no es el porcentaje de la base', () => {
    const base = recibo()
    const r = normalizarRecibo(recibo({
      deducciones: { ...base.deducciones, irpf: { base: 2500, tipo: 12, importe: 250 } },
      liquidoDeclarado: undefined
    }))
    expect(r.avisos.join(' ')).toMatch(/retención de IRPF/)
  })

  test('avisa si la base queda por debajo de la mínima del grupo', () => {
    const r = normalizarRecibo(recibo({ bases: { contingenciasComunes: 1500 }, liquidoDeclarado: undefined }))
    expect(r.avisos.join(' ')).toMatch(/base mínima del grupo 1/)
  })

  test('fuera de 2026 no contrasta las cotizaciones y lo avisa', () => {
    const r = normalizarRecibo(recibo({ anio: 2025 }))
    expect(r.avisos.join(' ')).toMatch(/solo se comprueban con los tipos de 2026/)
  })

  test('acepta una nómina sin cotizaciones ni bases (solo lo que se conoce)', () => {
    const r = normalizarRecibo({ anio: 2026, mes: 1, devengos: { salarioBase: 1500 } })
    expect(r.totales).toMatchObject({ bruto: 1500, liquido: 1500, cotizacionesTrabajador: 0 })
  })

  test.each([
    ['sin devengos', { devengos: {} }],
    ['mes 13', { mes: 13 }],
    ['año no entero', { anio: 2026.5 }],
    ['tipo desconocido', { tipo: 'finiquito' }],
    ['importe negativo', { devengos: { salarioBase: -1 } }],
    ['importe como texto', { devengos: { salarioBase: '2000' } }],
    ['IRPF por encima del 100 %', { deducciones: { irpf: { tipo: 101 } } }],
    ['deducciones mayores que los devengos', { deducciones: { otras: [{ concepto: 'x', importe: 200 }] } }],
    ['concepto sin nombre', { devengos: { salarioBase: 100, complementos: [{ importe: 5 }] } }],
    ['fecha de cobro inventada', { fechaCobro: '2026-02-30' }],
    ['grupo de cotización 12', { encabezado: { grupoCotizacion: 12 } }]
  ])('rechaza: %s', (_nombre, cambios) => {
    expect(() => normalizarRecibo({ anio: 2026, mes: 1, devengos: { salarioBase: 100 }, ...cambios })).toThrow()
  })
})

describe('resumenNominas', () => {
  const guardar = (mes, cambios, tipo = 'ordinaria') => {
    const r = normalizarRecibo(recibo({ mes, tipo, ...cambios }))
    return { anio: r.anio, mes: r.mes, tipo: r.tipo, datos: r.datos, totales: r.totales }
  }

  test('sin nóminas: nada acumulado ni proyectado', () => {
    const r = resumenNominas([], { anio: 2026 })
    expect(r.ultima).toBeNull()
    expect(r.proyeccion).toBeNull()
    expect(r.acumulado.bruto).toBe(0)
    expect(r.avisos[0]).toMatch(/No hay nóminas/)
  })

  test('acumula y proyecta con 12 pagas: cada mes restante repite la última nómina', () => {
    const filas = [guardar(1), guardar(2), guardar(3)]
    const r = resumenNominas(filas, { anio: 2026, pagas: 12 })
    expect(r.acumulado.bruto).toBe(2550 * 3)
    expect(r.acumulado.liquido).toBe(1937.5 * 3)
    expect(r.proyeccion.bruto).toBe(2550 * 12)
    expect(r.proyeccion.irpf).toBe(300 * 12)
    expect(r.proyeccion.baseIrpf).toBe(2500 * 12)
    expect(r.proyeccion.cotizacionesTrabajador).toBe(162.5 * 12)
    expect(r.proyeccion.liquido).toBe(1937.5 * 12)
    expect(r.proyeccion.ingresoMensualMedio).toBe(1937.5)
    expect(r.mesesRegistrados).toEqual([1, 2, 3])
  })

  test('la vigente es la última ordinaria: no cambia hasta que se registra otra', () => {
    const nueva = guardar(4, { liquidoDeclarado: undefined, devengos: { salarioBase: 2300 } })
    const r = resumenNominas([guardar(3), nueva, guardar(2)], { anio: 2026, pagas: 12 })
    expect(r.ultima).toMatchObject({ anio: 2026, mes: 4 })
    expect(r.ultima.bruto).toBe(2300)
  })

  test('con 14 pagas sin prorrata y sin extras registradas, estima dos pagas con el salario base y los complementos', () => {
    const sinProrrata = {
      devengos: { salarioBase: 2000, complementos: [{ concepto: 'Antigüedad', importe: 100 }] },
      liquidoDeclarado: undefined
    }
    const r = resumenNominas([guardar(1, sinProrrata)], { anio: 2026, pagas: 14 })
    // Ordinaria: bruto 2.100, IRPF 300; 12 ordinarias = 25.200. Dos extras de 2.100 con el 12 % (252) → +4.200
    expect(r.proyeccion.bruto).toBe(25200 + 4200)
    expect(r.proyeccion.irpf).toBe(300 * 12 + 252 * 2)
    expect(r.avisos.join(' ')).toMatch(/ninguna paga extra registrada/)
  })

  test('con 16 pagas sin prorrata se estiman cuatro extras', () => {
    const sinProrrata = {
      devengos: { salarioBase: 2000, complementos: [{ concepto: 'Antigüedad', importe: 100 }] },
      liquidoDeclarado: undefined
    }
    const r = resumenNominas([guardar(1, sinProrrata)], { anio: 2026, pagas: 16 })
    expect(r.proyeccion.bruto).toBe(25200 + 4 * 2100)
    expect(r.proyeccion.irpf).toBe(300 * 12 + 252 * 4)
  })

  test('con la paga extra prorrateada no se añaden extras', () => {
    const r = resumenNominas([guardar(1)], { anio: 2026, pagas: 14 })
    expect(r.proyeccion.bruto).toBe(2550 * 12)
  })

  test('devuelve las bases de cotización mes a mes, de más antigua a más reciente', () => {
    const enero = guardar(1, { bases: { contingenciasComunes: 2400 }, liquidoDeclarado: undefined })
    const r = resumenNominas([guardar(3), enero], { anio: 2026, pagas: 12 })
    expect(r.basesCotizacion).toEqual([{ mes: '2026-01', base: 2400 }, { mes: '2026-03', base: 2500 }])
  })

  test('pagas distintas de 12 o 14 son un error', () => {
    expect(() => resumenNominas([], { anio: 2026, pagas: 13 })).toThrow(/pagas/)
  })
})
