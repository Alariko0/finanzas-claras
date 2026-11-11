/**
 * perfilController.js - Perfil del usuario autenticado
 * El registro y el login los gestiona Supabase Auth desde el cliente.
 */

const aApi = (perfil, user) => ({
  id: perfil.id,
  email: user.email,
  nombre: perfil.nombre,
  preferencias: perfil.preferencias,
  rol: user.rol
})

/**
 * GET /api/auth/profile
 */
exports.obtener = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('profiles')
      .select('id, nombre, preferencias')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' })
    }

    res.json({ success: true, data: { perfil: aApi(data, req.user) } })
  } catch (error) {
    console.error('Error obteniendo perfil:', error.message)
    res.status(500).json({ success: false, message: 'Error al obtener perfil' })
  }
}

/**
 * PATCH /api/auth/profile
 */
exports.actualizar = async (req, res) => {
  try {
    const cambios = {}

    if (req.body.nombre !== undefined) {
      cambios.nombre = req.body.nombre
    }

    if (req.body.preferencias !== undefined) {
      const { data: actual, error: errorLectura } = await req.supabase
        .from('profiles')
        .select('preferencias')
        .eq('id', req.user.id)
        .maybeSingle()

      if (errorLectura) throw errorLectura

      if (!actual) {
        return res.status(404).json({ success: false, message: 'Perfil no encontrado' })
      }

      cambios.preferencias = { ...actual.preferencias, ...req.body.preferencias }
    }

    const { data, error } = await req.supabase
      .from('profiles')
      .update(cambios)
      .eq('id', req.user.id)
      .select('id, nombre, preferencias')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' })
    }

    res.json({ success: true, data: { perfil: aApi(data, req.user) } })
  } catch (error) {
    console.error('Error actualizando perfil:', error.message)
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' })
  }
}
