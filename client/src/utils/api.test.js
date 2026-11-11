import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'token-de-prueba' } } })),
      signOut: vi.fn(async () => {})
    }
  }
}))

const { fiscal, calculos, ApiError } = await import('./api')

const responder = (status, cuerpo) =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => cuerpo }))

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('fiscal (calculadoras públicas)', () => {
  test('POST a /api/fiscal/nomina con el cuerpo en JSON, sin enviar el token', async () => {
    const fetchSimulado = responder(200, { success: true, data: { resultado: { netoAnual: 23124 } } })
    vi.stubGlobal('fetch', fetchSimulado)

    const r = await fiscal.nomina({ brutoAnual: 30000 })

    expect(r).toEqual({ netoAnual: 23124 })
    const [url, opciones] = fetchSimulado.mock.calls[0]
    expect(url).toBe('/api/fiscal/nomina')
    expect(opciones.method).toBe('POST')
    expect(JSON.parse(opciones.body)).toEqual({ brutoAnual: 30000 })
    expect(opciones.headers.Authorization).toBeUndefined()
  })

  test('irpf y ahorro usan su ruta', async () => {
    const fetchSimulado = responder(200, { success: true, data: { resultado: {} } })
    vi.stubGlobal('fetch', fetchSimulado)
    await fiscal.irpf({})
    await fiscal.ahorro({})
    expect(fetchSimulado.mock.calls.map((c) => c[0])).toEqual(['/api/fiscal/irpf', '/api/fiscal/ahorro'])
  })

  test('un 400 de validación lanza ApiError con el detalle de los campos', async () => {
    vi.stubGlobal('fetch', responder(400, {
      success: false,
      message: 'Errores de validación',
      errors: [{ field: 'brutoAnual', message: 'brutoAnual es obligatorio' }]
    }))
    const error = await fiscal.nomina({}).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.errores[0].field).toBe('brutoAnual')
  })

  test('un 429 usa el mensaje del servidor', async () => {
    vi.stubGlobal('fetch', responder(429, { success: false, message: 'Demasiados cálculos seguidos.' }))
    await expect(fiscal.nomina({})).rejects.toThrow('Demasiados cálculos seguidos.')
  })

  test('sin conexión: ApiError con status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    const error = await fiscal.nomina({}).catch((e) => e)
    expect(error.status).toBe(0)
  })
})

describe('calculos (con sesión)', () => {
  test('envía el token como Bearer', async () => {
    const fetchSimulado = responder(200, { success: true, data: { calculos: [], total: 0, page: 1, limit: 20 } })
    vi.stubGlobal('fetch', fetchSimulado)
    await calculos.listar()
    expect(fetchSimulado.mock.calls[0][1].headers.Authorization).toBe('Bearer token-de-prueba')
  })
})
