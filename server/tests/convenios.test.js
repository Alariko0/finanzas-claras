const { convenio } = require('../services/convenios/hosteleriaMadrid')
const { listar, obtener, sugerirRetribucion } = require('../services/convenios')
const { ErrorEntrada } = require('../services/errores')

const redondear = (n) => Math.round(n * 100) / 100

describe('datos del convenio de hostelería de Madrid', () => {
  // Comprueba la transcripción del PDF: cada año debe salir del anterior con la revisión del art. 5
  const celdas = (anio) => {
    const t = convenio.anios[anio]
    const lista = []
    for (const clase of ['A', 'B', 'C', 'D']) {
      for (const [nivel, valor] of Object.entries(t.salarioBaseMensual[clase])) lista.push([`${clase} ${nivel}`, valor])
    }
    lista.push(['plus convenio', t.plusConvenio], ['manutención', t.manutencionMetalico], ['quebranto de moneda', t.quebrantoMoneda])
    return lista
  }

  test.each([
    [2023, 2024, 1.05],
    [2024, 2025, 1.04]
  ])('las tablas de %i a %i suben un %f', (de, a, factor) => {
    const antes = celdas(de)
    const despues = celdas(a)
    expect(despues.map(([n]) => n)).toEqual(antes.map(([n]) => n))
    antes.forEach(([nombre, valor], i) => {
      expect({ nombre, importe: despues[i][1] }).toEqual({ nombre, importe: redondear(valor * factor) })
    })
  })

  test('la revisión salarial declarada es la que se usa', () => {
    expect(convenio.revisionSalarial).toEqual({ 2023: 6, 2024: 5, 2025: 4 })
  })

  test('los niveles de las tablas coinciden con los de las categorías', () => {
    const nivelesDeCategorias = new Set(convenio.categorias.map((c) => c.nivel))
    const enTablas = new Set([...convenio.niveles.general, ...convenio.niveles.catering])
    for (const nivel of nivelesDeCategorias) {
      const comoEnTabla = nivel === 'III' ? 'III' : nivel
      expect(enTablas.has(comoEnTabla) || (nivel === 'III' && enTablas.has('III-A'))).toBe(true)
    }
  })

  test('las tablas ordenan los niveles de mayor a menor salario en cada clase', () => {
    const t = convenio.anios[2025].salarioBaseMensual
    for (const clase of ['A', 'B', 'C', 'D']) {
      const valores = Object.values(t[clase])
      expect(valores).toEqual([...valores].sort((a, b) => b - a))
    }
  })

  test('cada categoría tiene nombre y nivel', () => {
    expect(convenio.categorias.length).toBeGreaterThan(40)
    for (const c of convenio.categorias) {
      expect(c.nombre.length).toBeGreaterThan(2)
      expect(c.nivel).toBeTruthy()
    }
  })
})

describe('sugerirRetribucion', () => {
  const id = 'hosteleria-madrid'

  test('2025, clase B, nivel III: salario base de la tabla y plus convenio', () => {
    const r = sugerirRetribucion(id, { anio: 2025, clase: 'B', nivel: 'III' })
    expect(r.anioTabla).toBe(2025)
    expect(r.nivel).toBe('III')
    expect(r.lineas[0]).toMatchObject({ tipo: 'salarioBase', importe: 1250.91 })
    expect(r.lineas[1]).toMatchObject({ concepto: 'Plus convenio', importe: 191.22 })
    expect(r.salarioBaseAnual).toBe(17512.74) // 1.250,91 × 14
    expect(r.pagas).toBe(14)
    expect(r.avisos).toEqual([])
  })

  test('con manutención en metálico añade su importe del año', () => {
    const r = sugerirRetribucion(id, { anio: 2024, clase: 'A', nivel: 'I', manutencionEnMetalico: true })
    expect(r.lineas[0].importe).toBe(1361.03)
    expect(r.lineas.find((l) => l.concepto.startsWith('Manutención')).importe).toBe(55.6)
  })

  test('en catering el nivel III de la lista de categorías es el III-A de la tabla', () => {
    const r = sugerirRetribucion(id, { anio: 2025, clase: 'D', nivel: 'III' })
    expect(r.nivel).toBe('III-A')
    expect(r.lineas[0].importe).toBe(1277.36)
  })

  test('el nivel II-C solo existe en catering', () => {
    expect(sugerirRetribucion(id, { anio: 2025, clase: 'D', nivel: 'II-C' }).lineas[0].importe).toBe(1307.48)
    expect(() => sugerirRetribucion(id, { anio: 2025, clase: 'B', nivel: 'II-C' })).toThrow(ErrorEntrada)
  })

  test('2026 no tiene tablas: usa las de 2025 y lo avisa', () => {
    const r = sugerirRetribucion(id, { anio: 2026, clase: 'C', nivel: 'V' })
    expect(r.anioSolicitado).toBe(2026)
    expect(r.anioTabla).toBe(2025)
    expect(r.lineas[0].importe).toBe(1086.31)
    expect(r.avisos.join(' ')).toMatch(/no publica tablas de 2026/)
  })

  test.each([
    ['año anterior a las tablas', { anio: 2022, clase: 'A', nivel: 'I' }],
    ['clase desconocida', { anio: 2025, clase: 'E', nivel: 'I' }],
    ['nivel desconocido', { anio: 2025, clase: 'A', nivel: 'VI' }],
    ['sin datos', {}]
  ])('rechaza: %s', (_n, entrada) => {
    expect(() => sugerirRetribucion(id, entrada)).toThrow(ErrorEntrada)
  })

  test('un convenio que no existe es un error', () => {
    expect(() => obtener('no-existe')).toThrow(/no encontrado/)
  })
})

describe('listar', () => {
  test('resume el convenio sin sus tablas', () => {
    const [c] = listar()
    expect(c).toMatchObject({ id: 'hosteleria-madrid', ultimoAnioConTablas: 2025, pagas: 14 })
    expect(c.vigencia).toEqual({ desde: '2023-01-01', hasta: '2025-12-31', prorrogaAutomatica: true })
    expect(c.anios).toBeUndefined()
  })
})
