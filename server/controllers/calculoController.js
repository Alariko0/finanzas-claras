/**
 * calculoController.js - Cálculos guardados por el usuario
 * Todas las consultas usan el cliente del usuario: RLS garantiza que solo ve lo suyo.
 */

const COLUMNAS = 'id, tipo, titulo, datos_entrada, resultado, created_at, updated_at'

const aApi = (fila) => ({
  id: fila.id,
  tipo: fila.tipo,
  titulo: fila.titulo,
  datosEntrada: fila.datos_entrada,
  resultado: fila.resultado,
  createdAt: fila.created_at,
  updatedAt: fila.updated_at
})

const noEncontrado = (res) =>
  res.status(404).json({ success: false, message: 'Cálculo no encontrado' })

const falloInterno = (res, mensaje, error) => {
  console.error(`${mensaje}:`, error.message)
  res.status(500).json({ success: false, message: mensaje })
}

/**
 * GET /api/calculos?page=1&limit=20
 */
exports.listar = async (req, res) => {
  try {
    const page = req.query.page || 1
    const limit = req.query.limit || 20
    const desde = (page - 1) * limit

    const { data, error, count } = await req.supabase
      .from('calculos')
      .select(COLUMNAS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(desde, desde + limit - 1)

    if (error) throw error

    res.json({
      success: true,
      data: { calculos: data.map(aApi), total: count, page, limit }
    })
  } catch (error) {
    falloInterno(res, 'Error al obtener cálculos', error)
  }
}

/**
 * GET /api/calculos/:id
 */
exports.obtener = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('calculos')
      .select(COLUMNAS)
      .eq('id', req.params.id)
      .maybeSingle()

    if (error) throw error
    if (!data) return noEncontrado(res)

    res.json({ success: true, data: { calculo: aApi(data) } })
  } catch (error) {
    falloInterno(res, 'Error al obtener cálculo', error)
  }
}

/**
 * POST /api/calculos
 * user_id lo fija la BD (auth.uid()); el cliente no puede elegirlo.
 */
exports.crear = async (req, res) => {
  try {
    const { tipo, titulo, datosEntrada, resultado } = req.body

    const { data, error } = await req.supabase
      .from('calculos')
      .insert({ tipo, titulo, datos_entrada: datosEntrada, resultado })
      .select(COLUMNAS)
      .single()

    if (error) throw error

    res.status(201).json({ success: true, data: { calculo: aApi(data) } })
  } catch (error) {
    falloInterno(res, 'Error al crear cálculo', error)
  }
}

/**
 * PUT /api/calculos/:id
 * Lista blanca: solo titulo, datosEntrada y resultado.
 */
exports.actualizar = async (req, res) => {
  try {
    const cambios = {}
    if (req.body.titulo !== undefined) cambios.titulo = req.body.titulo
    if (req.body.datosEntrada !== undefined) cambios.datos_entrada = req.body.datosEntrada
    if (req.body.resultado !== undefined) cambios.resultado = req.body.resultado

    const { data, error } = await req.supabase
      .from('calculos')
      .update(cambios)
      .eq('id', req.params.id)
      .select(COLUMNAS)
      .maybeSingle()

    if (error) throw error
    if (!data) return noEncontrado(res)

    res.json({ success: true, data: { calculo: aApi(data) } })
  } catch (error) {
    falloInterno(res, 'Error al actualizar cálculo', error)
  }
}

/**
 * DELETE /api/calculos/:id
 */
exports.eliminar = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('calculos')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return noEncontrado(res)

    res.json({ success: true, message: 'Cálculo eliminado correctamente' })
  } catch (error) {
    falloInterno(res, 'Error al eliminar cálculo', error)
  }
}
