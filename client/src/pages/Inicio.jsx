/**
 * Inicio.jsx - Dashboard principal de FinanzasClaras
 * Hero con tagline y grid de módulos disponibles
 *
 * @see design-system.md - Design tokens
 * @see ../utils/api.js - API con autenticación
 */
'use client'

import { NavLink, useState, useEffect } from 'react-router-dom'
import { auth, obtenerToken, eliminarToken, obtenerUsuario } from '../utils/api'
import './Inicio.css'

// Estados del formulario
const [activeTab, setActiveTab] = useState('login')
const [formData, setFormData] = useState({
  email: '',
  password: '',
  nombre: '',
  confirmPassword: ''
})

/**
 * Inicio - Dashboard principal de FinanzasClaras
 * Hero con tagline y grid de módulos disponibles
 * Conectado con API backend para autenticación
 */

const Inicio = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    confirmPassword: ''
  })

  // Cargar estado de autenticación
  useEffect(() => {
    const token = obtenerToken()
    const userData = obtenerUsuario()

    if (token && userData) {
      setUser(userData)
    }

    setLoading(false)
  }, [])

  // Logout
  const logout = async () => {
    try {
      eliminarToken()
      setUser(null)
      alert('Has cerrado sesión correctamente.')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      alert('Error al cerrar sesión.')
    }
  }

  // Login con API
  const handleLogin = async (email, password) => {
    try {
      const response = await auth.login({ email, password })

      if (response.success) {
        setUser(response.usuario)
        setShowLoginModal(false)
        alert(response.message)
      } else {
        alert(response.message)
      }
    } catch (err) {
      alert('Error en el login: ' + err.message)
    }
  }

  // Registro con API
  const handleRegister = async (nombre, email, password) => {
    try {
      const response = await auth.registro({ nombre, email, password })

      if (response.success) {
        setUser(response.usuario)
        setShowLoginModal(false)
        alert(response.message)
      } else {
        alert(response.message)
      }
    } catch (err) {
      alert('Error en el registro: ' + err.message)
    }
  }
  const modules = [
    {
      name: 'IRPF',
      path: '/irpf',
      icon: '📊',
      desc: 'Cálculo de impuestos 2025 por tramos',
      status: 'available'
    },
    {
      name: 'Nómina',
      path: '/nomina',
      icon: '💰',
      desc: 'Desglose salarial y deducciones',
      status: 'available'
    },
    {
      name: 'Gastos',
      path: '/gastos',
      icon: '🛒',
      desc: 'Gastos compartidos y presupuestos',
      status: 'available'
    },
    {
      name: 'Hipotecas',
      path: '/hipotecas',
      icon: '🏠',
      desc: 'Simulador de hipotecas',
      status: 'available'
    },
    {
      name: 'Inversión',
      path: '/inversion',
      icon: '📈',
      desc: 'Gestión de cartera de inversión',
      status: 'available'
    },
    {
      name: 'Jubilación',
      path: '/jubilacion',
      icon: '📅',
      desc: 'Planificación de jubilación',
      status: 'available'
    },
    {
      name: 'Viajes',
      path: '/viajes',
      icon: '✈️',
      desc: 'Presupuestos de viajes en grupo',
      status: 'available'
    },
    {
      name: 'Cuenta',
      path: '/account',
      icon: '👤',
      desc: 'Gestión de perfil y configuraciones',
      status: 'available'
    }
  ]

  const quickAccess = [
    { name: 'IRPF', path: '/irpf', icon: '📊' },
    { name: 'Nómina', path: '/nomina', icon: '💰' },
    { name: 'Hipotecas', path: '/hipotecas', icon: '🏠' }
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
              <p className="user-status">{user.rol === 'admin' ? 'Modo administrador activo' : 'Versión estándar'}</p>
              <button onClick={logout} className="logout-button">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <h1 className="hero-title">Finanzas para personas reales en España</h1>
              <p className="hero-subtitle">
                Calculadoras fiscales, financieras y de planificación personal
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="login-button"
              >
                Inicia sesión o regístrate
              </button>
            </>
          )}
        </div>
      </section>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Acceso</h2>
              <button onClick={() => setShowLoginModal(false)} className="close-button">×</button>
            </div>

            <div className="modal-body">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Iniciar Sesión
                </button>
                <button
                  className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => setActiveTab('register')}
                >
                  Crear Cuenta
                </button>
              </div>

              {/* Formulario Login */}
              {activeTab === 'login' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleLogin(formData.email, formData.password)
                  }}
                >
                  <div className="form-group">
                    <label htmlFor="login-email">Correo electrónico</label>
                    <input
                      id="login-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="form-input"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="login-password">Contraseña</label>
                    <input
                      id="login-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-button">Iniciar Sesión</button>
                  </div>

                  <p className="form-footer">
                    ¿Olvidaste tu contraseña? <a href="#" className="forgot-link">Recupérala</a>
                  </p>
                </form>
              )}

              {/* Formulario Registro */}
              {activeTab === 'register' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRegister(formData.nombre, formData.email, formData.password)
                  }}
                >
                  <div className="form-group">
                    <label htmlFor="register-nombre">Nombre</label>
                    <input
                      id="register-nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      className="form-input"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-email">Correo electrónico</label>
                    <input
                      id="register-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="form-input"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-password">Contraseña</label>
                    <input
                      id="register-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="form-input"
                      placeholder="••••••••"
                      minLength="8"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-button">Crear Cuenta</button>
                  </div>

                  <p className="form-footer">
                    <strong>Términos y condiciones:</strong> Al registrarte aceptas nuestra política de privacidad.
                  </p>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <a href="#" className="forgot-link-footer">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
        </div>
      )}

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
              <span className="module-icon">{mod.icon}</span>
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
              <span className="quick-card-icon">{q.icon}</span>
              <span className="quick-card-title">{q.name}</span>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Inicio
