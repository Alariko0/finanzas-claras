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

  test('/api/nomina exige sesión', async () => {
    const res = await request(app).post('/api/nomina/calcular').send({ salario: 30000 })
    expect(res.status).toBe(401)
  })
})
