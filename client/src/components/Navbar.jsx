import { NavLink } from 'react-router-dom'

/**
 * Navbar - Navegación principal con categorías
 * Diseño basado en: Esmeralda Clarity (from Stitch)
 */

const Navbar = () => {
  const navItems = [
    { label: 'Fiscal', path: '/irpf', icon: '📊' },
    { label: 'Nómina', path: '/nomina', icon: '💰' },
    { label: 'Gastos', path: '/gastos', icon: '🛒' },
    { label: 'Hipotecas', path: '/hipotecas', icon: '🏠' },
    { label: 'Inversión', path: '/inversion', icon: '📈' },
    { label: 'Jubilación', path: '/jubilacion', icon: '📅' },
    { label: 'Viajes', path: '/viajes', icon: '✈️' },
    { label: 'Cuenta', path: '/account', icon: '👤' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1 className="display-lg text-primary">FinanzasClaras</h1>
      </div>

      <ul className="nav-items">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? 'nav-link active'
                  : 'nav-link'
              }
              end
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
