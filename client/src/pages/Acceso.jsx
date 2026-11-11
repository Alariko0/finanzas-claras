/**
 * Acceso.jsx - Iniciar sesión y crear cuenta (Supabase Auth)
 * Dos pestañas en la misma pantalla. Tras entrar, vuelve a la ruta que se pidió.
 */

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Acceso.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Acceso = () => {
  const { entrar, registrar, reenviarConfirmacion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.desde || '/account'

  const [pestana, setPestana] = useState('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sinConfirmar, setSinConfirmar] = useState(false)

  const requisitos = {
    longitud: password.length >= 8,
    mayuscula: /[A-Z]/.test(password),
    numero: /[0-9]/.test(password)
  }
  const passwordValida = requisitos.longitud && requisitos.mayuscula && requisitos.numero

  const cambiarPestana = (nueva) => {
    setPestana(nueva)
    setError('')
    setInfo('')
    setSinConfirmar(false)
    setPassword('')
    setConfirmar('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSinConfirmar(false)

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Introduce un correo electrónico válido.')
      return
    }
    if (!password) {
      setError('Introduce tu contraseña.')
      return
    }

    setEnviando(true)
    const resultado = await entrar({ email: email.trim(), password })
    setEnviando(false)

    if (resultado.ok) {
      navigate(destino, { replace: true })
      return
    }

    setError(resultado.mensaje)
    setSinConfirmar(resultado.codigo === 'email_not_confirmed')
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Introduce un correo electrónico válido.')
      return
    }
    if (!passwordValida) {
      setError('La contraseña debe tener 8+ caracteres, una mayúscula y un número.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setEnviando(true)
    const resultado = await registrar({ nombre: nombre.trim(), email: email.trim(), password })
    setEnviando(false)

    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }

    if (resultado.requiereConfirmacion) {
      setPestana('login')
      setPassword('')
      setConfirmar('')
      setInfo('Cuenta creada. Te hemos enviado un correo: confirma tu dirección y después inicia sesión.')
      return
    }

    navigate(destino, { replace: true })
  }

  const handleReenviar = async () => {
    setError('')
    const resultado = await reenviarConfirmacion(email.trim())
    if (resultado.ok) {
      setSinConfirmar(false)
      setInfo('Correo de confirmación reenviado. Revisa tu bandeja (y el spam).')
    } else {
      setError(resultado.mensaje)
    }
  }

  const esLogin = pestana === 'login'

  return (
    <div className="acceso-page">
      <div className="acceso-card">
        <h1>{esLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="acceso-subtitle">
          {esLogin
            ? 'Accede para guardar tus cálculos y tu historial'
            : 'Regístrate para guardar tus cálculos y tu historial'}
        </p>

        <div className="acceso-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={esLogin}
            className={`acceso-tab ${esLogin ? 'active' : ''}`}
            onClick={() => cambiarPestana('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!esLogin}
            className={`acceso-tab ${!esLogin ? 'active' : ''}`}
            onClick={() => cambiarPestana('registro')}
          >
            Crear cuenta
          </button>
        </div>

        <div aria-live="polite">
          {info && <p className="acceso-info">{info}</p>}
          {error && <p className="acceso-error" role="alert">{error}</p>}
        </div>

        {esLogin ? (
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setVerPassword(!verPassword)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {sinConfirmar && (
              <button type="button" className="acceso-link-button" onClick={handleReenviar}>
                Reenviar correo de confirmación
              </button>
            )}

            <button type="submit" disabled={enviando} className="submit-button">
              {enviando ? 'Entrando…' : 'Iniciar sesión'}
            </button>

            <p className="acceso-switch">
              ¿No tienes cuenta?{' '}
              <button type="button" className="acceso-link-button" onClick={() => cambiarPestana('registro')}>
                Crea una gratis
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegistro} noValidate>
            <div className="form-group">
              <label htmlFor="reg-nombre">Nombre</label>
              <input
                id="reg-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="form-input"
                placeholder="Tu nombre"
                autoComplete="name"
                maxLength={50}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Correo electrónico</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Contraseña</label>
              <div className="password-field">
                <input
                  id="reg-password"
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setVerPassword(!verPassword)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              <ul className="password-requirements">
                <li className={requisitos.longitud ? 'met' : ''}>{requisitos.longitud ? '✓' : '○'} 8 o más caracteres</li>
                <li className={requisitos.mayuscula ? 'met' : ''}>{requisitos.mayuscula ? '✓' : '○'} Una mayúscula</li>
                <li className={requisitos.numero ? 'met' : ''}>{requisitos.numero ? '✓' : '○'} Un número</li>
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirmar">Confirmar contraseña</label>
              <input
                id="reg-confirmar"
                type={verPassword ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" disabled={enviando} className="submit-button">
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>

            <p className="acceso-switch">
              ¿Ya tienes cuenta?{' '}
              <button type="button" className="acceso-link-button" onClick={() => cambiarPestana('login')}>
                Inicia sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Acceso
