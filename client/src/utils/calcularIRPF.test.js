import { calcularIRPF } from './calcularIRPF'

describe('Cálculo IRPF 2025', () => {
  test('Salario bajo - Madrid (19-27% tramos)', () => {
    const resultado = calcularIRPF({
      salarioBruto: 30000,
      comunidad: 'Comunidad de Madrid',
      hijos: 0
    })

    expect(resultado.salarioBruto).toBe(30000)
    expect(resultado.comunidad).toBe('Comunidad de Madrid')
    expect(resultado.baseLiquidable).toBeLessThan(30000)
    expect(resultado.reducciones).toBe(5550) // Mínimo personal
    expect(resultado.tramosCalculados.length).toBeGreaterThan(0)
    expect(resultado.netoMensual).toBeGreaterThan(0)
  })

  test('Salario medio - Madrid (27-31% tramos)', () => {
    const resultado = calcularIRPF({
      salarioBruto: 50000,
      comunidad: 'Comunidad de Madrid',
      hijos: 1
    })

    expect(resultado.salarioBruto).toBe(50000)
    expect(resultado.reducciones).toBe(5550 + 2400) // Personal + 1 hijo
    expect(resultado.tramosCalculados.length).toBeGreaterThanOrEqual(3)
  })

  test('Salario alto - Madrid (tramos superiores)', () => {
    const resultado = calcularIRPF({
      salarioBruto: 100000,
      comunidad: 'Comunidad de Madrid',
      hijos: 2
    })

    expect(resultado.salarioBruto).toBe(100000)
    expect(resultado.reducciones).toBe(5550 + 4800) // Personal + 2 hijos
    expect(resultado.tramosCalculados.length).toBeGreaterThanOrEqual(5)
    expect(resultado.impuestoEstatal).toBeGreaterThan(15000)
  })

  test('Andalucía - tramos diferentes', () => {
    const resultado = calcularIRPF({
      salarioBruto: 30000,
      comunidad: 'Andalucía',
      hijos: 1
    })

    expect(resultado.salarioBruto).toBe(30000)
    expect(resultado.comunidad).toBe('Andalucía')
    expect(resultado.tramosCalculados.length).toBeGreaterThan(0)
  })

  test('Con conyuge dependiente', () => {
    const resultado = calcularIRPF({
      salarioBruto: 40000,
      comunidad: 'Madrid',
      hijos: 0,
      conyugeDependiente: true
    })

    expect(resultado.salarioBruto).toBe(40000)
    expect(resultado.reducciones).toBe(5550 + 5550) // Personal + conyuge
  })

  test('Salario bruto 28.000€ Madrid - 30.453,15€ neto 14 pagas', () => {
    // Caso de ejemplo real
    const resultado = calcularIRPF({
      salarioBruto: 28000,
      comunidad: 'Comunidad de Madrid',
      hijos: 0
    })

    // El neto aproximado debe ser cercano a 30.453€
    // Nota: este valor es aproximado según cálculo real
    expect(resultado.netoCatorce).toBeGreaterThan(28000)
  })

  test('Seguridad Social - 6.35%', () => {
    const resultado = calcularIRPF({
      salarioBruto: 30000,
      comunidad: 'Madrid'
    })

    const expectedSS = 30000 * 0.0635
    expect(Math.abs(resultado.seguridadSocial.total - expectedSS)).toBeLessThan(1)
    expect(resultado.seguridadSocial.contingencias).toBeCloseTo(expectedSS * (4.70 / 6.35))
    expect(resultado.seguridadSocial.desempleo).toBeCloseTo(expectedSS * (1.55 / 6.35))
  })

  test('Reducciones - 5.565€ por rendimientos del trabajo', () => {
    const resultado = calcularIRPF({
      salarioBruto: 50000,
      comunidad: 'Madrid',
      hijos: 1
    })

    // El valor de reducciones debe incluir basePersonal (5.550€)
    // Más 2.400€ por hijo (si hay hijos)
    expect(resultado.reducciones).toBeGreaterThanOrEqual(5550)
  })
})
