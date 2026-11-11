/**
 * Inicio.jsx - Dashboard principal de FinanzasClaras
 * Hero con tagline y grid de módulos disponibles
 *
 * @see design-system.md - Design tokens
 * @see ../utils/api.js - API con autenticación
 */
'use client'

import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './Inicio.css'

/**
 * Inicio - Dashboard principal de FinanzasClaras
 * Hero con tagline y grid de módulos disponibles
 * Conectado con API backend para autenticación
 */

const Inicio = () => {
  const { user, registrar, entrar, salir } = useAuth()
  const location = useLocation()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    confirmPassword: ''
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Si una ruta protegida nos redirigió aquí, abrir el login
  useEffect(() => {
    if (location.state?.requiereLogin && !user) {
      setActiveTab('login')
      setShowLoginModal(true)
    }
  }, [location.state, user])

  // Logout
  const logout = async () => {
    await salir()
    setSuccessMsg('Has cerrado sesión correctamente.')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // Login con Supabase Auth
  const handleLogin = async (email, password) => {
    setErrorMsg('')
    setSuccessMsg('')

    const resultado = await entrar({ email, password })

    if (resultado.ok) {
      setShowLoginModal(false)
      setFormData({ email: '', password: '', nombre: '', confirmPassword: '' })
      setSuccessMsg('Sesión iniciada correctamente.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } else {
      setErrorMsg(resultado.mensaje)
      setTimeout(() => setErrorMsg(''), 5000)
    }
  }

  // Registro con Supabase Auth
  const handleRegister = async (nombre, email, password) => {
    setErrorMsg('')
    setSuccessMsg('')

    const resultado = await registrar({ nombre, email, password })

    if (resultado.ok) {
      setShowLoginModal(false)
      setFormData({ email: '', password: '', nombre: '', confirmPassword: '' })
      setSuccessMsg(
        resultado.requiereConfirmacion
          ? 'Cuenta creada. Revisa tu correo y confirma tu dirección para iniciar sesión.'
          : 'Cuenta creada correctamente.'
      )
      setTimeout(() => setSuccessMsg(''), 8000)
    } else {
      setErrorMsg(resultado.mensaje)
      setTimeout(() => setErrorMsg(''), 5000)
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
              <p className="user-status">{user.esAdmin ? 'Modo administrador activo' : 'Versión estándar'}</p>
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
              {/* Mensajes de error y éxito */}
              {errorMsg && <div className="error-message">{errorMsg}</div>}
              {successMsg && <div className="success-message">{successMsg}</div>}

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
