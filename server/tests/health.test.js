const request = require('supertest')
const app = require('../app')

describe('GET /health', () => {
  test('responde ok sin arrancar el servidor', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
