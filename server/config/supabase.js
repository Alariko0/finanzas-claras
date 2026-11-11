/**
 * supabase.js - Configuración y clientes de Supabase
 *
 * Las peticiones del usuario usan un cliente con SU JWT (RLS activo).
 * La clave de servicio nunca se usa aquí.
 */

const { createClient } = require('@supabase/supabase-js')

const leerConfig = () => {
  const url = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en el entorno')
  }

  return { url: url.replace(/\/+$/, ''), publishableKey }
}

/**
 * Cliente de Supabase que actúa como el usuario autenticado.
 * Las políticas RLS se evalúan con auth.uid() = id del usuario del token.
 */
const clienteParaUsuario = (token) => {
  const { url, publishableKey } = leerConfig()

  return createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

module.exports = { leerConfig, clienteParaUsuario }
