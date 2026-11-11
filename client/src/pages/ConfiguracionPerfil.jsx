/**
 * ConfiguracionPerfil.jsx - Gestión de perfil y preferencias
 * Perfil y preferencias guardados en Supabase (vía API); contraseña vía Supabase Auth.
 *
 * @see ../utils/api.js - API client con autenticación
 */
'use client'

import { useState, useEffect } from 'react'
import { perfil as perfilApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './ConfiguracionPerfil.css'

/**
 * ConfiguracionPerfil - Gestión de perfil y preferencias
 */

const MODULOS_POR_DEFECTO = {
  hipotecas: true,
  inversion: true,
  viajes: true,
  jubilacion: true
}

// La API guarda las preferencias como modulo_<nombre>
const desdeApi = (preferencias = {}) =>
  Object.fromEntries(
    Object.keys(MODULOS_POR_DEFECTO).map((clave) => [
      clave,
      preferencias[`modulo_${clave}`] ?? MODULOS_POR_DEFECTO[clave]
    ])
  )

const haciaApi = (modulos) =>
  Object.fromEntries(Object.entries(modulos).map(([clave, activo]) => [`modulo_${clave}`, activo]))

const ConfiguracionPerfil = () => {
  const { user, cambiarPassword } = useAuth()
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [nuevaContraseña, setNuevaContraseña] = useState('')
  const [confirmarNueva, setConfirmarNueva] = useState('')
  const [modulos, setModulos] = useState(MODULOS_POR_DEFECTO)
  const [feedback, setFeedback] = useState({ tipo: '', mensaje: '' })

  const mostrarFeedback = (tipo, mensaje) => {
    setFeedback({ tipo, mensaje })
    setTimeout(() => setFeedback({ tipo: '', mensaje: '' }), 4000)
  }

  // Cargar perfil del usuario
  useEffect(() => {
    let activo = true

    const cargarPerfil = async () => {
      try {
        const datos = await perfilApi.obtener()
        if (activo) {
          setNombre(datos.nombre)
          setModulos(desdeApi(datos.preferencias))
        }
      } catch (error) {
        if (activo) mostrarFeedback('error', error.message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargarPerfil()
    return () => { activo = false }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()

    try {
      const datos = await perfilApi.actualizar({
        nombre: nombre.trim(),
        preferencias: haciaApi(modulos)
      })
      setNombre(datos.nombre)
      mostrarFeedback('success', 'Perfil guardado correctamente')
    } catch (error) {
      const detalle = error.errores?.[0]?.message
      mostrarFeedback('error', detalle || error.message)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (nuevaContraseña !== confirmarNueva) {
      mostrarFeedback('error', 'Las contraseñas no coinciden.')
      return
    }

    if (nuevaContraseña.length < 8 || !/[A-Z]/.test(nuevaContraseña) || !/[0-9]/.test(nuevaContraseña)) {
      mostrarFeedback('error', 'La contraseña debe tener 8+ caracteres, una mayúscula y un número.')
      return
    }

    const resultado = await cambiarPassword(nuevaContraseña)

    if (resultado.ok) {
      setNuevaContraseña('')
      setConfirmarNueva('')
      mostrarFeedback('success', 'Contraseña actualizada con éxito')
    } else {
      mostrarFeedback('error', resultado.mensaje)
    }
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
              minLength={2}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              className="form-input"
              readOnly
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
            <label htmlFor="nuevaContraseña">Nueva Contraseña</label>
            <input
              id="nuevaContraseña"
              type="password"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
              className="form-input"
              autoComplete="new-password"
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
              autoComplete="new-password"
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
        </p>
      </div>
    </div>
  )
}

export default ConfiguracionPerfil
