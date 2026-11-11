/**
 * nominasController.js - Nóminas mensuales guardadas por el usuario
 * Todas las consultas usan el cliente del usuario: RLS garantiza que solo ve lo suyo.
 * Los totales los calcula siempre el servidor (services/nominaMensual.js): nunca se guardan
 * los que mande el cliente.
 */

const { normalizarRecibo, resumenNominas } = require('../services/nominaMensual')
const { copiar } = require('./responderCalculo')

const COLUMNAS = 'id, anio, mes, tipo, fecha_cobro, datos, totales, created_at, updated_at'

// Lista blanca de campos de primer nivel; el detalle lo filtra el servicio al normalizar
const CAMPOS_RECIBO = [
  'anio', 'mes', 'tipo', 'fechaCobro', 'encabezado', 'devengos', 'deducciones', 'bases',
  'aportacionEmpresaPlan', 'liquidoDeclarado'
]

const aApi = (fila) => ({
  id: fila.id,
  anio: fila.anio,
  mes: fila.mes,
  tipo: fila.tipo,
  fechaCobro: fila.fecha_cobro,
  datos: fila.datos,
  totales: fila.totales,
  createdAt: fila.created_at,
  updatedAt: fila.updated_at
})

const noEncontrada = (res) => res.status(404).json({ success: false, message: 'Nómina no encontrada' })

const falloInterno = (res, mensaje, error) => {
  console.error(`${mensaje}:`, error.message)
  res.status(500).json({ success: false, message: mensaje })
}

// Un ErrorEntrada del servicio es un dato incoherente (400); lo demás es un fallo interno
const manejar = (mensaje, accion) => async (req, res) => {
  try {
    await accion(req, res)
  } catch (error) {
    if (error.name === 'ErrorEntrada') return res.status(400).json({ success: false, message: error.message })
    falloInterno(res, mensaje, error)
  }
}

const filaDeRecibo = (cuerpo) => {
  const r = normalizarRecibo(copiar(cuerpo, CAMPOS_RECIBO))
  return {
    avisos: r.avisos,
    fila: { anio: r.anio, mes: r.mes, tipo: r.tipo, fecha_cobro: r.fechaCobro ?? null, datos: r.datos, totales: r.totales }
  }
}

// Ya existe una nómina de ese mes y tipo (restricción unique de la tabla)
const duplicada = (error) => error?.code === '23505'
const respuestaDuplicada = (res) =>
  res.status(409).json({ success: false, message: 'Ya hay una nómina de ese mes. Edítala en lugar de crear otra.' })

/**
 * GET /api/nominas?anio=2026
 */
exports.listar = manejar('Error al obtener las nóminas', async (req, res) => {
  let consulta = req.supabase.from('nominas_mensuales').select(COLUMNAS)
  if (req.query.anio) consulta = consulta.eq('anio', req.query.anio)
  const { data, error } = await consulta
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .order('tipo', { ascending: true })
  if (error) throw error
  res.json({ success: true, data: { nominas: data.map(aApi) } })
})

/**
 * GET /api/nominas/resumen?anio=2026&pagas=14
 * Acumulado del año, proyección hasta diciembre y bases de cotización mes a mes.
 */
exports.resumen = manejar('Error al resumir las nóminas', async (req, res) => {
  const anio = req.query.anio ?? new Date().getFullYear()
  const pagas = req.query.pagas ?? 14
  const { data, error } = await req.supabase.from('nominas_mensuales').select('anio, mes, tipo, datos, totales')
  if (error) throw error
  res.json({ success: true, data: { resumen: resumenNominas(data, { anio, pagas }) } })
})

/**
 * POST /api/nominas
 * user_id lo fija la BD (auth.uid()); el cliente no puede elegirlo.
 */
exports.crear = manejar('Error al guardar la nómina', async (req, res) => {
  const { fila, avisos } = filaDeRecibo(req.body)
  const { data, error } = await req.supabase.from('nominas_mensuales').insert(fila).select(COLUMNAS).single()
  if (duplicada(error)) return respuestaDuplicada(res)
  if (error) throw error
  res.status(201).json({ success: true, data: { nomina: aApi(data), avisos } })
})

/**
 * PUT /api/nominas/:id
 * Sustituye el recibo entero (se vuelve a normalizar y a calcular).
 */
exports.actualizar = manejar('Error al actualizar la nómina', async (req, res) => {
  const { fila, avisos } = filaDeRecibo(req.body)
  const { data, error } = await req.supabase
    .from('nominas_mensuales')
    .update(fila)
    .eq('id', req.params.id)
    .select(COLUMNAS)
    .maybeSingle()
  if (duplicada(error)) return respuestaDuplicada(res)
  if (error) throw error
  if (!data) return noEncontrada(res)
  res.json({ success: true, data: { nomina: aApi(data), avisos } })
})

/**
 * DELETE /api/nominas/:id
 */
exports.eliminar = manejar('Error al eliminar la nómina', async (req, res) => {
  const { data, error } = await req.supabase
    .from('nominas_mensuales')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) return noEncontrada(res)
  res.json({ success: true, message: 'Nómina eliminada correctamente' })
})
