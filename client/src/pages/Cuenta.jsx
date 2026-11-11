/**
 * Cuenta.jsx - Punto de entrada de /account
 * Sin sesión: formulario de registro. Con sesión: panel de cuenta.
 */

import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icono from '../components/Icono'
import Acceso from './Acceso'
import './Cuenta.css'

const ENLACES = [
  { path: '/account/perfil', icon: 'cuenta', titulo: 'Mi perfil', desc: 'Edita tu nombre, contraseña y módulos' },
  { path: '/account/historial', icon: 'historial', titulo: 'Historial de cálculos', desc: 'Tus cálculos guardados' },
  { path: '/account/modulos', icon: 'modulos', titulo: 'Personalizar módulos', desc: 'Activa o desactiva módulos' },
  { path: '/account/notificaciones', icon: 'notificaciones', titulo: 'Notificaciones', desc: 'Alertas fiscales y financieras' }
]

const Cuenta = () => {
  const { user, loading, salir } = useAuth()

  if (loading) {
    return <div className="cuenta-page"><p>Cargando…</p></div>
  }

  if (!user) {
    return <Acceso />
  }

  return (
    <div className="cuenta-page">
      <div className="page-header">
        <h1>Mi cuenta</h1>
        <p className="page-subtitle">{user.nombre} · {user.email}</p>
      </div>

      <div className="cuenta-grid">
        {ENLACES.map((enlace) => (
          <NavLink key={enlace.path} to={enlace.path} className="cuenta-card">
            <span className="cuenta-icon"><Icono nombre={enlace.icon} tamano={24} /></span>
            <span className="cuenta-card-title">{enlace.titulo}</span>
            <span className="cuenta-card-desc">{enlace.desc}</span>
          </NavLink>
        ))}
      </div>

      <button type="button" onClick={salir} className="cuenta-logout">
        Cerrar sesión
      </button>
    </div>
  )
}

export default Cuenta
