import { useState } from 'react'
import './AmortizacionAnticipada.css'

/**
 * Página: Simulador de Amortización Anticipada
 * Cálculo de ganancias y pérdidas por amortización anticipada
 */

const AmortizacionAnticipada = () => {
  const [capitalRestante, setCapitalRestante] = useState(150000)
  const [cuotaMensual, setCuotaMensual] = useState(1200)
  const [tasaActual, setTasaActual] = useState(3.5)
  const [nuevaTasa, setNuevaTasa] = useState(3.0)

  // Simulación de amortización por 10.000€
  const calcularGananciaAhorro = () => {
    const interesAntes = capitalRestante * (tasaActual / 100 / 12)
    const interesDespues = capitalRestante * (nuevaTasa / 100 / 12)
    const ahorroMensual = interesAntes - interesDespues
    const añosParaPagar = Math.max(1, Math.round(100000 / (cuotaMensual * 12)))
    const gananciaTotal = ahorroMensual * 12 * (añosParaPagar - 1)

    return {
      ahorroMensual: Math.round(ahorroMensual),
      gananciaTotal: Math.round(gananciaTotal)
    }
  }

  const { ahorroMensual, gananciaTotal } = calcularGananciaAhorro()

  // Calculadora de monto de amortización
  const [montoAmortizacion, setMontoAmortizacion] = useState(50000)
  const [tipoAmortizacion, setTipoAmortizacion] = useState('porcentaje')

  // Penalización si aplica
  const penalizacion = montoAmortizacion * 0.02 // 2% de penalización por ejemplo

  return (
    <div className="amortizacion-page">
      <div className="page-header">
        <h1>Amortización Anticipada</h1>
        <p className="page-subtitle">
          Calcula el impacto de amortizar tu préstamo hipotecario
        </p>
      </div>

      <div className="amortizacion-scenario">
        <h2 className="headline-md">Escenario Actual</h2>
        <div className="scenario-inputs">
          <div className="input-group">
            <label htmlFor="capitalRestante" className="label-sm">Capital Restante</label>
            <input
              id="capitalRestante"
              type="range"
              min="50000"
              max="500000"
              step="10000"
              value={capitalRestante}
              onChange={(e) => setCapitalRestante(parseInt(e.target.value))}
              className="input-range"
            />
            <span className="input-value">{capitalRestante.toLocaleString('es-ES')} €</span>
          </div>

          <div className="input-group">
            <label htmlFor="cuotaMensual" className="label-sm">Cuota Mensual Actual</label>
            <input
              id="cuotaMensual"
              type="number"
              value={cuotaMensual}
              onChange={(e) => setCuotaMensual(parseInt(e.target.value))}
              className="input-field"
              min="100"
              max="5000"
            />
            <span className="input-value">{cuotaMensual} €</span>
          </div>

          <div className="input-group">
            <label htmlFor="tasaActual" className="label-sm">Tasa Actual (% anual)</label>
            <input
              id="tasaActual"
              type="range"
              min="1"
              max="8"
              step="0.1"
              value={tasaActual}
              onChange={(e) => setTasaActual(parseFloat(e.target.value))}
              className="input-range"
            />
            <span className="input-value">{tasaActual}%</span>
          </div>
        </div>
      </div>

      <div className="amortizacion-scenario">
        <h2 className="headline-md">Propuesta de Amortización</h2>
        <div className="scenario-inputs">
          <div className="input-group">
            <label htmlFor="montoAmortizacion" className="label-sm">Monto a Amortizar</label>
            <input
              id="montoAmortizacion"
              type="range"
              min="5000"
              max={capitalRestante - 50000}
              step="1000"
              value={montoAmortizacion}
              onChange={(e) => setMontoAmortizacion(parseInt(e.target.value))}
              className="input-range"
            />
            <span className="input-value">{montoAmortizacion.toLocaleString('es-ES')} €</span>
          </div>

          <div className="input-group">
            <label htmlFor="tipoAmortizacion" className="label-sm">Tipo</label>
            <select
              id="tipoAmortizacion"
              value={tipoAmortizacion}
              onChange={(e) => setTipoAmortizacion(e.target.value)}
              className="input-field"
            >
              <option value="porcentaje">Porcentaje del capital</option>
              <option value="monto">Monto fijo</option>
              <option value="anual">Pago anual completo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="amortizacion-result">
        <h2 className="headline-md">Impacto Financiero</h2>
        <div className="result-cards">
          <div className="result-card highlight">
            <h3 className="title-md">Ahorro Mensual Estimado</h3>
            <div className="balance-totem text-primary-fixed-dim">
              <span className="label-sm">Inteses ahorrados</span>
              <span className="display-lg">
                {ahorroMensual.toLocaleString('es-ES')} €
              </span>
            </div>
          </div>

          <div className="result-card">
            <h3 className="title-md">Ganancia a 10 años</h3>
            <div className="display-lg text-primary-fixed-dim">
              {gananciaTotal.toLocaleString('es-ES')} €
            </div>
          </div>

          <div className="result-card">
            <h3 className="title-md">Penalización</h3>
            <div className="display-lg text-tertiary">
              {penalizacion.toFixed(2)} €
            </div>
          </div>

          <div className="result-card">
            <h3 className="title-md">Ganancia Neta</h3>
            <div className="display-lg text-primary-fixed-dim">
              {Math.max(0, gananciaTotal - penalizacion).toLocaleString('es-ES')} €
            </div>
          </div>
        </div>
      </div>

      <div className="amortizacion-chart">
        <h2 className="headline-md">Comparativa de Tasas</h2>
        <div className="chart-container">
          <div className="comparison-bar">
            <div
              className="bar-segment"
              style={{
                width: `${(penalizacion / (gananciaTotal + penalizacion)) * 100}%`,
                background: 'var(--tertiary)'
              }}
            />
          </div>
          <div className="comparison-labels">
            <span>Penalización: {penalizacion.toFixed(2)} €</span>
            <span>Ganancia: {gananciaTotal.toLocaleString('es-ES')} €</span>
            <span>Neto: {Math.max(0, gananciaTotal - penalizacion).toLocaleString('es-ES')} €</span>
          </div>
        </div>
      </div>

      <div className="amortizacion-info">
        <h2 className="headline-md">Consideraciones</h2>
        <div className="info-list">
          <div className="info-item">
            <strong>📊 Ahorro en Intereses:</strong> Al reducir el capital pendiente, pagas menos intereses mensuales.
          </div>
          <div className="info-item">
            <strong>⏱️ Reducción de Plazo:</strong> Podrás pagar tu hipoteca antes sin pagar más intereses.
          </div>
          <div className="info-item">
            <strong>⚠️ Penalización:</strong> Revisa las condiciones de tu contrato. Algunas tienen penalización por amortización.
          </div>
          <div className="info-item">
            <strong>💰 Fuente de Fondos:</strong> Usa ganancias de inversión o ahorros, no deuda para amortizar.
          </div>
        </div>
      </div>
    </div>
  )
}

export default AmortizacionAnticipada
