import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icono from './Icono'
import './Navbar.css'

/**
 * Navbar - Barra lateral de navegación
 * Diseño basado en: Esmeralda Clarity (from Stitch)
 * Cada sección despliega sus subapartados cuando está activa.
 * El orden es por prioridad: fiscal y jubilación primero; hipotecas e inversión después;
 * viajes, asistente, cuenta e inicio al final. `nivel: true` abre un grupo nuevo.
 */

const Navbar = () => {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const navItems = [
    { label: 'IRPF', path: '/irpf', icon: 'fiscal' },
    { label: 'Nómina', path: '/nomina', icon: 'nomina' },
    {
      label: 'Gastos',
      path: '/gastos',
      icon: 'gastos',
      hijos: [
        { label: 'Gastos familiares', path: '/gastos' },
        { label: 'Presupuestos y ahorro', path: '/gastos/presupuestos' },
      ],
    },
    {
      label: 'Jubilación',
      path: '/jubilacion',
      icon: 'jubilacion',
      hijos: [
        { label: 'Plan de jubilación', path: '/jubilacion' },
        { label: 'Plan de pensiones', path: '/jubilacion/pensiones' },
        { label: 'Dashboard de patrimonio', path: '/jubilacion/dashboard' },
      ],
    },
    {
      label: 'Hipotecas',
      nivel: true,
      path: '/hipotecas',
      icon: 'hipotecas',
      hijos: [
        { label: 'Simulador de hipotecas', path: '/hipotecas' },
        { label: 'Préstamos personales', path: '/hipotecas/prestamos' },
        { label: 'Amortización anticipada', path: '/hipotecas/amortizacion' },
      ],
    },
    {
      label: 'Inversión',
      path: '/inversion',
      icon: 'inversion',
      hijos: [
        { label: 'Gestión de inversiones', path: '/inversion' },
        { label: 'Inversión inmobiliaria', path: '/inversion/inmobiliaria' },
        { label: 'Inversión mobiliaria', path: '/inversion/mobiliaria' },
      ],
    },
    { label: 'Viajes', path: '/viajes', icon: 'viajes', nivel: true },
    { label: 'Asistente fiscal', path: '/ia', icon: 'asistente' },
    {
      label: user ? 'Mi cuenta' : 'Entrar',
      path: '/account',
      icon: 'cuenta',
      hijos: user
        ? [
            { label: 'Resumen', path: '/account' },
            { label: 'Perfil y seguridad', path: '/account/perfil' },
            { label: 'Historial de cálculos', path: '/account/historial' },
            { label: 'Personalizar módulos', path: '/account/modulos' },
            { label: 'Notificaciones', path: '/account/notificaciones' },
          ]
        : undefined,
    },
    { label: 'Fuentes', path: '/fuentes', icon: 'fuentes' },
    { label: 'Inicio', path: '/', icon: 'inicio' },
  ]

  const seccionActiva = (item) =>
    item.path === '/'
      ? pathname === '/'
      : pathname === item.path || pathname.startsWith(`${item.path}/`)

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1 className="nav-brand-name">FinanzasClaras</h1>
        <p className="nav-brand-tag">Finanzas y fiscalidad</p>
      </div>

      <ul className="nav-items">
        {navItems.map((item) => (
          <li key={item.path} className={item.nivel ? 'nav-nivel' : undefined}>
            <NavLink
              to={item.path}
              className={() => (seccionActiva(item) ? 'nav-link active' : 'nav-link')}
              end
            >
              <span className="nav-icon"><Icono nombre={item.icon} /></span>
              <span className="nav-label">{item.label}</span>
            </NavLink>

            {item.hijos && seccionActiva(item) && (
              <ul className="nav-sub">
                {item.hijos.map((hijo) => (
                  <li key={hijo.path}>
                    <NavLink
                      to={hijo.path}
                      end
                      className={({ isActive }) =>
                        isActive ? 'nav-sublink active' : 'nav-sublink'
                      }
                    >
                      {hijo.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
