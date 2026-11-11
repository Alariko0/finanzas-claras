const request = require('supertest')
const app = require('../app')

/*
 * Endpoints públicos de préstamos e hipotecas. Sin sesión: no hay caso 401 ni recurso ajeno.
 * Importes esperados: tablas financieras conocidas (ver prestamos.test.js).
 */

describe('POST /api/prestamos/cuadro', () => {
  const valido = { capital: 100000, tin: 5, meses: 240, fechaInicio: '2026-01-15' }

  test('caso feliz sin sesión', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send(valido)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.cuota).toBe(659.96)
    expect(r.filas).toHaveLength(240)
    expect(r.filas[0].fecha).toBe('2026-02-15')
    expect(r.tae).toBeGreaterThan(5)
  })

  test('hipoteca de ejemplo: 200.000 € al 3,5 % a 300 meses = 1.001,25 €', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send({ capital: 200000, tin: 3.5, meses: 300 })
    expect(res.body.data.resultado.cuota).toBe(1001.25)
  })

  test('400 con campos inválidos', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send({ capital: -5, tin: 80, meses: 1000, fechaInicio: 'ayer' })
    expect(res.status).toBe(400)
    const campos = res.body.errors.map((e) => e.field)
    expect(campos).toEqual(expect.arrayContaining(['capital', 'tin', 'meses', 'fechaInicio']))
  })

  test('400 si falta algo o llega como texto', async () => {
    expect((await request(app).post('/api/prestamos/cuadro').send({})).status).toBe(400)
    expect((await request(app).post('/api/prestamos/cuadro').send({ ...valido, capital: '100000' })).status).toBe(400)
    expect((await request(app).post('/api/prestamos/cuadro').send({ ...valido, meses: '240' })).status).toBe(400)
  })

  test('400 con una fecha que no existe (error de negocio del servicio)', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send({ ...valido, fechaInicio: '2026-02-30' })
    expect(res.status).toBe(400)
  })

  test('ignora campos fuera de la lista blanca', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send({ ...valido, user_id: 'otro', filas: [] })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.filas).toHaveLength(240)
  })
})

describe('POST /api/prestamos/amortizacion', () => {
  const valido = { capital: 100000, tin: 5, meses: 240, mesAmortizacion: 24, importe: 20000, modo: 'reducirPlazo' }

  test('caso feliz', async () => {
    const res = await request(app).post('/api/prestamos/amortizacion').send(valido)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.mesesAhorrados).toBeGreaterThan(0)
    expect(r.ahorroIntereses).toBeGreaterThan(0)
    expect(r.cuotaNueva).toBe(r.cuotaActual)
  })

  test('400 con modo, mes o importe inválidos', async () => {
    const res = await request(app).post('/api/prestamos/amortizacion').send({
      ...valido, modo: 'x', mesAmortizacion: -1, importe: 0
    })
    expect(res.status).toBe(400)
    const campos = res.body.errors.map((e) => e.field)
    expect(campos).toEqual(expect.arrayContaining(['modo', 'mesAmortizacion', 'importe']))
  })

  test('400 si el mes de amortización no cabe en el plazo (error de negocio)', async () => {
    const res = await request(app).post('/api/prestamos/amortizacion').send({ ...valido, meses: 12, mesAmortizacion: 12 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/mesAmortizacion/)
  })
})

describe('tipos de interés y sistemas por la API', () => {
  const variable = { capital: 100000, meses: 240, tipoInteres: 'variable', diferencial: 1, euribor: 3 }

  test('hipoteca variable: devuelve revisiones y escenarios', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send(variable)
    expect(res.status).toBe(200)
    const r = res.body.data.resultado
    expect(r.tipoInteres).toBe('variable')
    expect(r.revisiones.length).toBeGreaterThan(1)
    expect(r.escenarios).toHaveLength(3)
  })

  test('hipoteca mixta con Euríbor futuro y escenarios a medida', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send({
      capital: 100000, meses: 240, tipoInteres: 'mixto', tin: 2, mesesFijos: 60, diferencial: 1, euribor: 3,
      euriborFuturo: [{ mes: 61, valor: 4 }], escenariosEuribor: [1]
    })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.filas[60].tin).toBe(5)
    expect(res.body.data.resultado.escenarios).toHaveLength(1)
  })

  test('sistema alemán y americano', async () => {
    const aleman = await request(app).post('/api/prestamos/cuadro').send({ capital: 12000, tin: 12, meses: 12, sistema: 'aleman' })
    expect(aleman.body.data.resultado.totalIntereses).toBe(780)
    const americano = await request(app).post('/api/prestamos/cuadro').send({ capital: 12000, tin: 12, meses: 12, sistema: 'americano' })
    expect(americano.body.data.resultado.totalIntereses).toBe(1440)
  })

  test('400 con valores inválidos de los campos nuevos', async () => {
    const res = await request(app).post('/api/prestamos/cuadro').send({
      ...variable, sistema: 'x', tipoInteres: 'raro', euribor: 99, periodoRevision: 0,
      euriborFuturo: [{ mes: 0, valor: 1 }], escenariosEuribor: [50]
    })
    expect(res.status).toBe(400)
    const campos = res.body.errors.map((e) => e.field)
    expect(campos).toEqual(expect.arrayContaining(['sistema', 'tipoInteres', 'euribor', 'periodoRevision', 'euriborFuturo', 'escenariosEuribor']))
  })

  test('400 de negocio: variable sin Euríbor y fijo sin TIN', async () => {
    const a = await request(app).post('/api/prestamos/cuadro').send({ capital: 1000, meses: 12, tipoInteres: 'variable', diferencial: 1 })
    expect(a.status).toBe(400)
    expect(a.body.message).toMatch(/euribor/)
    const b = await request(app).post('/api/prestamos/cuadro').send({ capital: 1000, meses: 12 })
    expect(b.status).toBe(400)
    expect(b.body.message).toMatch(/tin/)
  })

  test('amortización anticipada en variable: incluye el tope legal de comisión', async () => {
    const res = await request(app).post('/api/prestamos/amortizacion').send({
      ...variable, mesAmortizacion: 24, importe: 10000, comisionPct: 0.5
    })
    expect(res.status).toBe(200)
    expect(res.body.data.resultado.comisionMaximaLegalPct).toBe(0.25)
    expect(res.body.data.resultado.avisos.join(' ')).toMatch(/máximo legal/)
  })
})
