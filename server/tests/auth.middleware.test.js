const express = require('express')
const request = require('supertest')
const { SignJWT, generateKeyPair } = require('jose')
const { crearAutenticador, requireAdmin } = require('../middleware/auth')

const ISSUER = 'https://proyecto-de-prueba.supabase.co/auth/v1'

let claves
let otrasClaves

const firmar = (opciones = {}, clavePrivada, alg = 'ES256') => {
  const {
    sub = 'usuario-1',
    iss = ISSUER,
    aud = 'authenticated',
    exp = '1h',
    claims = {}
  } = opciones

  return new SignJWT({ email: 'ana@test.local', ...claims })
    .setProtectedHeader({ alg })
    .setSubject(sub)
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(clavePrivada || claves.privateKey)
}

const crearApp = () => {
  const app = express()
  const authenticate = crearAutenticador({ getKey: claves.publicKey, issuer: ISSUER })
  app.get('/privado', authenticate, (req, res) => res.json({ user: req.user }))
  app.get('/admin', authenticate, requireAdmin, (req, res) => res.json({ ok: true }))
  return app
}

beforeAll(async () => {
  claves = await generateKeyPair('ES256')
  otrasClaves = await generateKeyPair('ES256')
})

describe('middleware authenticate (JWT de Supabase)', () => {
  test('sin cabecera Authorization → 401', async () => {
    const res = await request(crearApp()).get('/privado')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  test('token válido → 200 con usuario', async () => {
    const token = await firmar()
    const res = await request(crearApp()).get('/privado').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user).toEqual({ id: 'usuario-1', email: 'ana@test.local', rol: 'usuario' })
  })

  test('token expirado → 401', async () => {
    const token = await firmar({ exp: Math.floor(Date.now() / 1000) - 60 })
    const res = await request(crearApp()).get('/privado').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  test('emisor distinto → 401', async () => {
    const token = await firmar({ iss: 'https://otro.supabase.co/auth/v1' })
    const res = await request(crearApp()).get('/privado').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  test('audiencia distinta → 401', async () => {
    const token = await firmar({ aud: 'anon' })
    const res = await request(crearApp()).get('/privado').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  test('firmado con otra clave → 401', async () => {
    const token = await firmar({}, otrasClaves.privateKey)
    const res = await request(crearApp()).get('/privado').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  test('token sin firma (alg none) → 401', async () => {
    const cabecera = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const cuerpo = Buffer.from(JSON.stringify({
      sub: 'usuario-1', iss: ISSUER, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url')
    const res = await request(crearApp()).get('/privado').set('Authorization', `Bearer ${cabecera}.${cuerpo}.`)
    expect(res.status).toBe(401)
  })

  test('token basura → 401', async () => {
    const res = await request(crearApp()).get('/privado').set('Authorization', 'Bearer no-es-un-jwt')
    expect(res.status).toBe(401)
  })

  test('el rol "admin" en user_metadata NO da permisos de admin', async () => {
    const token = await firmar({ claims: { user_metadata: { rol: 'admin' }, rol: 'admin' } })
    const res = await request(crearApp()).get('/admin').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  test('el rol "admin" en app_metadata sí da permisos de admin', async () => {
    const token = await firmar({ claims: { app_metadata: { rol: 'admin' } } })
    const res = await request(crearApp()).get('/admin').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })
})
