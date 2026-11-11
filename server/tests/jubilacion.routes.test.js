const request = require('supertest')
const app = require('../app')

/* Endpoint público de jubilación. Sin sesión: no hay caso 401 ni recurso ajeno. */

describe('POST /api/jubilacion/proyeccion', () => {
  const valido = { edadActual: 35, edadJubilacion: 45, rentabilidad: 0, ahorroActual: 10000, aportacionMensual: 500 }

  test('caso feliz sin sesión', async () => {
    const res = await request(app).post('/api/jubilacion/proyeccion').send(valido)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.capital).toBe(70000)
    expect(r.serie).toHaveLength(11)
    expect(r.avisos.length).toBeGreaterThan(0)
  })

  test('renta deseada y pensión pública devuelven el objetivo', async () => {
    const res = await request(app).post('/api/jubilacion/proyeccion')
      .send({ ...valido, rentaDeseadaMensual: 2000, pensionPublicaMensual: 1000 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.objetivo.rentaACubrirConAhorro).toBe(1000)
  })

  test('400 con datos inválidos', async () => {
    for (const mal of [
      { ...valido, edadJubilacion: 30 },
      { ...valido, edadActual: 35.5 },
      { ...valido, rentabilidad: 99 },
      { ...valido, ahorroActual: '10000' },
      { ...valido, tasaRetiro: 0 },
      { edadActual: 35, edadJubilacion: 65 }
    ]) {
      const res = await request(app).post('/api/jubilacion/proyeccion').send(mal)
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    }
  })

  test('ignora campos que no están en la lista blanca', async () => {
    const res = await request(app).post('/api/jubilacion/proyeccion').send({ ...valido, intruso: { a: 1 } })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.intruso).toBeUndefined()
  })
})

describe('POST /api/jubilacion/plan-privado', () => {
  const valido = {
    brutoAnual: 50000, comunidad: 'madrid', edadActual: 35, edadJubilacion: 67, rentabilidad: 5,
    inflacion: 2, aportacionAnual: 1500, pensionPublicaMensual: 1500
  }

  test('caso feliz sin sesión', async () => {
    const res = await request(app).post('/api/jubilacion/plan-privado').send(valido)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.soportado).toBe(true)
    expect(r.fiscal.reduccionAplicada).toBe(1500)
    expect(r.fiscal.ahorroFiscal).toBeCloseTo(538.5, 1)
    expect(r.proyeccion.capital).toBeGreaterThan(0)
    expect(r.rescate.impuestoAnual).toBeGreaterThan(0)
  })

  test('acepta contribuyente y descendientes como en la nómina', async () => {
    const res = await request(app).post('/api/jubilacion/plan-privado')
      .send({ ...valido, contribuyente: { edad: 35 }, descendientes: [{ edad: 2 }] })
    expect(res.status).toBe(200)
  })

  test('régimen foral: 200 con soportado false', async () => {
    const res = await request(app).post('/api/jubilacion/plan-privado').send({ ...valido, comunidad: 'navarra' })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.soportado).toBe(false)
  })

  test('400 con datos inválidos', async () => {
    for (const mal of [
      { ...valido, comunidad: undefined },
      { ...valido, brutoAnual: 0 },
      { ...valido, aportacionAnual: -5 },
      { ...valido, contribucionEmpresaAnual: '100' },
      { ...valido, edadJubilacion: 20 },
      { ...valido, comunidad: 'atlantida' }
    ]) {
      const res = await request(app).post('/api/jubilacion/plan-privado').send(mal)
      expect(res.status).toBe(400)
    }
  })
})
