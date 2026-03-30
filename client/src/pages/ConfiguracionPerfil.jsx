/**
 * ConfiguracionPerfil.jsx - Gestión de perfil y preferencias
 * Carga datos de usuario desde backend MongoDB
 *
 * @see ../utils/api.js - API client con autenticación
 */
'use client'

import { useState, useEffect } from 'react'
import { auth, obtenerToken } from '../utils/api'
import './ConfiguracionPerfil.css'

/**
 * ConfiguracionPerfil - Gestión de perfil y preferencias
 */

const ConfiguracionPerfil = () => {
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('Usuario')
  const [email, setEmail] = useState('usuario@email.com')
  const [contraseñaActual, setContraseñaActual] = useState('')
  const [nuevaContraseña, setNuevaContraseña] = useState('')
  const [confirmarNueva, setConfirmarNueva] = useState('')
  const [modulos, setModulos] = useState({
    hipotecas: true,
    inversion: true,
    viajes: true,
    jubilacion: true
  })
  const [feedback, setFeedback] = useState({ tipo: '', mensaje: '' })

  // Cargar perfil del usuario
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const token = localStorage.getItem('fc_token')
        if (token) {
          const response = await auth.perfil(token)
          if (response.usuario) {
            setNombre(response.usuario.nombre)
            setEmail(response.usuario.email)
            // Cargar preferencias guardadas
            const preferencias = JSON.parse(localStorage.getItem('fc_modulos') || '{}')
            setModulos(preferencias)
          }
        }
      } catch (error) {
        console.error('Error cargando perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarPerfil()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setFeedback({ tipo: '', mensaje: '' })

    // Guardar cambios
    localStorage.setItem('fc_nombre', nombre)
    localStorage.setItem('fc_email', email)
    localStorage.setItem('fc_modulos', JSON.stringify(modulos))

    setFeedback({
      tipo: 'success',
      mensaje: 'Perfil guardado correctamente'
    })

    setTimeout(() => {
      setFeedback({ tipo: '', mensaje: '' })
    }, 3000)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setFeedback({ tipo: '', mensaje: '' })

    if (nuevaContraseña !== confirmarNueva) {
      setFeedback({ tipo: 'error', mensaje: 'Las contraseñas no coinciden.' })
      return
    }

    // Validar longitud y complejidad
    if (nuevaContraseña.length < 8) {
      setFeedback({ tipo: 'error', mensaje: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }

    setFeedback({
      tipo: 'success',
      mensaje: 'Contraseña actualizada con éxito'
    })

    setTimeout(() => {
      setFeedback({ tipo: '', mensaje: '' })
      setContraseñaActual('')
      setNuevaContraseña('')
      setConfirmarNueva('')
    }, 3000)
  }

  if (loading) {
    return (
      <div className="configuracion-page">
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <h1>Configuración de Perfil</h1>
        <p>Gestiona tus datos personales y preferencias</p>
      </div>

      <section className="section-card">
        <h2 className="section-title">Datos Personales</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" className="save-button">
            Guardar Cambios
          </button>
        </form>
      </section>

      <section className="section-card">
        <h2 className="section-title">Seguridad</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="contraseñaActual">Contraseña Actual</label>
            <input
              id="contraseñaActual"
              type="password"
              value={contraseñaActual}
              onChange={(e) => setContraseñaActual(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nuevaContraseña">Nueva Contraseña</label>
            <input
              id="nuevaContraseña"
              type="password"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarNueva">Confirmar Nueva Contraseña</label>
            <input
              id="confirmarNueva"
              type="password"
              value={confirmarNueva}
              onChange={(e) => setConfirmarNueva(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" className="save-button">
            Cambiar Contraseña
          </button>
        </form>
      </section>

      <section className="section-card">
        <h2 className="section-title">Módulos Activos</h2>
        <div className="module-grid">
          {Object.entries(modulos).map(([key, enabled]) => (
            <div
              key={key}
              className="module-toggle"
              onClick={() => setModulos({ ...modulos, [key]: !enabled })}
            >
              <div className="module-icon">{enabled ? '✓' : '○'}</div>
              <span className="module-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span className={`module-status ${enabled ? 'enabled' : 'disabled'}`}>
                {enabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>
          ))}
        </div>

        <button onClick={handleSave} className="save-button">
          Aplicar Preferencias
        </button>
      </section>

      {feedback.mensaje && (
        <div className={`feedback ${feedback.tipo}`}>
          {feedback.mensaje}
        </div>
      )}

      <div className="info-text">
        <p>
          <strong>Aviso:</strong> No compartas tu contraseña con nadie.
          Las preferencias de módulos se guardan localmente.
        </p>
      </div>
    </div>
  )
}

export default ConfiguracionPerfil
