const express = require('express')
const request = require('supertest')
const { crearLimitador } = require('../middleware/rateLimit')

describe('rate limiting', () => {
  test('el cuarto intento dentro de la ventana → 429 con el formato de la API', async () => {
    const app = express()
    app.use(crearLimitador({ windowMs: 60_000, max: 3, mensaje: 'Demasiadas solicitudes.' }))
    app.get('/x', (req, res) => res.json({ ok: true }))

    for (let i = 0; i < 3; i++) {
      expect((await request(app).get('/x')).status).toBe(200)
    }
    const res = await request(app).get('/x')
    expect(res.status).toBe(429)
    expect(res.body).toEqual({ success: false, message: 'Demasiadas solicitudes.' })
    expect(res.headers['ratelimit']).toBeDefined()
  })

  test('el límite de escritura no cuenta las lecturas', async () => {
    jest.resetModules()
    const { limitadorEscritura } = require('../middleware/rateLimit')
    const app = express()
    app.use(limitadorEscritura)
    app.get('/x', (req, res) => res.json({ ok: true }))

    for (let i = 0; i < 100; i++) {
      const res = await request(app).get('/x')
      expect(res.status).toBe(200)
    }
  })

  test('las escrituras sí se limitan (61.ª → 429)', async () => {
    jest.resetModules()
    const { limitadorEscritura } = require('../middleware/rateLimit')
    const app = express()
    app.use(limitadorEscritura)
    app.post('/x', (req, res) => res.json({ ok: true }))

    let ultimo
    for (let i = 0; i < 61; i++) {
      ultimo = await request(app).post('/x')
    }
    expect(ultimo.status).toBe(429)
  })
})

describe('health', () => {
  let app

  beforeEach(() => {
    jest.resetModules()
    app = require('../app')
  })

  afterEach(() => jest.restoreAllMocks())

  test('GET /health responde ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  test('GET /health/ready → 200 si Supabase responde', async () => {
    const espia = jest.spyOn(global, 'fetch').mockResolvedValue({ status: 200 })
    const res = await request(app).get('/health/ready')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', supabase: 'ok' })
    expect(espia.mock.calls[0][0]).toBe('https://proyecto-de-prueba.supabase.co/auth/v1/health')
  })

  test('GET /health/ready → 503 si Supabase falla, sin filtrar detalles', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED 10.0.0.5:5432'))
    const res = await request(app).get('/health/ready')

    expect(res.status).toBe(503)
    expect(res.body.status).toBe('degraded')
    expect(JSON.stringify(res.body)).not.toContain('10.0.0.5')
  })

  test('GET /health/ready → 503 si Supabase responde 5xx', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(global, 'fetch').mockResolvedValue({ status: 503 })
    const res = await request(app).get('/health/ready')
    expect(res.status).toBe(503)
  })
})

describe('ruta inexistente', () => {
  test('GET /api/no-existe → 404 con el formato de la API', async () => {
    const app = require('../app')
    const res = await request(app).get('/api/no-existe')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ success: false, message: 'Ruta no encontrada' })
  })
})
