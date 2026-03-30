/**
 * Notificaciones.jsx - Lista de alertas fiscales y financieras
 * Conectado con backend API en Fase 6
 *
 * @see ../utils/api.js - API client con autenticación
 */
'use client'

import { useState, useEffect } from 'react'
import { auth, obtenerToken } from '../utils/api'
import './Notificaciones.css'

/**
 * Notificaciones - Lista de alertas fiscales y financieras
 * Fetch from API en Fase 6
 */

const Notificaciones = () => {
  const [noLeidas, setNoLeidas] = useState(0)
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch notificaciones desde backend
  const cargarNotificaciones = async () => {
    try {
      const token = obtenerToken()

      // Mock data para demo - En Fase 6 se conectará con la API real
      const mockAlertas = [
        {
          id: 1,
          tipo: 'info',
          titulo: 'Plazo declaración de la renta',
          mensaje: 'El plazo finaliza el 30 de junio de 2026. Prepara tus documentos.',
          fecha: '2026-03-25',
          leida: false
        },
        {
          id: 2,
          tipo: 'warning',
          titulo: 'Cambio tramos IRPF 2025',
          mensaje: 'Los tramos autonómicos se han actualizado para 2026. Revisa tu cálculo.',
          fecha: '2026-03-20',
          leida: true
        },
        {
          id: 3,
          tipo: 'urgent',
          titulo: 'Tu hipoteca variable sube',
          mensaje: 'La Euribor ha subido 0.3%. Tu cuota aumentará el 1 de junio.',
          fecha: '2026-03-28',
          leida: false
        }
      ]

      setAlertas(mockAlertas)
      setNoLeidas(mockAlertas.filter(a => !a.leida).length)
      setError('')
      setLoading(false)
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
      setError('Error al cargar notificaciones.')
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  // Marcar como leída
  const marcarLeida = async (id) => {
    try {
      const token = obtenerToken()

      // Actualizar estado local
      setAlertas(alertas.map(a => a.id === id ? { ...a, leida: true } : a))
      setNoLeidas(noLeidas - 1)

      // En Fase 6 se conectará con API real
      // await fetch(`/api/notificaciones/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })

      setSuccess('Notificación marcada como leída.')
      setTimeout(() => setSuccess(''), 2000)
      setError('')
    } catch (err) {
      setError('Error al marcar como leída.')
      setTimeout(() => setError(''), 2000)
    }
  }

  // Limpieza masiva
  const limpiarTodo = async () => {
    try {
      const token = obtenerToken()

      // En Fase 6 se conectará con API real
      // await fetch('/api/notificaciones/limpiar', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })

      setAlertas([])
      setNoLeidas(0)
      setSuccess('Todas las notificaciones han sido leídas.')
      setError('')
    } catch (err) {
      setError('Error al limpiar.')
      setTimeout(() => setError(''), 2000)
    }
  }

  return (
    <div className="notificaciones-page">
      <div className="page-header">
        <h1>Notificaciones</h1>
        <p>Alertas fiscales y financieras</p>
      </div>

      {/* Mensajes de estado */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <section className="notifications-list">
        {loading ? (
          <p className="loading">Cargando notificaciones...</p>
        ) : alertas.length > 0 ? (
          alertas.map((notif) => (
            <div key={notif.id} className="notification-card">
              <span className={`notification-badge notification-${notif.tipo}`}>
                {notif.tipo === 'info' && 'ℹ️ Info'}
                {notif.tipo === 'warning' && '⚠️ Advertencia'}
                {notif.tipo === 'urgent' && '🔴 Urgente'}
              </span>
              <h3 className="notification-title">{notif.titulo}</h3>
              <p className="notification-message">{notif.mensaje}</p>
              <span className="notification-date">{notif.fecha}</span>
              {!notif.leida && (
                <div className="notification-actions">
                  <button
                    className="action-button"
                    onClick={() => marcarLeida(notif.id)}
                  >
                    Marcar como leída
                  </button>
                  <button
                    className="action-button"
                    onClick={() => {
                      setAlertas(alertas.filter(a => a.id !== notif.id))
                      setNoLeidas(noLeidas - 1)
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>¡No hay notificaciones pendientes!</p>
          </div>
        )}
      </section>

      <button onClick={limpiarTodo} className="action-button">
        Limpiar Todas
      </button>

      {noLeidas > 0 && (
        <div className="badge-notification">
          <span className="badge-count">{noLeidas}</span>
          <span className="badge-label">notificaciones no leídas</span>
        </div>
      )}

      <section className="empty-state">
        <p>
          {noLeidas === 0 ? '¡Todas las notificaciones han sido leídas!' : 'Haz clic en "Marcar como leída" para limpiar esta lista.'}
        </p>
      </section>
    </div>
  )
}

export default Notificaciones