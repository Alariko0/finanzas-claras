/**
 * CrearCuenta.jsx - Registro de nuevo usuario
 * Formulario con validación en tiempo real
 *
 * @see ../utils/api.js - Función de registro auth.registro()
 */
'use client'

import { useState } from 'react'
import { auth, guardarToken } from '../utils/api'
import './CrearCuenta.css'

/**
 * CrearCuenta - Registro de nuevo usuario
 * Formulario con validación en tiempo real
 */

const CrearCuenta = () => {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [confirmarContraseña, setConfirmarContraseña] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState('')

  // Validación de contraseña
  const passwordStrength = {
    length: contraseña.length >= 8,
    uppercase: /[A-Z]/.test(contraseña),
    number: /[0-9]/.test(contraseña)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    // Validaciones
    if (!nombre || !email || !contraseña || !confirmarContraseña) {
      setError('Por favor, completa todos los campos.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Introduce un correo electrónico válido.')
      return
    }

    if (contraseña !== confirmarContraseña) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number) {
      setError('La contraseña debe tener 8+ caracteres, una mayúscula y un número.')
      return
    }

    setSubmitting(true)

    try {
      // Llamada al API de registro
      const response = await auth.registro({ nombre, email, password: contraseña })

      if (response.message) {
        // Éxito
        guardarToken(response.token)
        setInfo(response.message)
        setInfo(`¡Cuenta creada correctamente! Redirigiendo...`)

        // Simular redirección
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } else if (response.message) {
        // Error del servidor
        setError(response.message)
      }
    } catch (err) {
      setError('Error al crear la cuenta: ' + (err.message || 'Email ya registrado'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="crear-cuenta-page">
      <div className="form-container">
        <h1>Crear Cuenta</h1>
        <p>Regístrate para acceder a todas las calculadoras</p>

        {info && <p className="info-text">{info}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="form-input"
              placeholder="Tu nombre completo"
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
              placeholder="tu@email.com"
            />
            {error.includes('email') && (
              <p className="validation-error">Introduce un correo válido.</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              id="contraseña"
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
            <div className="password-requirements">
              <div className={`req ${passwordStrength.length ? 'met' : ''}`}>8+ caracteres {passwordStrength.length ? '✓' : ''}</div>
              <div className={`req ${passwordStrength.uppercase ? 'met' : ''}`}>Una mayúscula {passwordStrength.uppercase ? '✓' : ''}</div>
              <div className={`req ${passwordStrength.number ? 'met' : ''}`}>Un número {passwordStrength.number ? '✓' : ''}</div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarContraseña">Confirmar Contraseña</label>
            <input
              id="confirmarContraseña"
              type="password"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="validation-error">{error}</p>}

          <button type="submit" disabled={submitting} className="submit-button">
            {submitting ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="login-link">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="primary-link">
            Inicia sesión aquí
          </a>
        </p>

        <div className="info-text">
          <strong>Promoción:</strong> Regístrate ahora y obtén 1 mes de servicios premium gratis.
        </div>
      </div>
    </div>
  )
}

export default CrearCuenta
