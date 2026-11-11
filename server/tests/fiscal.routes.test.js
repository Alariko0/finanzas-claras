const request = require('supertest')
const app = require('../app')

/*
 * Endpoints públicos de cálculo fiscal. Sin sesión: no hay caso 401 ni recurso ajeno.
 * Los importes esperados son los de los tests de servicio (calculados a mano).
 */

describe('POST /api/fiscal/nomina', () => {
  const valido = { brutoAnual: 30000, pagas: 12, contribuyente: { edad: 35 } }

  test('caso feliz sin sesión', async () => {
    const res = await request(app).post('/api/fiscal/nomina').send(valido)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const r = res.body.data.resultado
    expect(r.netoAnual).toBe(23124)
    expect(r.irpf.tipo).toBe(16.42)
    expect(r.fechaDatos).toBeDefined()
  })

  test('400 con campos inválidos', async () => {
    const res = await request(app).post('/api/fiscal/nomina').send({ brutoAnual: -5, pagas: 13, grupoCotizacion: 20 })
    expect(res.status).toBe(400)
    const campos = res.body.errors.map((e) => e.field)
    expect(campos).toEqual(expect.arrayContaining(['brutoAnual', 'pagas', 'grupoCotizacion']))
  })

  test('400 si falta el bruto o es texto', async () => {
    expect((await request(app).post('/api/fiscal/nomina').send({})).status).toBe(400)
    expect((await request(app).post('/api/fiscal/nomina').send({ brutoAnual: '30000' })).status).toBe(400)
  })

  test('400 con hijos mal formados', async () => {
    const res = await request(app).post('/api/fiscal/nomina').send({ ...valido, descendientes: [{ edad: 'x' }] })
    expect(res.status).toBe(400)
  })

  test('400 con error de negocio del servicio (situación 1 sin hijos)', async () => {
    const res = await request(app).post('/api/fiscal/nomina').send({ ...valido, situacionFamiliar: 1 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/descendiente/)
  })

  test('ignora campos que no están en la lista blanca', async () => {
    const res = await request(app).post('/api/fiscal/nomina').send({ ...valido, __proto__: { x: 1 }, user_id: 'otro' })
    expect(res.status).toBe(200)
  })

  test('hijos con discapacidad "ninguna" se aceptan', async () => {
    const res = await request(app).post('/api/fiscal/nomina').send({
      ...valido, descendientes: [{ edad: 5, discapacidad: 'ninguna' }]
    })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/fiscal/irpf', () => {
  test('caso feliz', async () => {
    const res = await request(app).post('/api/fiscal/irpf').send({
      comunidad: 'aragon', rendimientoIntegro: 30000, cotizacionesSS: 1950, contribuyente: { edad: 40 }
    })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.soportado).toBe(true)
    expect(res.body.data.resultado.cuotaIntegra).toBeGreaterThan(0)
  })

  test('régimen foral: 200 con aviso y sin importe', async () => {
    const res = await request(app).post('/api/fiscal/irpf').send({ comunidad: 'navarra', rendimientoIntegro: 30000 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.soportado).toBe(false)
    expect(res.body.data.resultado.cuotaIntegra).toBeUndefined()
  })

  test('400 sin comunidad y con comunidad desconocida', async () => {
    expect((await request(app).post('/api/fiscal/irpf').send({ rendimientoIntegro: 1000 })).status).toBe(400)
    const res = await request(app).post('/api/fiscal/irpf').send({ comunidad: 'xx', rendimientoIntegro: 1000 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/comunidad/)
  })

  test('400 si las cotizaciones superan el rendimiento', async () => {
    const res = await request(app).post('/api/fiscal/irpf').send({
      comunidad: 'aragon', rendimientoIntegro: 1000, cotizacionesSS: 2000
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/fiscal/ahorro', () => {
  test('caso feliz', async () => {
    const res = await request(app).post('/api/fiscal/ahorro').send({
      comunidad: 'aragon', baseLiquidableAhorro: 10000, baseLiquidableGeneral: 30000, contribuyente: { edad: 40 }
    })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.cuotaIntegra).toBe(1980)
  })

  test('400 con base negativa o ausente', async () => {
    expect((await request(app).post('/api/fiscal/ahorro').send({ comunidad: 'aragon', baseLiquidableAhorro: -1 })).status).toBe(400)
    expect((await request(app).post('/api/fiscal/ahorro').send({ comunidad: 'aragon' })).status).toBe(400)
  })
})

test('JSON mal formado → 400', async () => {
  const res = await request(app).post('/api/fiscal/nomina').set('Content-Type', 'application/json').send('{"a":')
  expect(res.status).toBe(400)
})
