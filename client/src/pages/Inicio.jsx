/**
 * Inicio.jsx - Dashboard principal de FinanzasClaras
 * Hero con tagline y grid de módulos disponibles
 *
 * @see design-system.md - Design tokens
 * @see ../utils/api.js - API con autenticación
 */
'use client'

import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icono from '../components/Icono'
import './Inicio.css'

/**
 * Inicio - Dashboard principal de FinanzasClaras
 * Hero con tagline y grid de módulos disponibles
 * Conectado con API backend para autenticación
 */

const Inicio = () => {
  const { user, salir } = useAuth()

  const modules = [
    {
      name: 'IRPF',
      path: '/irpf',
      icon: 'fiscal',
      desc: 'Cálculo de impuestos por tramos',
      status: 'available'
    },
    {
      name: 'Nómina',
      path: '/nomina',
      icon: 'nomina',
      desc: 'Desglose salarial y deducciones',
      status: 'available'
    },
    {
      name: 'Gastos',
      path: '/gastos',
      icon: 'gastos',
      desc: 'Gastos compartidos y presupuestos',
      status: 'available'
    },
    {
      name: 'Hipotecas',
      path: '/hipotecas',
      icon: 'hipotecas',
      desc: 'Simulador de hipotecas',
      status: 'available'
    },
    {
      name: 'Inversión',
      path: '/inversion',
      icon: 'inversion',
      desc: 'Gestión de cartera de inversión',
      status: 'available'
    },
    {
      name: 'Jubilación',
      path: '/jubilacion',
      icon: 'jubilacion',
      desc: 'Planificación de jubilación',
      status: 'available'
    },
    {
      name: 'Viajes',
      path: '/viajes',
      icon: 'viajes',
      desc: 'Presupuestos de viajes en grupo',
      status: 'available'
    },
    {
      name: 'Cuenta',
      path: '/account',
      icon: 'cuenta',
      desc: 'Gestión de perfil y configuraciones',
      status: 'available'
    }
  ]

  const quickAccess = [
    { name: 'IRPF', path: '/irpf', icon: 'fiscal' },
    { name: 'Nómina', path: '/nomina', icon: 'nomina' },
    { name: 'Hipotecas', path: '/hipotecas', icon: 'hipotecas' }
  ]

  return (
    <div className="inicio-page">
      <section className="hero">
        <div className="hero-content">
          {user ? (
            <>
              <h1 className="hero-title">Bienvenido/a de nuevo {user.nombre}!</h1>
              <p className="hero-subtitle">
                Calculadoras fiscales, financieras y de planificación personal
              </p>
              <p className="user-status">{user.esAdmin ? 'Modo administrador activo' : 'Versión estándar'}</p>
              <button type="button" onClick={salir} className="logout-button">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <h1 className="hero-title">Finanzas para personas reales en España</h1>
              <p className="hero-subtitle">
                Calculadoras fiscales, financieras y de planificación personal
              </p>
              <NavLink to="/account" className="login-button">
                Inicia sesión o regístrate
              </NavLink>
            </>
          )}
        </div>
      </section>

      <section className="modules-section">
        <h2>Módulos Disponibles</h2>
        <div className="modules-grid">
          {modules.map((mod) => (
            <NavLink
              key={mod.path}
              to={mod.path}
              className={({ isActive }) =>
                isActive ? 'module-card active' : 'module-card'
              }
            >
              <span className="module-icon"><Icono nombre={mod.icon} tamano={26} /></span>
              <h3 className="module-name">{mod.name}</h3>
              <p className="module-description">{mod.desc}</p>
              <span className={`module-status-badge ${mod.status}`}>
                {mod.status === 'available' ? 'Disponible' : 'Próximamente'}
              </span>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="quick-access">
        <h2 className="quick-access-title">¿Qué puedo calcular hoy?</h2>
        <div className="quick-access-grid">
          {quickAccess.map((q) => (
            <NavLink
              key={q.path}
              to={q.path}
              className={({ isActive }) =>
                isActive ? 'quick-card' : 'quick-card'
              }
            >
              <span className="quick-card-icon"><Icono nombre={q.icon} tamano={24} /></span>
              <span className="quick-card-title">{q.name}</span>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Inicio
