import { useState } from 'react'
import './GastosFamiliares.css'

/**
 * Página: Análisis de Gastos Familiares
 * Módulo para gestión de gastos compartidos entre parejas, amigos o familia
 */

const GastosFamiliares = () => {
  const [rendaMensual, setRendaMensual] = useState([
    { id: 1, persona: 'Persona 1', renda: 2500 },
    { id: 2, persona: 'Persona 2', renda: 2200 },
    { id: 3, persona: 'Persona 3', renda: 1800 }
  ])
  const [gastosCompartidos, setGastosCompartidos] = useState([
    { id: 1, descricao: 'Luz', monto: 120 },
    { id: 2, descricao: 'Agua', monto: 45 },
    { id: 3, descricao: 'Internet', monto: 80 },
    { id: 4, descricao: 'Móvil', monto: 60 },
    { id: 5, descricao: 'Seguro Hogar', monto: 90 }
  ])
  const [gastosIndividuales, setGastosIndividuales] = useState([
    { id: 1, persona: 'Persona 1', gastos: 350 },
    { id: 2, persona: 'Persona 2', gastos: 400 },
    { id: 3, persona: 'Persona 3', gastos: 280 }
  ])

  const totalRenda = rendaMensual.reduce((sum, m) => sum + m.renda, 0)
  const totalGastosCompartidos = gastosCompartidos.reduce((sum, g) => sum + g.monto, 0)
  const totalGastosIndividuales = gastosIndividuales.reduce((sum, g) => sum + g.gastos, 0)
  const totalGastos = totalGastosCompartidos + totalGastosIndividuales
  const saldo = totalRenda - totalGastos

  // Calcular cuota por gastos compartidos
  const calcularCuota = (monto, participantes) => Math.round(monto / participantes)

  return (
    <div className="gastos-page">
      <div className="page-header">
        <h1>Análisis de Gastos Familiares</h1>
        <p className="page-subtitle">
          Gestiona gastos compartidos entre parejas, amigos o familia
        </p>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Rentas Mensuales</h2>
        <div className="gastos-grid">
          {rendaMensual.map((persona) => (
            <div key={persona.id} className="gastos-card surface-container-low">
              <div className="card-label">
                <span className="label-sm">{persona.persona}</span>
              </div>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">Renda Mensual</span>
                <span className="display-lg">{persona.renda.toLocaleString('es-ES')} €</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Gastos Compartidos</h2>
        <div className="gastos-list">
          {gastosCompartidos.map((gasto) => (
            <div key={gasto.id} className="gasto-item">
              <span className="gasto-label">{gasto.descricao}</span>
              <span className="gasto-value">{gasto.monto.toLocaleString('es-ES')} €</span>
              <span className="gasto-icon">🏠</span>
            </div>
          ))}
        </div>
        <div className="gastos-total">
          <span className="label-sm">Total Gastos Compartidos</span>
          <span className="display-lg text-primary-fixed-dim">{totalGastosCompartidos.toLocaleString('es-ES')} €</span>
        </div>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Cuotas de Contribución</h2>
        <div className="gastos-grid">
          {rendaMensual.map((persona) => (
            <div key={persona.id} className="gastos-card surface-container-lowest">
              <div className="card-label">
                <span className="label-sm">{persona.persona}</span>
              </div>
              <div className="cuota-display">
                <span className="caption">Cuota Mensual</span>
                <span className="display-lg">{calcularCuota(totalGastosCompartidos, persona.renda).toLocaleString('es-ES')} €</span>
              </div>
              <div className="card-footer">
                <span className="caption">Saldo Disponible</span>
                <span className={saldo > 0 ? 'text-success' : 'text-tertiary'}>
                  {saldo > 0 ? '+' : ''}{saldo.toLocaleString('es-ES')} €
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Gastos Individuales</h2>
        <div className="gastos-list">
          {gastosIndividuales.map((gasto) => (
            <div key={gasto.id} className="gasto-item">
              <span className="gasto-label">{gasto.persona}</span>
              <span className="gasto-value">{gasto.gastos.toLocaleString('es-ES')} €</span>
              <span className="gasto-icon">👤</span>
            </div>
          ))}
        </div>
        <div className="gastos-total">
          <span className="label-sm">Total Gastos Individuales</span>
          <span className="display-lg text-secondary">{totalGastosIndividuales.toLocaleString('es-ES')} €</span>
        </div>
      </div>

      <div className="gastos-section budget-section">
        <h2 className="headline-md">Resumen Mensual</h2>
        <div className="budget-card">
          <div className="budget-row">
            <span>Balance General</span>
            <span className={saldo >= 0 ? 'text-primary-fixed-dim' : 'text-tertiary'}>
              {saldo >= 0 ? '+' : ''}{saldo.toLocaleString('es-ES')} €
            </span>
          </div>
          <div className="budget-row">
            <span>Promedio Ahorro</span>
            <span className={saldo >= 0 ? 'text-primary-fixed-dim' : 'text-tertiary'}>
              {saldo >= 0 ? '+' : ''}{Math.round(saldo / (rendaMensual.length || 1))} €
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GastosFamiliares
