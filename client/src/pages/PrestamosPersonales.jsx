import { useState } from 'react'
import './PrestamosPersonales.css'

/**
 * Página: Préstamos Personales
 * Cálculo de pagos y condiciones para diferentes tipos de préstamos
 */

const PrestamosPersonales = () => {
  const [tipoPrestamo, setTipoPrestamo] = useState('personal')
  const [monto, setMonto] = useState(10000)
  const [tasa, setTasa] = useState(6.5)
  const [plazo, setPlazo] = useState(48)

  const calcularCuota = () => {
    const tasaMensual = tasa / 100 / 12
    const cuota = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo))
    return Math.round(cuota)
  }

  const cuota = calcularCuota()
  const pagosTotales = cuota * plazo
  const interesesTotales = pagosTotales - monto
  const costoEfectivo = ((interesesTotales / monto) * 100).toFixed(1)

  const tiposPrestamo = [
    { id: 'personal', nombre: 'Préstamo Personal', tasaBase: 6.5, minTasa: 5, maxTasa: 12 },
    { id: 'coche', nombre: 'Préstamo para Coche', tasaBase: 5.5, minTasa: 4, maxTasa: 8 },
    { id: 'renovacion', nombre: 'Renovación de Deuda', tasaBase: 6.0, minTasa: 5, maxTasa: 10 },
    { id: 'consumo', nombre: 'Préstamo de Consumo', tasaBase: 7.0, minTasa: 6, maxTasa: 12 }
  ]

  return (
    <div className="prestamos-page">
      <div className="page-header">
        <h1>Préstamos Personales</h1>
        <p className="page-subtitle">
          Compara condiciones y calcula tu pago mensual
        </p>
      </div>

      <div className="prestamos-selectors">
        <div className="selector-group">
          <label htmlFor="tipoPrestamo" className="label-sm">Tipo de Préstamo</label>
          <select
            id="tipoPrestamo"
            value={tipoPrestamo}
            onChange={(e) => {
              setTipoPrestamo(e.target.value)
              const tipo = tiposPrestamo.find(t => t.id === e.target.value)
              setMonto(10000)
              setTasa(tipo.tasaBase)
            }}
            className="input-field"
          >
            {tiposPrestamo.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label htmlFor="monto" className="label-sm">Monto del Préstamo</label>
          <input
            id="monto"
            type="range"
            min="1000"
            max="100000"
            value={monto}
            onChange={(e) => setMonto(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{monto.toLocaleString('es-ES')} €</span>
        </div>

        <div className="selector-group">
          <label htmlFor="tasa" className="label-sm">Tasa de Interés (% anual)</label>
          <input
            id="tasa"
            type="range"
            min={tiposPrestamo.find(t => t.id === tipoPrestamo)?.minTasa || 4}
            max={tiposPrestamo.find(t => t.id === tipoPrestamo)?.maxTasa || 12}
            step="0.1"
            value={tasa}
            onChange={(e) => setTasa(parseFloat(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{tasa}%</span>
        </div>

        <div className="selector-group">
          <label htmlFor="plazo" className="label-sm">Plazo</label>
          <input
            id="plazo"
            type="range"
            min="6"
            max="120"
            step="6"
            value={plazo}
            onChange={(e) => setPlazo(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{plazo} meses ({Math.floor(plazo / 12)} años)</span>
        </div>
      </div>

      <div className="prestamos-result">
        <div className="result-card surface-container-lowest">
          <h2 className="title-md text-primary">Cuota Mensual Estimada</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Cuota Mensual</span>
            <span className="display-lg">{cuota.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="result-cards">
          <div className="result-card">
            <h3 className="title-md">Total a Pagar</h3>
            <span className="display-lg">{pagosTotales.toLocaleString('es-ES')} €</span>
          </div>

          <div className="result-card highlight">
            <h3 className="title-md">Intereses Totales</h3>
            <span className="display-lg text-tertiary">{interesesTotales.toLocaleString('es-ES')} €</span>
          </div>

          <div className="result-card">
            <h3 className="title-md">Costo Efectivo</h3>
            <span className="display-lg">{costoEfectivo}%</span>
          </div>
        </div>
      </div>

      <div className="prestamos-comparativa">
        <h2 className="headline-md">Comparativa de Tipos</h2>
        <div className="comparativa-grid">
          {tiposPrestamo.map((tipo) => {
            const tipoCuota = calcularCuota(tipo.tasaBase, tipo.id === tipoPrestamo ? monto : 10000)
            const tipoIntereses = (tipoCuota * plazo) - 10000

            return (
              <div
                key={tipo.id}
                className="comparativa-card"
                style={{
                  border: tipo.id === tipoPrestamo ? `2px solid var(--primary)` : 'none',
                  background: tipo.id === tipoPrestamo ? 'var(--surface-container-highest)' : 'var(--surface-container)'
                }}
              >
                <div className="comparativa-header">
                  <span className="comparativa-titulo">{tipo.nombre}</span>
                  {tipo.id === tipoPrestamo && <span className="tag">Seleccionado</span>}
                </div>
                <div className="comparativa-info">
                  <div>Tasa: {tipo.tasaBase}%</div>
                  <div>Monto: {10000} €</div>
                  <div>Plazo: {plazo} meses</div>
                </div>
                <div className="comparativa-result">
                  <span>Cuota: {tipoCuota.toLocaleString('es-ES')} €</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="prestamos-info">
        <h2 className="headline-md">Consejos para Reducir Costos</h2>
        <div className="consejos-list">
          <div className="consejo-item">
            <span className="consejo-icon">💡</span>
            <span>Un plazo más largo reduce la cuota mensual, pero aumenta los intereses totales.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon">🏆</span>
            <span>Negocia una tasa inferior: cada 0.5% de descuento puede ahorrarte miles en intereses.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon">📅</span>
            <span>Considera pagos anticipados para reducir el capital pendiente y ahorrar intereses.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon">⚠️</span>
            <span>Evita comisiones por amortización anticipada. Busca productos sin penalización.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrestamosPersonales
