/**
 * AuthContext.jsx - Estado de sesión con Supabase Auth
 * Registro, login, logout y refresco de token los gestiona supabase-js.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext(null)

// Traducción de errores habituales de Supabase Auth
const traducirError = (error) => {
  const mensaje = (error?.message || '').toLowerCase()
  const codigo = error?.code || ''

  if (codigo === 'invalid_credentials' || mensaje.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (codigo === 'email_not_confirmed' || mensaje.includes('email not confirmed')) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.'
  }
  if (codigo === 'user_already_exists' || mensaje.includes('already registered')) {
    return 'Este correo ya está registrado.'
  }
  if (codigo === 'weak_password' || mensaje.includes('password')) {
    return 'La contraseña no cumple los requisitos de seguridad.'
  }
  if (codigo === 'over_request_rate_limit' || codigo === 'over_email_send_rate_limit') {
    return 'Demasiados intentos. Espera unos minutos.'
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo.'
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data }) => {
      if (activo) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
    })

    return () => {
      activo = false
      suscripcion.subscription.unsubscribe()
    }
  }, [])

  const valor = useMemo(() => {
    const user = session?.user ?? null

    return {
      session,
      loading,
      user: user && {
        id: user.id,
        email: user.email,
        nombre: user.user_metadata?.nombre || user.email?.split('@')[0],
        // Solo informativo para la UI: la autorización real la hace el servidor
        esAdmin: user.app_metadata?.rol === 'admin'
      },

      /**
       * Registro. Si el proyecto exige confirmar el correo, no hay sesión inmediata.
       * @returns {Promise<{ok: boolean, requiereConfirmacion?: boolean, mensaje?: string}>}
       */
      registrar: async ({ nombre, email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } }
        })

        if (error) return { ok: false, mensaje: traducirError(error) }
        return { ok: true, requiereConfirmacion: !data.session }
      },

      entrar: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { ok: false, mensaje: traducirError(error) }
        return { ok: true }
      },

      salir: async () => {
        await supabase.auth.signOut()
      },

      cambiarPassword: async (nuevaPassword) => {
        const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
        if (error) return { ok: false, mensaje: traducirError(error) }
        return { ok: true }
      }
    }
  }, [session, loading])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return contexto
}
