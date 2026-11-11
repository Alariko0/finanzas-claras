const request = require('supertest')
const app = require('../app')

/* Endpoint público de la pensión de jubilación. Sin sesión: no hay caso 401 ni recurso ajeno. */

describe('POST /api/pension/jubilacion', () => {
  const valido = { fechaActual: '2026-11', edadActual: 37, edadJubilacion: 67, baseMensualActual: 3000 }

  test('caso feliz sin sesión', async () => {
    const res = await request(app).post('/api/pension/jubilacion').send(valido)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.cumpleRequisitos).toBe(true)
    expect(r.porcentaje.total).toBe(84.2)
    expect(r.pension.mensual).toBeCloseTo(2165.14, 2)
  })

  test('con historial por tramos y comunidad devuelve el IRPF', async () => {
    const res = await request(app).post('/api/pension/jubilacion').send({
      ...valido,
      comunidad: 'madrid',
      tramos: [{ desde: '2010-01', hasta: '2026-10', baseMensual: 2500 }]
    })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.irpf.soportado).toBe(true)
    expect(res.body.data.resultado.mesesCotizados).toBeGreaterThan(360)
  })

  test('no cumple requisitos: 200 con motivos', async () => {
    const res = await request(app).post('/api/pension/jubilacion').send({ ...valido, edadActual: 57 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.cumpleRequisitos).toBe(false)
    expect(res.body.data.resultado.motivos.length).toBeGreaterThan(0)
  })

  test('400 con datos inválidos', async () => {
    for (const mal of [
      { ...valido, edadJubilacion: 30 },
      { ...valido, edadActual: 37.5 },
      { ...valido, fechaActual: '11/2026' },
      { ...valido, baseMensualActual: '3000' },
      { ...valido, tramos: [{ desde: '2020-13', hasta: '2021-01', baseMensual: 1000 }] },
      { ...valido, tramos: [{ desde: '2020-01', hasta: '2026-11', baseMensual: 1000 }] }, // acaba en el mes actual
      { ...valido, situacionMinimo: 'viudo' },
      { ...valido, tramos: 'todo' }
    ]) {
      const res = await request(app).post('/api/pension/jubilacion').send(mal)
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    }
  })

  test('ignora campos que no están en la lista blanca', async () => {
    const res = await request(app).post('/api/pension/jubilacion').send({ ...valido, intruso: 1, tramos: [{ desde: '2010-01', hasta: '2010-12', baseMensual: 1000, extra: 'x' }] })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.intruso).toBeUndefined()
  })
})
