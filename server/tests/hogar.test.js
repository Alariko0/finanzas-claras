const { repartoGastos } = require('../services/gastosHogar')
const { calcularPresupuesto } = require('../services/presupuesto')
const { repartirCentimos } = require('../services/centimos')
const { ErrorEntrada } = require('../services/errores')

/* Casos calculados a mano. */

describe('repartirCentimos', () => {
  test('suma exactamente el total y el sobrante va al mayor resto', () => {
    // 10001 céntimos en 2:3 → 4000,4 y 6000,6 → el céntimo que sobra es para el segundo
    expect(repartirCentimos(10001, [2, 3])).toEqual([4000, 6001])
  })

  test('a igualdad de resto, el sobrante va al primero', () => {
    expect(repartirCentimos(10000, [1, 1, 1])).toEqual([3334, 3333, 3333])
  })

  test('un peso cero no recibe nada', () => {
    expect(repartirCentimos(999, [0, 1, 2])).toEqual([0, 333, 666])
  })

  test('importes grandes no pierden precisión', () => {
    const partes = repartirCentimos(1_000_000_000_00, [999_999_999, 1])
    expect(partes.reduce((a, b) => a + b, 0)).toBe(1_000_000_000_00)
  })

  test('todos los pesos a cero es un error de entrada', () => {
    expect(() => repartirCentimos(100, [0, 0])).toThrow(ErrorEntrada)
  })
})

describe('repartoGastos', () => {
  const personas = [
    { nombre: 'Ana', ingresoMensual: 2500, gastosIndividuales: [{ importe: 300 }] },
    { nombre: 'Luis', ingresoMensual: 1500, gastosIndividuales: [{ importe: 100 }] }
  ]

  test('proporcional: 1.000 € entre 2.500 y 1.500 de ingresos → 625 € y 375 €', () => {
    const r = repartoGastos({ personas, gastosCompartidos: [{ importe: 700 }, { importe: 300 }] })
    expect(r.metodo).toBe('proporcional')
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([625, 375])
    expect(r.personas[0].porcentajeDelReparto).toBe(62.5)
    expect(r.personas[0].porcentajeSobreIngresos).toBe(25)
    expect(r.personas[1].porcentajeSobreIngresos).toBe(25)
    expect(r.personas.map((p) => p.saldo)).toEqual([1575, 1025])
    expect(r.totalCompartido).toBe(1000)
    expect(r.totalIngresos).toBe(4000)
    expect(r.saldo).toBe(2600)
    expect(r.porcentajeLibre).toBe(65)
  })

  test('desglose por categoría: cuotas, individuales y real de cada persona y del hogar', () => {
    const r = repartoGastos({
      personas: [
        { nombre: 'Ana', ingresoMensual: 2500, gastosIndividuales: [{ importe: 300, categoria: 'deseos' }, { importe: 200, categoria: 'ahorro' }] },
        { nombre: 'Luis', ingresoMensual: 1500, gastosIndividuales: [{ importe: 100 }] }
      ],
      gastosCompartidos: [
        { concepto: 'Alquiler', importe: 700 },
        { concepto: 'Cine', importe: 200, categoria: 'deseos' },
        { concepto: 'Fondo común', importe: 100, categoria: 'ahorro' }
      ]
    })
    const [ana, luis] = r.personas
    expect(ana.cuotaPorCategoria).toEqual({ necesidades: 437.5, deseos: 125, ahorro: 62.5 })
    expect(ana.cuotaCompartida).toBe(625)
    expect(ana.individualesPorCategoria).toEqual({ necesidades: 0, deseos: 300, ahorro: 200 })
    expect(ana.realPorCategoria).toEqual({ necesidades: 437.5, deseos: 425, ahorro: 262.5 })
    expect(ana.saldo).toBe(1375)
    expect(luis.cuotaPorCategoria).toEqual({ necesidades: 262.5, deseos: 75, ahorro: 37.5 })
    expect(luis.realPorCategoria).toEqual({ necesidades: 262.5, deseos: 175, ahorro: 37.5 })
    expect(luis.saldo).toBe(1025)
    expect(r.realPorCategoria).toEqual({ necesidades: 700, deseos: 600, ahorro: 300 })
    expect(r.totalIndividuales).toBe(600)
    expect(r.saldo).toBe(2400)
    expect(r.porcentajeLibre).toBe(60)
  })

  test('las cuotas por categoría suman exactamente cada categoría, con céntimos', () => {
    const r = repartoGastos({
      personas: [{ ingresoMensual: 1000 }, { ingresoMensual: 1000 }, { ingresoMensual: 1000 }],
      gastosCompartidos: [{ importe: 100.01 }, { importe: 50.02, categoria: 'deseos' }],
      metodo: 'igual'
    })
    const suma = (cat) => Math.round(r.personas.reduce((s, p) => s + p.cuotaPorCategoria[cat] * 100, 0))
    expect(suma('necesidades')).toBe(10001)
    expect(suma('deseos')).toBe(5002)
    expect(r.personas.reduce((s, p) => s + Math.round(p.cuotaCompartida * 100), 0)).toBe(15003)
  })

  test('igual: 1.000 € entre 2 → 500 € cada uno', () => {
    const r = repartoGastos({ personas, gastosCompartidos: [{ importe: 1000 }], metodo: 'igual' })
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([500, 500])
    expect(r.personas.map((p) => p.saldo)).toEqual([1700, 900])
  })

  test('las cuotas suman exactamente el total, también con céntimos', () => {
    const r = repartoGastos({
      personas: [{ ingresoMensual: 2000 }, { ingresoMensual: 3000 }],
      gastosCompartidos: [{ importe: 100.01 }]
    })
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([40, 60.01])
    expect(r.personas[0].nombre).toBe('Persona 1')
  })

  test('tres personas y 100 € a partes iguales: 33,34 + 33,33 + 33,33', () => {
    const r = repartoGastos({
      personas: [{ ingresoMensual: 1000 }, { ingresoMensual: 1000 }, { ingresoMensual: 1000 }],
      gastosCompartidos: [{ importe: 100 }],
      metodo: 'igual'
    })
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([33.34, 33.33, 33.33])
  })

  test('sin gastos compartidos las cuotas son cero', () => {
    const r = repartoGastos({ personas })
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([0, 0])
    expect(r.personas[0].porcentajeDelReparto).toBeNull()
  })

  test('una persona sin ingresos no paga nada en proporcional', () => {
    const r = repartoGastos({
      personas: [{ ingresoMensual: 2000 }, { ingresoMensual: 0 }],
      gastosCompartidos: [{ importe: 400 }]
    })
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([400, 0])
    expect(r.personas[1].porcentajeSobreIngresos).toBeNull()
  })

  test('avisa si alguien gasta más de lo que ingresa', () => {
    const r = repartoGastos({
      personas: [{ nombre: 'Ana', ingresoMensual: 500, gastosIndividuales: [{ importe: 600 }] }],
      gastosCompartidos: [{ importe: 100 }]
    })
    expect(r.personas[0].saldo).toBe(-200)
    expect(r.avisos.some((a) => a.includes('Ana'))).toBe(true)
  })

  test('errores de entrada', () => {
    expect(() => repartoGastos({})).toThrow(ErrorEntrada)
    expect(() => repartoGastos({ personas: [] })).toThrow(ErrorEntrada)
    expect(() => repartoGastos({ personas, metodo: 'otro' })).toThrow(ErrorEntrada)
    expect(() => repartoGastos({ personas: [{ ingresoMensual: -1 }] })).toThrow(ErrorEntrada)
    expect(() => repartoGastos({ personas, gastosCompartidos: [{ importe: 'cien' }] })).toThrow(ErrorEntrada)
    expect(() => repartoGastos({ personas, gastosCompartidos: [{ importe: 10, categoria: 'lujo' }] })).toThrow(/categoria/)
    expect(() => repartoGastos({ personas: [{ ingresoMensual: 100, gastosIndividuales: 50 }] })).toThrow(ErrorEntrada)
    expect(() => repartoGastos({
      personas: [{ ingresoMensual: 100, gastosIndividuales: [{ importe: 5, categoria: 'otra' }] }]
    })).toThrow(/categoria/)
    expect(() => repartoGastos({
      personas: [{ ingresoMensual: 0 }],
      gastosCompartidos: [{ importe: 10 }]
    })).toThrow(/ingresos/)
  })
})

describe('calcularPresupuesto', () => {
  test('50/30/20 por defecto sobre 3.000 € → 1.500, 900 y 600', () => {
    const r = calcularPresupuesto({ ingresoMensual: 3000 })
    expect(r.modo).toBe('50-30-20')
    expect(r.partidas.map((p) => [p.clave, p.importe])).toEqual([
      ['necesidades', 1500], ['deseos', 900], ['ahorro', 600]
    ])
    expect(r.sinAsignar).toBe(0)
    expect(r.ahorroMensual).toBe(600)
    expect(r.ahorroAnual).toBe(7200)
    expect(r.tasaAhorro).toBe(20)
    expect(r.meta).toBeNull()
  })

  test('porcentajes editables con decimales: 33,33 / 33,33 / 33,34 sobre 1.000 €', () => {
    const r = calcularPresupuesto({
      ingresoMensual: 1000,
      porcentajes: { necesidades: 33.33, deseos: 33.33, ahorro: 33.34 }
    })
    expect(r.partidas.map((p) => p.importe)).toEqual([333.3, 333.3, 333.4])
  })

  test('50/30/20 con porcentajes que no suman 100 es un error', () => {
    expect(() => calcularPresupuesto({ ingresoMensual: 1000, porcentajes: { necesidades: 60 } })).toThrow(/sumar 100/)
  })

  test('más de dos decimales en un porcentaje es un error', () => {
    expect(() => calcularPresupuesto({
      ingresoMensual: 1000, porcentajes: { necesidades: 50.005, deseos: 29.995, ahorro: 20 }
    })).toThrow(ErrorEntrada)
  })

  test('modo libre: 40 + 25 + 10 % sobre 3.000 € deja 750 € sin asignar', () => {
    const r = calcularPresupuesto({
      modo: 'libre',
      ingresoMensual: 3000,
      partidas: [
        { nombre: 'Vivienda', porcentaje: 40 },
        { nombre: 'Comida', porcentaje: 25 },
        { nombre: 'Ahorro', porcentaje: 10, ahorro: true }
      ]
    })
    expect(r.partidas.map((p) => p.importe)).toEqual([1200, 750, 300])
    expect(r.totalAsignado).toBe(2250)
    expect(r.sinAsignar).toBe(750)
    expect(r.porcentajeSinAsignar).toBe(25)
    expect(r.ahorroMensual).toBe(300)
  })

  test('modo libre: la suma no puede pasar de 100 y hay que dar partidas', () => {
    expect(() => calcularPresupuesto({
      modo: 'libre', ingresoMensual: 1000, partidas: [{ porcentaje: 70 }, { porcentaje: 40 }]
    })).toThrow(/superar 100/)
    expect(() => calcularPresupuesto({ modo: 'libre', ingresoMensual: 1000 })).toThrow(ErrorEntrada)
    expect(() => calcularPresupuesto({ modo: 'libre', ingresoMensual: 1000, partidas: [] })).toThrow(ErrorEntrada)
  })

  test('modo libre sin partida de ahorro avisa', () => {
    const r = calcularPresupuesto({ modo: 'libre', ingresoMensual: 1000, partidas: [{ porcentaje: 100 }] })
    expect(r.ahorroMensual).toBe(0)
    expect(r.tasaAhorro).toBe(0)
    expect(r.avisos.some((a) => a.includes('marcada como ahorro'))).toBe(true)
  })

  test('desviación respecto a lo gastado', () => {
    const r = calcularPresupuesto({
      ingresoMensual: 3000,
      gastado: { necesidades: 1600, deseos: 800, ahorro: 500 }
    })
    const [nec, des, aho] = r.partidas
    expect([nec.gastado, nec.diferencia, nec.estado]).toEqual([1600, -100, 'excedido'])
    expect([des.gastado, des.diferencia, des.estado]).toEqual([800, 100, 'dentro'])
    expect([aho.gastado, aho.diferencia, aho.estado]).toEqual([500, 100, 'pordebajo'])
  })

  test('meta de ahorro: 10.000 € con 600 €/mes y 0 ahorrado → 17 meses', () => {
    const r = calcularPresupuesto({ ingresoMensual: 3000, objetivoAhorro: 10000 })
    expect(r.meta).toEqual({
      objetivo: 10000, ahorroActual: 0, restante: 10000, progreso: 0, mesesParaObjetivo: 17
    })
  })

  test('meta de ahorro: 10.000 € con 300 €/mes y 1.000 ahorrados → 30 meses y 10 %', () => {
    const r = calcularPresupuesto({
      modo: 'libre',
      ingresoMensual: 3000,
      partidas: [{ nombre: 'Ahorro', porcentaje: 10, ahorro: true }],
      objetivoAhorro: 10000,
      ahorroActual: 1000
    })
    expect(r.meta.restante).toBe(9000)
    expect(r.meta.progreso).toBe(10)
    expect(r.meta.mesesParaObjetivo).toBe(30)
  })

  test('meta ya cumplida: 0 meses y progreso máximo 100 %', () => {
    const r = calcularPresupuesto({ ingresoMensual: 3000, objetivoAhorro: 1000, ahorroActual: 5000 })
    expect(r.meta.mesesParaObjetivo).toBe(0)
    expect(r.meta.progreso).toBe(100)
  })

  test('meta sin ahorro mensual: meses nulos y aviso, nunca Infinity', () => {
    const r = calcularPresupuesto({
      ingresoMensual: 3000,
      porcentajes: { necesidades: 60, deseos: 40, ahorro: 0 },
      objetivoAhorro: 5000
    })
    expect(r.meta.mesesParaObjetivo).toBeNull()
    expect(r.avisos.some((a) => a.includes('no ahorras nada'))).toBe(true)
  })

  test('errores de entrada', () => {
    expect(() => calcularPresupuesto({})).toThrow(ErrorEntrada)
    expect(() => calcularPresupuesto({ ingresoMensual: 0 })).toThrow(ErrorEntrada)
    expect(() => calcularPresupuesto({ ingresoMensual: 1000, modo: 'otro' })).toThrow(ErrorEntrada)
    expect(() => calcularPresupuesto({ ingresoMensual: 1000, objetivoAhorro: 0 })).toThrow(ErrorEntrada)
  })
})
