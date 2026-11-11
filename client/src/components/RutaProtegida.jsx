/**
 * RutaProtegida - Solo deja pasar a usuarios con sesión.
 * Sin sesión redirige a /account (login) y recuerda a dónde quería ir.
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
    return <Navigate to="/account" replace state={{ desde: location.pathname }} />
  }

  return children
}

export default RutaProtegida
