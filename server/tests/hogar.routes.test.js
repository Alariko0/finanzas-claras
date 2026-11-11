const request = require('supertest')
const app = require('../app')

/* Endpoints públicos del hogar. Sin sesión: no hay caso 401 ni recurso ajeno. */

describe('POST /api/hogar/reparto', () => {
  const valido = {
    personas: [
      { nombre: 'Ana', ingresoMensual: 2500, gastosIndividuales: [{ concepto: 'Gimnasio', importe: 300, categoria: 'deseos' }] },
      { nombre: 'Luis', ingresoMensual: 1500 }
    ],
    gastosCompartidos: [{ concepto: 'Alquiler', importe: 1000, categoria: 'necesidades' }]
  }

  test('caso feliz sin sesión', async () => {
    const res = await request(app).post('/api/hogar/reparto').send(valido)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.personas.map((p) => p.cuotaCompartida)).toEqual([625, 375])
    expect(r.saldo).toBe(2700)
    expect(r.realPorCategoria).toEqual({ necesidades: 1000, deseos: 300, ahorro: 0 })
  })

  test('400 con categoría de gasto inexistente o gastos individuales como número', async () => {
    const a = await request(app).post('/api/hogar/reparto')
      .send({ ...valido, gastosCompartidos: [{ importe: 10, categoria: 'lujo' }] })
    expect(a.status).toBe(400)
    const b = await request(app).post('/api/hogar/reparto')
      .send({ personas: [{ ingresoMensual: 1000, gastosIndividuales: 300 }] })
    expect(b.status).toBe(400)
  })

  test('método igual', async () => {
    const res = await request(app).post('/api/hogar/reparto').send({ ...valido, metodo: 'igual' })
    expect(res.body.data.resultado.personas.map((p) => p.cuotaCompartida)).toEqual([500, 500])
  })

  test('400 con campos inválidos', async () => {
    const res = await request(app).post('/api/hogar/reparto').send({
      metodo: 'mitad',
      personas: [{ ingresoMensual: -5 }],
      gastosCompartidos: [{ importe: 'mucho' }]
    })
    expect(res.status).toBe(400)
    const campos = res.body.errors.map((e) => e.field)
    expect(campos).toEqual(expect.arrayContaining(['metodo', 'personas', 'gastosCompartidos']))
  })

  test('400 si faltan las personas o los importes llegan como texto', async () => {
    expect((await request(app).post('/api/hogar/reparto').send({})).status).toBe(400)
    const res = await request(app).post('/api/hogar/reparto')
      .send({ personas: [{ ingresoMensual: '2500' }] })
    expect(res.status).toBe(400)
  })

  test('400 de negocio: repartir en proporción sin ingresos', async () => {
    const res = await request(app).post('/api/hogar/reparto').send({
      personas: [{ ingresoMensual: 0 }],
      gastosCompartidos: [{ importe: 50 }]
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/ingresos/)
  })

  test('ignora campos fuera de la lista blanca', async () => {
    const res = await request(app).post('/api/hogar/reparto').send({ ...valido, user_id: 'otro', totalCompartido: 1 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.totalCompartido).toBe(1000)
  })
})

describe('POST /api/hogar/presupuesto', () => {
  test('50/30/20 por defecto', async () => {
    const res = await request(app).post('/api/hogar/presupuesto').send({ ingresoMensual: 3000 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.partidas.map((p) => p.importe)).toEqual([1500, 900, 600])
  })

  test('modo libre con meta de ahorro', async () => {
    const res = await request(app).post('/api/hogar/presupuesto').send({
      modo: 'libre',
      ingresoMensual: 3000,
      partidas: [{ nombre: 'Casa', porcentaje: 50 }, { nombre: 'Ahorro', porcentaje: 10, ahorro: true }],
      objetivoAhorro: 3000
    })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.meta.mesesParaObjetivo).toBe(10)
  })

  test('400 con campos inválidos', async () => {
    const res = await request(app).post('/api/hogar/presupuesto').send({
      modo: 'raro', ingresoMensual: -1, porcentajes: { otros: 5 }, partidas: [{ porcentaje: 500 }]
    })
    expect(res.status).toBe(400)
    const campos = res.body.errors.map((e) => e.field)
    expect(campos).toEqual(expect.arrayContaining(['modo', 'ingresoMensual', 'porcentajes', 'partidas']))
  })

  test('400 si falta el ingreso o llega como texto', async () => {
    expect((await request(app).post('/api/hogar/presupuesto').send({})).status).toBe(400)
    expect((await request(app).post('/api/hogar/presupuesto').send({ ingresoMensual: '3000' })).status).toBe(400)
  })

  test('400 de negocio: porcentajes que no suman 100', async () => {
    const res = await request(app).post('/api/hogar/presupuesto')
      .send({ ingresoMensual: 3000, porcentajes: { necesidades: 70 } })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/sumar 100/)
  })

  test('ignora campos fuera de la lista blanca', async () => {
    const res = await request(app).post('/api/hogar/presupuesto').send({ ingresoMensual: 3000, user_id: 'otro', ahorroAnual: 1 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.ahorroAnual).toBe(7200)
  })
})
