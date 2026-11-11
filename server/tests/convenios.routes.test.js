const request = require('supertest')
const app = require('../app')

/* Endpoints públicos de convenios: sin sesión, no hay caso 401 ni recurso ajeno. */

describe('GET /api/convenios', () => {
  test('lista los convenios disponibles', async () => {
    const res = await request(app).get('/api/convenios')
    expect(res.status).toBe(200)
    expect(res.body.data.convenios[0]).toMatchObject({ id: 'hosteleria-madrid', ultimoAnioConTablas: 2025 })
  })
})

describe('GET /api/convenios/:id', () => {
  test('devuelve el convenio con su fuente, categorías y tablas', async () => {
    const res = await request(app).get('/api/convenios/hosteleria-madrid')
    expect(res.status).toBe(200)
    const c = res.body.data.convenio
    expect(c.fuente.url).toMatch(/BOCM-20240406-Conv-hosteleria\.pdf$/)
    expect(c.categorias.length).toBeGreaterThan(40)
    expect(c.anios['2025'].plusConvenio).toBe(191.22)
  })

  test('404 si no existe', async () => {
    expect((await request(app).get('/api/convenios/no-existe')).status).toBe(404)
  })

  test('400 con un identificador raro', async () => {
    expect((await request(app).get('/api/convenios/AB%20CD')).status).toBe(400)
  })
})

describe('POST /api/convenios/:id/retribucion', () => {
  const valido = { anio: 2025, clase: 'B', nivel: 'III' }

  test('caso feliz', async () => {
    const res = await request(app).post('/api/convenios/hosteleria-madrid/retribucion').send(valido)
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.lineas[0].importe).toBe(1250.91)
  })

  test('ignora campos que no están en la lista blanca', async () => {
    const res = await request(app).post('/api/convenios/hosteleria-madrid/retribucion').send({ ...valido, salarioBase: 99999 })
    expect(res.body.data.resultado.lineas[0].importe).toBe(1250.91)
  })

  test.each([
    ['sin año', { clase: 'B', nivel: 'III' }, 'anio'],
    ['clase desconocida', { ...valido, clase: 'Z' }, 'clase'],
    ['nivel vacío', { ...valido, nivel: '' }, 'nivel'],
    ['manutención no booleana', { ...valido, manutencionEnMetalico: 'si' }, 'manutencionEnMetalico']
  ])('400: %s', async (_n, body, campo) => {
    const res = await request(app).post('/api/convenios/hosteleria-madrid/retribucion').send(body)
    expect(res.status).toBe(400)
    expect(res.body.errors.map((e) => e.field)).toContain(campo)
  })

  test('400 con un nivel que no existe en esa clase', async () => {
    const res = await request(app).post('/api/convenios/hosteleria-madrid/retribucion').send({ ...valido, nivel: 'II-C' })
    expect(res.status).toBe(400)
  })

  test('404 si el convenio no existe', async () => {
    expect((await request(app).post('/api/convenios/no-existe/retribucion').send(valido)).status).toBe(404)
  })
})
