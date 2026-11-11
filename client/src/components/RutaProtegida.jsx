/**
 * RutaProtegida - Solo deja pasar a usuarios con sesión.
 * Sin sesión redirige al inicio y pide abrir el login.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RutaProtegida = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page-loading">Cargando…</div>
  }

  if (!user) {
    return <Navigate to="/" replace state={{ requiereLogin: true, desde: location.pathname }} />
  }

  return children
}

export default RutaProtegida
