import { useState } from 'react'
import './SimuladorHipotecas.css'

/**
 * Página: Simulador de Hipotecas Pro
 * Cálculo de cuota mensual, TAE y simulador de amortización
 */

const SimuladorHipotecas = () => {
  const [monto, setMonto] = useState(200000)
  const [tasa, setTasa] = useState(3.5)
  const [plazo, setPlazo] = useState(300)
  const [tipoPlazo, setTipoPlazo] = useState('meses')

  // Cálculo de cuota mensual
  const calcularCuota = () => {
    const tasaMensual = tasa / 100 / 12
    const pagosTotales = plazo / 12
    const cuota = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -pagosTotales))
    return Math.round(cuota)
  }

  const cuota = calcularCuota()
  const pagosTotales = cuota * plazo
  const interesesTotales = pagosTotales - monto
  const tae = (tasa + 2.5).toFixed(2) // Simplificado: TAN + comisiones

  // Cálculo de tabla de amortización (primeros 6 pagos + último)
  const amortizacion = (() => {
    const tasaMensual = tasa / 100 / 12
    const cuota = calcularCuota()
    const tabla = []
    let capitalRestante = monto

    for (let i = 1; i <= Math.min(plazo, 6); i++) {
      const interesesMes = capitalRestante * tasaMensual
      const pagoCapital = cuota - interesesMes
      capitalRestante -= pagoCapital
      tabla.push({
        mes: i,
        fecha: `01/${i <= 3 ? (i + 1) % 4 + '00' : '12'}${i <= 6 ? '25' : ''}`,
        cuota,
        intereses: Math.round(interesesMes),
        capital: Math.round(pagoCapital),
        capitalRestante: Math.max(0, Math.round(capitalRestante))
      })
    }

    // Último pago
    if (capitalRestante > 0) {
      const ultimoInteres = capitalRestante * tasaMensual
      tabla.push({
        mes: plazo,
        fecha: `31/${plazo <= 12 ? (plazo % 3 + 1) + '00' : '12'}${plazo <= 60 ? '30' : ''}`,
        cuota,
        intereses: Math.round(ultimoInteres),
        capital: Math.round(cuota - ultimoInteres),
        capitalRestante: 0
      })
    }

    return tabla
  })()

  const progreso = ((plazo - 300) / plazo) * 100 // Simplificado para demo

  return (
    <div className="hipotecas-page">
      <div className="page-header">
        <h1>Simulador de Hipotecas Pro</h1>
        <p className="page-subtitle">
          Calcula tu cuota mensual, TAE y tabla de amortización
        </p>
      </div>

      <div className="hipotecas-grid">
        <div className="hipotecas-inputs">
          <div className="input-group">
            <label htmlFor="monto" className="label-sm">Monto del Préstamo</label>
            <input
              id="monto"
              type="range"
              min="50000"
              max="600000"
              value={monto}
              onChange={(e) => setMonto(parseInt(e.target.value))}
              className="input-range"
            />
            <span className="input-value">{monto.toLocaleString('es-ES')} €</span>
          </div>

          <div className="input-group">
            <label htmlFor="tasa" className="label-sm">Tasa de Interés (%)</label>
            <input
              id="tasa"
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={tasa}
              onChange={(e) => setTasa(parseFloat(e.target.value))}
              className="input-range"
            />
            <span className="input-value">{tasa}%</span>
          </div>

          <div className="input-group">
            <label htmlFor="plazo" className="label-sm">Plazo</label>
            <select
              id="plazo"
              value={tipoPlazo}
              onChange={(e) => setTipoPlazo(e.target.value)}
              className="input-field"
            >
              <option value="meses">Meses</option>
              <option value="anios">Años</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="plazoValue" className="label-sm">Duración</label>
            <input
              id="plazoValue"
              type="number"
              value={tipoPlazo === 'meses' ? plazo : Math.floor(plazo / 12)}
              onChange={(e) => setPlazo(tipoPlazo === 'anios' ? parseInt(e.target.value) * 12 : parseInt(e.target.value))}
              className="input-field"
              min="12"
              max="600"
            />
            <span className="input-subtitle">
              {tipoPlazo === 'anios' ? `(${Math.floor(plazo / 12)} años)` : `${plazo} meses`}
            </span>
          </div>
        </div>

        <div className="hipotecas-result">
          <div className="result-card surface-container-lowest">
            <h2 className="title-md text-primary">Cuota Mensual Estimada</h2>
            <div className="balance-totem text-primary-fixed-dim">
              <span className="label-sm">Cuota Mensual</span>
              <span className="display-lg">{cuota.toLocaleString('es-ES')} €</span>
            </div>
          </div>

          <div className="result-row">
            <span>Tasa Anual</span>
            <span>{tasa}%</span>
          </div>
          <div className="result-row">
            <span>TAE Estimada</span>
            <span>{tae}%</span>
          </div>
          <div className="result-row">
            <span>Total a Pagar</span>
            <span>{pagosTotales.toLocaleString('es-ES')} €</span>
          </div>
          <div className="result-row highlight">
            <span>Intereses Totales</span>
            <span className="text-tertiary">{interesesTotales.toLocaleString('es-ES')} €</span>
          </div>
        </div>
      </div>

      <div className="hipotecas-tabla">
        <h2 className="headline-md">Tabla de Amortización (Primeros 6 meses)</h2>
        <div className="tabla-container">
          <table className="amortizacion-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Fecha</th>
                <th>Cuota</th>
                <th>Intereses</th>
                <th>Capital</th>
                <th>Restante</th>
              </tr>
            </thead>
            <tbody>
              {amortizacion.map((fila, idx) => (
                <tr key={idx}>
                  <td className="mes">{fila.mes}</td>
                  <td className="fecha">{fila.fecha}</td>
                  <td className="cuota">{fila.cuota.toLocaleString('es-ES')} €</td>
                  <td className="intereses">{fila.intereses.toLocaleString('es-ES')} €</td>
                  <td className="capital">{fila.capital.toLocaleString('es-ES')} €</td>
                  <td className="capitalRestante">{fila.capitalRestante.toLocaleString('es-ES')} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hipotecas-chart">
        <h2 className="headline-md">Desglose de Pagos</h2>
        <div className="chart-container">
          <div className="chart-bar">
            <div
              className="bar-fill"
              style={{
                height: `${(monto / (cuota * Math.max(1, plazo))) * 100}%`,
                background: 'var(--primary)'
              }}
            />
          </div>
          <div className="chart-legend">
            <div className="legend-item primary">
              <span className="legend-label">Capital ({Math.round(monto / (cuota * Math.max(1, plazo)) * 100)}%)</span>
            </div>
            <div className="legend-item secondary">
              <span className="legend-label">Intereses ({Math.round(interesesTotales / (cuota * Math.max(1, plazo)) * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimuladorHipotecas
