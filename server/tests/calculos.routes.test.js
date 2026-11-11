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

const ID = '22222222-2222-4222-8222-222222222222'
const fila = {
  id: ID, tipo: 'irpf', titulo: 'Mi cálculo', datos_entrada: { a: 1 }, resultado: { b: 2 },
  created_at: '2026-11-11T10:00:00Z', updated_at: '2026-11-11T10:00:00Z'
}

const llamada = (nombre) => mockLlamadas.find((l) => l[0] === nombre)

beforeEach(() => {
  mockResultado = { data: null, error: null }
  mockLlamadas = []
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('POST /api/calculos', () => {
  const valido = { tipo: 'irpf', titulo: 'Mi cálculo', datosEntrada: { a: 1 }, resultado: { b: 2 } }

  test('crea con solo los campos permitidos, ignorando user_id, usuario y rol del body', async () => {
    mockResultado = { data: fila, error: null }
    const res = await request(app).post('/api/calculos').send({
      ...valido, user_id: 'otro-usuario', usuario: 'otro-usuario', rol: 'admin'
    })

    expect(res.status).toBe(201)
    expect(res.body.data.calculo).toMatchObject({ id: ID, datosEntrada: { a: 1 } })
    expect(llamada('insert')[1]).toEqual({
      tipo: 'irpf', titulo: 'Mi cálculo', datos_entrada: { a: 1 }, resultado: { b: 2 }
    })
  })

  test.each([
    ['tipo no válido', { ...valido, tipo: 'hackeo' }, 'tipo'],
    ['tipo del modelo antiguo ya no válido', { ...valido, tipo: 'viajes' }, 'tipo'],
    ['título vacío', { ...valido, titulo: '  ' }, 'titulo'],
    ['título no es texto', { ...valido, titulo: { $gt: '' } }, 'titulo'],
    ['datosEntrada es un array', { ...valido, datosEntrada: [1] }, 'datosEntrada'],
    ['resultado ausente', { tipo: 'irpf', titulo: 'x', datosEntrada: {} }, 'resultado']
  ])('400: %s', async (_nombre, body, campo) => {
    const res = await request(app).post('/api/calculos').send(body)
    expect(res.status).toBe(400)
    expect(res.body.errors.map((e) => e.field)).toContain(campo)
    expect(mockLlamadas).toHaveLength(0)
  })

  test('400: datosEntrada demasiado grande', async () => {
    const res = await request(app).post('/api/calculos').send({
      ...valido, datosEntrada: { texto: 'x'.repeat(60 * 1024) }
    })
    expect(res.status).toBe(400)
  })

  test('error de BD → 500 genérico sin detalles internos', async () => {
    mockResultado = { data: null, error: { message: 'relation "calculos" secret detail' } }
    const res = await request(app).post('/api/calculos').send(valido)
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('secret detail')
  })
})

describe('PUT /api/calculos/:id', () => {
  test('actualiza solo la lista blanca; ignora user_id, usuario, tipo y id', async () => {
    mockResultado = { data: fila, error: null }
    const res = await request(app).put(`/api/calculos/${ID}`).send({
      titulo: 'Nuevo', user_id: 'otro', usuario: 'otro', tipo: 'nomina', id: 'x'
    })

    expect(res.status).toBe(200)
    expect(llamada('update')[1]).toEqual({ titulo: 'Nuevo' })
  })

  test('400: sin campos actualizables', async () => {
    const res = await request(app).put(`/api/calculos/${ID}`).send({ user_id: 'otro' })
    expect(res.status).toBe(400)
    expect(mockLlamadas).toHaveLength(0)
  })

  test('400: id que no es UUID', async () => {
    const res = await request(app).put('/api/calculos/123').send({ titulo: 'x' })
    expect(res.status).toBe(400)
  })

  test('404 si RLS oculta la fila (cálculo ajeno)', async () => {
    mockResultado = { data: null, error: null }
    const res = await request(app).put(`/api/calculos/${ID}`).send({ titulo: 'x' })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/calculos', () => {
  test('lista con paginación', async () => {
    mockResultado = { data: [fila], error: null, count: 1 }
    const res = await request(app).get('/api/calculos?page=2&limit=5')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ total: 1, page: 2, limit: 5 })
    expect(llamada('range')).toEqual(['range', 5, 9])
  })

  test('400: limit fuera de rango', async () => {
    const res = await request(app).get('/api/calculos?limit=1000')
    expect(res.status).toBe(400)
  })
})

describe('GET y DELETE /api/calculos/:id', () => {
  test('404 si no existe o no es del usuario', async () => {
    const res = await request(app).get(`/api/calculos/${ID}`)
    expect(res.status).toBe(404)
  })

  test('elimina el propio', async () => {
    mockResultado = { data: { id: ID }, error: null }
    const res = await request(app).delete(`/api/calculos/${ID}`)
    expect(res.status).toBe(200)
  })

  test('DELETE 404 si es ajeno', async () => {
    const res = await request(app).delete(`/api/calculos/${ID}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/auth/profile', () => {
  test('rechaza preferencias desconocidas', async () => {
    const res = await request(app).patch('/api/auth/profile').send({ preferencias: { rol: true } })
    expect(res.status).toBe(400)
  })

  test('rechaza nombre demasiado corto', async () => {
    const res = await request(app).patch('/api/auth/profile').send({ nombre: 'A' })
    expect(res.status).toBe(400)
  })

  test('el rol no es editable: el body con "rol" no cuenta como campo', async () => {
    const res = await request(app).patch('/api/auth/profile').send({ rol: 'admin' })
    expect(res.status).toBe(400)
  })

  test('actualiza el nombre', async () => {
    mockResultado = { data: { id: 'u', nombre: 'Ana Nueva', preferencias: {} }, error: null }
    const res = await request(app).patch('/api/auth/profile').send({ nombre: 'Ana Nueva' })
    expect(res.status).toBe(200)
    expect(llamada('update')[1]).toEqual({ nombre: 'Ana Nueva' })
  })
})
