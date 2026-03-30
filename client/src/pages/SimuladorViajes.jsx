/**
 * SimuladorViajes.jsx - Gestión de gastos de viaje compartido
 * Algoritmo de liquidación mínima (equalization)
 *
 * @see ../utils/api.js - Conectar con backend en Fase 6
 */
'use client'

import { useState } from 'react'
import './SimuladorViajes.css'

/**
 * SimuladorViajes - Gestión de gastos de viaje compartido
 * Algoritmo de liquidación mínima (equalization)
 */

const SimuladorViajes = () => {
  const [participantes, setParticipantes] = useState([])
  const [gastos, setGastos] = useState([])
  const [nuevoGasto, setNuevoGasto] = useState('')
  const [nuevoParticipante, setNuevoParticipante] = useState('')
  const [porcentajes, setPorcentajes] = useState({})
  const [error, setError] = useState('') // Validación de errores
  const [success, setSuccess] = useState('') // Mensajes de éxito

  // Validación para agregar participantes
  const agregarParticipante = () => {
    if (!nuevoParticipante.trim()) {
      setError('Por favor, introduce un nombre válido.')
      return
    }

    if (participantes.find((p) => p.nombre.toLowerCase() === nuevoParticipante.toLowerCase())) {
      setError('Este participante ya existe.')
      return
    }

    setError('')
    setParticipantes([...participantes, { nombre: nuevoParticipante.trim(), saldo: 0 }])
    setNuevoParticipante('')
    setSuccess('Participante añadido correctamente.')
    setTimeout(() => setSuccess(''), 2000)
  }

  // Eliminar participante con validación
  const eliminarParticipante = (nombre) => {
    if (participantes.length <= 1) {
      setError('No puedes eliminar el último participante.')
      return
    }
    setError('')
    setParticipantes(participantes.filter((p) => p.nombre !== nombre))
    setGastos(gastos.filter((g) => g.participante !== nombre))
  }

  // Validación para agregar gastos
  const agregarGasto = () => {
    if (!nuevoGasto.trim()) {
      setError('Por favor, introduce una descripción del gasto.')
      return
    }

    if (!participantes.length) {
      setError('Añade participantes primero.')
      return
    }

    if (!participantes[0].nombre || !participantes[0].saldo) {
      setError('Selecciona un participante para pagar.')
      return
    }

    // Validar monto numérico
    const montoNumerico = parseFloat(nuevoGasto)
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('El monto debe ser un número mayor a 0.')
      return
    }

    setError('')
    setGastos([...gastos, {
      id: Date.now(),
      descripcion: nuevoGasto.trim(),
      quienPago: participantes[0].nombre,
      monto: montoNumerico,
      porcentaje: 100
    }])
    setNuevoGasto('')
    setSuccess('Gasto añadido correctamente.')
    setTimeout(() => setSuccess(''), 2000)
  }

  // Algoritmo de liquidación mínima
  const calcularLiquidacion = () => {
    const totalGastado = gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0)
    const totalAportado = participantes.reduce((sum, p) => {
      const aportado = gastos
        .filter((g) => g.participante === p.nombre)
        .reduce((sum2, g) => sum2 + (parseFloat(g.monto) || 0), 0)
      return sum + aportado
    }, 0)

    const diferencia = totalGastado - totalAportado
    const deudaPromedio = diferencia / participantes.length

    // Transferencias mínimas
    const transferencias = []
    const saldos = participantes.map((p) => {
      const saldo = gastos
        .filter((g) => g.participante === p.nombre)
        .reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0)
      return {
        ...p,
        saldo: Math.round(saldo)
      }
    })

    // Ordenar por saldo para optimizar
    saldos.sort((a, b) => b.saldo - a.saldo)

    let saldoPendiente = 0
    for (const persona of saldos) {
      const neto = persona.saldo - saldoPendiente
      if (neto > 0) {
        // Esta persona debe dinero
        const posiblesPagos = saldos.filter((p) => p.saldo < 0).map((p) => ({
          debe: p,
          debeCantidad: Math.min(-p.saldo, neto)
        }))
        posiblesPagos.forEach(({ debe, debeCantidad }) => {
          transferencias.push({
            de: persona.nombre,
            a: debe.nombre,
            cantidad: debeCantidad,
            razon: `Por ${debe.descripcion || 'desglose'}`
          })
          saldoPendiente += debeCantidad
        })
      } else if (neto < 0) {
        // Esta persona debe ser pagada
        saldoPendiente += neto
      }
    }

    return { transferencias }
  }

  const liquidacion = calcularLiquidacion()

  return (
    <div className="viajes-page">
      <div className="page-header">
        <h1>Simulador de Viajes</h1>
        <p className="page-subtitle">Gestiona gastos compartidos y calcula quién debe cuánto</p>
      </div>

      <section className="participants-section">
        <h3>Participantes</h3>
        <div className="input-group">
          <label htmlFor="nuevoParticipante">Nombre</label>
          <input
            id="nuevoParticipante"
            type="text"
            value={nuevoParticipante}
            onChange={(e) => setNuevoParticipante(e.target.value)}
            className="input-field"
          />
          <button onClick={agregarParticipante} className="action-button">
            Agregar
          </button>
        </div>

        <div className="participants-list">
          {participantes.map((p) => (
            <div key={p.nombre} className="participant-item">
              <span>{p.nombre}</span>
              <button onClick={() => eliminarParticipante(p.nombre)} className="remove-button">
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="expenses-section">
        <h3>Gastos</h3>
        <div className="input-group">
          <label htmlFor="nuevoGasto">Descripción</label>
          <input
            id="nuevoGasto"
            type="text"
            value={nuevoGasto}
            onChange={(e) => setNuevoGasto(e.target.value)}
            className="input-field"
          />
          <label htmlFor="nuevoGasto" className="form-label">¿Quién pagó?</label>
          <select
            id="quienPago"
            value={gastos.length > 0 ? gastos[0].quienPago : ''}
            className="input-field"
            onChange={(e) => {
              setGastos(gastos.map((g) => ({ ...g, quienPago: e.target.value })))
            }}
          >
            {participantes.map((p) => (
              <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <button onClick={agregarGasto} className="action-button">
          Agregar Gasto
        </button>

        {/* Display de errores y mensajes */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="expense-list">
          {gastos.map((g) => (
            <div key={g.id} className="expense-item">
              <span>{g.descripcion}</span>
              <span>{g.quienPago} pagó {g.monto || 0}€</span>
            </div>
          ))}
        </div>
      </section>

      <section className="settlement-section">
        <h3>Resumen de Transferencias</h3>
        <div className="settlement-card">
          {liquidacion.transferencias.length > 0 ? (
            liquidacion.transferencias.map((t, idx) => (
              <div key={idx} className="transfer-item">
                <span>
                  <strong>{t.de}</strong> paga {t.cantidad}€ a <strong>{t.a}</strong>
                </span>
              </div>
            ))
          ) : (
            <p className="empty-message">
              {gastos.length === 0 ? 'Añade gastos para ver las transferencias necesarias.' : 'Todos al día!'}
            </p>
          )}
        </div>
      </section>

      <section className="summary-tab">
        <h3>Estado General</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total gastado</span>
            <span className="summary-value">{gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0).toLocaleString('es-ES')} €</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Participantes</span>
            <span className="summary-value">{participantes.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Gastos registrados</span>
            <span className="summary-value">{gastos.length}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SimuladorViajes
