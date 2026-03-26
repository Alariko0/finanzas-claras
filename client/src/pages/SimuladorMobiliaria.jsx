import { useState } from 'react'
import './SimuladorMobiliaria.css'

/**
 * Página: Simulador Inversión Mobiliaria
 * Cálculo de rentabilidad por tramos 2025
 */

const SimuladorMobiliaria = () => {
  const [rendaMensual, setRendaMensual] = useState(3500)
  const [inversionInicial, setInversionInicial] = useState(15000)
  const [aportacionPropia, setAportacionPropia] = useState(10000)
  const [tipoFinanciacion, setTipoFinanciacion] = useState('banco')

  const [tramos, setTramos] = useState([
    { id: 0, rango: '0% - 10%', beneficio: 0, descripcion: 'No hay fiscalidad sobre plusvalías' },
    { id: 1, rango: '10% - 20%', beneficio: 1900, descripcion: 'Tipo reduccion 19%' },
    { id: 2, rango: '20% - 30%', beneficio: 2800, descripcion: 'Tipo reduccion 27%' },
    { id: 3, rango: '30% - 50%', beneficio: 3500, descripcion: 'Tipo reduccion 31%' },
    { id: 4, rango: '50% - 80%', beneficio: 4200, descripcion: 'Tipo reduccion 33%' },
    { id: 5, rango: '80% +', beneficio: 5500, descripcion: 'Tipo reduccion 35%+' }
  ])

  const tramoActual = Array.from(tramos).reverse().find(t => inversionInicial * (t.beneficio || 10) >= 0) || tramos[0]
  const porcentajeGanancia = ((inversionInicial * 0.15) / aportacionPropia * 100).toFixed(1)

  // Cálculo estimado de rentabilidad
  const gananciaEstimada = (inversionInicial * 0.12).toFixed(2)
  const ratioRentabilidad = ((inversionInicial * 0.08) / aportacionPropia * 100).toFixed(1)

  return (
    <div className="mobiliaria-page">
      <div className="page-header">
        <h1>Simulador Inversión Mobiliaria</h1>
        <p className="page-subtitle">
          Cálculo de rentabilidad por tramos 2025
        </p>
      </div>

      <div className="mobiliaria-inputs">
        <div className="input-group">
          <label htmlFor="inversionInicial" className="label-sm">Inversión Inicial</label>
          <input
            id="inversionInicial"
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={inversionInicial}
            onChange={(e) => setInversionInicial(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{inversionInicial.toLocaleString('es-ES')} €</span>
        </div>

        <div className="input-group">
          <label htmlFor="renda" className="label-sm">Renda Mensual</label>
          <input
            id="renda"
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={rendaMensual}
            onChange={(e) => setRendaMensual(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{rendaMensual} €</span>
        </div>

        <div className="input-group">
          <label htmlFor="aportacion" className="label-sm">Aportación Propia</label>
          <input
            id="aportacion"
            type="range"
            min="1000"
            max={inversionInicial}
            step="100"
            value={aportacionPropia}
            onChange={(e) => setAportacionPropia(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{aportacionPropia} €</span>
        </div>
      </div>

      <div className="mobiliaria-tramos">
        <h2 className="headline-md">Tramos de Ganancia Capital (2025)</h2>
        <div className="tramos-container">
          {tramos.map((tramo) => (
            <div
              key={tramo.id}
              className={`tramo-card ${tramo.id === tramoActual.id ? 'active' : ''}`}
            >
              <div className="tramo-header">
                <span className="tramo-rango">{tramo.rango} del Plusvalor</span>
                <span className={`tramo-beneficio ${tramo.id === tramoActual.id ? 'text-primary-fixed-dim' : ''}`}>
                  Beneficio Estimado: {tramo.beneficio} €
                </span>
              </div>
              <div className="tramo-desc">{tramo.descripcion}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mobiliaria-result">
        <div className="result-card surface-container-lowest">
          <h2 className="title-md text-primary">Tu Tramo</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Inversión Total: {inversionInicial} €</span>
            <span className="display-lg">Rendimiento: {gananciaEstimada} €</span>
          </div>
        </div>

        <div className="result-row">
          <span>Ratio de Apalancamiento</span>
          <span>{((inversionInicial - aportacionPropia) / aportacionPropia * 100).toFixed(1)}%</span>
        </div>
        <div className="result-row">
          <span>Rentabilidad Estimada</span>
          <span className="text-primary">{gananciaEstimada} €/año</span>
        </div>
        <div className="result-row">
          <span>Coste de Oportunidad</span>
          <span>{Math.round(aportacionPropia * 0.05)} € (tipo banco)</span>
        </div>
        <div className="result-row highlight">
          <span>Beneficio Neto Estimado</span>
          <span className="text-primary-fixed-dim">
            {Math.round((inversionInicial * 0.12 - aportacionPropia * 0.05)).toLocaleString('es-ES')} €
          </span>
        </div>
      </div>

      <div className="mobiliaria-consejos">
        <h2 className="headline-md">Consejos para Optimizar</h2>
        <div className="consejos-list">
          <div className="consejo-item">
            <span className="consejo-icon">📊</span>
            <span>Mantén el ratio de apalancamiento por debajo del 60% para controlar el riesgo.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon">⚖️</span>
            <span>El objetivo es llegar al tramo 31% (30-50%), donde el beneficio es óptimo.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon">🔄</span>
            <span>Recicla plusvalías entre activos para mantener el equilibrio fiscal.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon">📈</span>
            <span>Busca propiedades con plusvalía mínima del 12% anual para superar el coste bancario.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimuladorMobiliaria
