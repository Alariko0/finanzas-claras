// Fake de Supabase: registra las llamadas y devuelve un resultado configurable
let mockResultado = { data: null, error: null }
let mockLlamadas = []

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: '11111111-1111-4111-8111-111111111111', email: 'ana@test.local', rol: 'usuario' }
    req.token = 'token-falso'
    next()
  },
  conSupabaseUsuario: (req, res, next) => {
    const builder = {}
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'range']) {
      builder[m] = (...args) => { mockLlamadas.push([m, ...args]); return builder }
    }
    builder.maybeSingle = () => Promise.resolve(mockResultado)
    builder.single = () => Promise.resolve(mockResultado)
    builder.then = (ok, ko) => Promise.resolve(mockResultado).then(ok, ko)
    req.supabase = { from: (t) => { mockLlamadas.push(['from', t]); return builder } }
    next()
  },
  requireAdmin: (req, res, next) => next()
}))

const request = require('supertest')
const app = require('../app')
const { normalizarRecibo } = require('../services/nominaMensual')

const ID = '22222222-2222-4222-8222-222222222222'

// Misma nómina calculada a mano que en nominaMensual.test.js: bruto 1.500, SS 0, líquido 1.500
const recibo = { anio: 2026, mes: 3, devengos: { salarioBase: 1500 } }

const filaGuardada = () => {
  const r = normalizarRecibo(recibo)
  return {
    id: ID, anio: r.anio, mes: r.mes, tipo: r.tipo, fecha_cobro: null, datos: r.datos, totales: r.totales,
    created_at: '2026-11-11T10:00:00Z', updated_at: '2026-11-11T10:00:00Z'
  }
}

const llamada = (nombre) => mockLlamadas.find((l) => l[0] === nombre)

beforeEach(() => {
  mockResultado = { data: null, error: null }
  mockLlamadas = []
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('POST /api/nominas', () => {
  test('guarda los totales que calcula el servidor e ignora user_id, totales y líquido del body', async () => {
    mockResultado = { data: filaGuardada(), error: null }
    const res = await request(app).post('/api/nominas').send({
      ...recibo, user_id: 'otro-usuario', totales: { liquido: 999999 }, liquido: 999999
    })

    expect(res.status).toBe(201)
    expect(res.body.data.nomina).toMatchObject({ id: ID, anio: 2026, mes: 3, tipo: 'ordinaria' })
    const fila = llamada('insert')[1]
    expect(Object.keys(fila).sort()).toEqual(['anio', 'datos', 'fecha_cobro', 'mes', 'tipo', 'totales'])
    expect(fila.totales.liquido).toBe(1500)
  })

  test.each([
    ['sin mes', { anio: 2026, devengos: { salarioBase: 1 } }, 'mes'],
    ['mes 13', { ...recibo, mes: 13 }, 'mes'],
    ['año como texto', { ...recibo, anio: '2026' }, 'anio'],
    ['tipo desconocido', { ...recibo, tipo: 'finiquito' }, 'tipo'],
    ['devengos no es un objeto', { ...recibo, devengos: [1] }, 'devengos']
  ])('400: %s', async (_nombre, body, campo) => {
    const res = await request(app).post('/api/nominas').send(body)
    expect(res.status).toBe(400)
    expect(res.body.errors.map((e) => e.field)).toContain(campo)
  })

  test('400 con un dato incoherente que solo detecta el servicio (importe negativo)', async () => {
    const res = await request(app).post('/api/nominas').send({ ...recibo, devengos: { salarioBase: -5 } })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/salarioBase/)
  })

  test('409 si ya hay una nómina de ese mes', async () => {
    mockResultado = { data: null, error: { code: '23505', message: 'duplicate key' } }
    const res = await request(app).post('/api/nominas').send(recibo)
    expect(res.status).toBe(409)
  })

  test('500 genérico si falla la base de datos, sin filtrar el mensaje', async () => {
    mockResultado = { data: null, error: { code: 'XX000', message: 'detalle interno secreto' } }
    const res = await request(app).post('/api/nominas').send(recibo)
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toMatch(/secreto/)
  })
})

describe('GET /api/nominas', () => {
  test('lista las nóminas, filtrando por año', async () => {
    mockResultado = { data: [filaGuardada()], error: null }
    const res = await request(app).get('/api/nominas?anio=2026')
    expect(res.status).toBe(200)
    expect(res.body.data.nominas).toHaveLength(1)
    expect(llamada('eq')).toEqual(['eq', 'anio', 2026])
  })

  test('400 con un año no válido', async () => {
    expect((await request(app).get('/api/nominas?anio=1800')).status).toBe(400)
  })
})

describe('GET /api/nominas/resumen', () => {
  test('acumula y proyecta con las nóminas del usuario', async () => {
    const f = filaGuardada()
    mockResultado = { data: [{ anio: f.anio, mes: f.mes, tipo: f.tipo, datos: f.datos, totales: f.totales }], error: null }
    const res = await request(app).get('/api/nominas/resumen?anio=2026&pagas=12')
    expect(res.status).toBe(200)
    expect(res.body.data.resumen.acumulado.bruto).toBe(1500)
    expect(res.body.data.resumen.proyeccion.bruto).toBe(18000)
    expect(res.body.data.resumen.ultima).toMatchObject({ mes: 3, liquido: 1500 })
  })

  test('400 con pagas distintas de 12 o 14', async () => {
    expect((await request(app).get('/api/nominas/resumen?pagas=13')).status).toBe(400)
  })
})

describe('PUT /api/nominas/:id', () => {
  test('actualiza el recibo entero y recalcula', async () => {
    mockResultado = { data: filaGuardada(), error: null }
    const res = await request(app).put(`/api/nominas/${ID}`).send({ ...recibo, devengos: { salarioBase: 1500 } })
    expect(res.status).toBe(200)
    expect(llamada('update')[1].totales.bruto).toBe(1500)
    expect(llamada('eq')).toEqual(['eq', 'id', ID])
  })

  test('404 si RLS oculta la fila (nómina ajena)', async () => {
    mockResultado = { data: null, error: null }
    expect((await request(app).put(`/api/nominas/${ID}`).send(recibo)).status).toBe(404)
  })

  test('400 con un id que no es UUID', async () => {
    expect((await request(app).put('/api/nominas/abc').send(recibo)).status).toBe(400)
  })
})

describe('DELETE /api/nominas/:id', () => {
  test('elimina la propia', async () => {
    mockResultado = { data: { id: ID }, error: null }
    expect((await request(app).delete(`/api/nominas/${ID}`)).status).toBe(200)
  })

  test('404 si es ajena', async () => {
    expect((await request(app).delete(`/api/nominas/${ID}`)).status).toBe(404)
  })
})

describe('POST /api/fiscal/recibo (pública)', () => {
  test('calcula totales y avisos sin guardar nada', async () => {
    const res = await request(app).post('/api/fiscal/recibo').send({ ...recibo, liquidoDeclarado: 1400 })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.totales.liquido).toBe(1500)
    expect(res.body.data.resultado.avisos.join(' ')).toMatch(/no coincide/)
    expect(mockLlamadas).toEqual([])
  })

  test('400 con datos inválidos', async () => {
    expect((await request(app).post('/api/fiscal/recibo').send({ anio: 2026 })).status).toBe(400)
  })
})
