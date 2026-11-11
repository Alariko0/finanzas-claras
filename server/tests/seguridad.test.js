const request = require('supertest')
const app = require('../app')

describe('superficie de autenticación (sin mocks)', () => {
  test.each([
    ['get', '/api/calculos'],
    ['post', '/api/calculos'],
    ['get', '/api/auth/profile'],
    ['patch', '/api/auth/profile']
  ])('%s %s sin token → 401', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta).send({})
    expect(res.status).toBe(401)
  })

  test('un token inválido → 401', async () => {
    const res = await request(app).get('/api/calculos').set('Authorization', 'Bearer abc.def.ghi')
    expect(res.status).toBe(401)
  })

  test.each([
    ['/api/auth/register'],
    ['/api/auth/login'],
    ['/api/auth/clean-calculations']
  ])('%s ya no existe (auth la gestiona Supabase; sin borrado global)', async (ruta) => {
    const res = await request(app).post(ruta).send({ rol: 'admin' })
    // 401 (el router exige sesión antes de resolver) o 404: nunca un éxito
    expect([401, 404]).toContain(res.status)
  })

  test.each([
    ['/api/nomina/calcular'],
    ['/api/hipotecas/calcular'],
    ['/api/gastos/calcular-compartidos'],
    ['/api/irpf/configuracion/madrid']
  ])('%s (rutas temporales antiguas) ya no existe → 404', async (ruta) => {
    const res = await request(app).post(ruta).send({})
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  test('JSON mal formado → 400 (no 500)', async () => {
    const res = await request(app)
      .post('/api/calculos')
      .set('Content-Type', 'application/json')
      .send('{"tipo": ')
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('JSON no válido')
  })

  test('cuerpo mayor de 100 kb → 413', async () => {
    const res = await request(app)
      .post('/api/calculos')
      .send({ datosEntrada: { texto: 'x'.repeat(150 * 1024) } })
    expect(res.status).toBe(413)
  })

  test('no se anuncia la tecnología (x-powered-by)', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  test('origen CORS no permitido no recibe cabeceras de acceso', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://sitio-malicioso.example')
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  test('origen permitido sí', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:3000')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
  })
})
