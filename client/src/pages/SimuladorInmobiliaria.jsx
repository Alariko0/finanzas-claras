import { useState } from 'react'
import './SimuladorInmobiliaria.css'

/**
 * Página: Simulador Inversión Inmobiliaria
 * Cálculo de ROI y rentabilidad de propiedades
 */

const SimuladorInmobiliaria = () => {
  const [precioCompra, setPrecioCompra] = useState(250000)
  const [precioVentaEstimado, setPrecioVentaEstimado] = useState(280000)
  const [precioAlquilerMensual, setPrecioAlquilerMensual] = useState(1800)
  const [gastosMantenimientoMensual, setGastosMantenimientoMensual] = useState(300)
  const [impuestosAnuales, setImpuestosAnuales] = useState(2500)
  const [comisionAgencia, setComisionAgencia] = useState(5000)

  // Cálculo de métricas
  const gastosAnuales = gastosMantenimientoMensual * 12 + impuestosAnuales
  const ingresosAnuales = precioAlquilerMensual * 12 - gastosAnuales - comisionAgencia
  const roiAnual = ((ingresosAnuales / precioCompra) * 100).toFixed(2)
  const ratioRent = (precioAlquilerMensual / precioCompra) * 12 * 100
  const yearsToBreakeven = Math.max(1, Math.round((precioCompra - 50000) / ingresosAnuales))
  const capitalGanado = precioVentaEstimado - precioCompra
  const porcentajeGanancia = ((capitalGanado / precioCompra) * 100).toFixed(1)

  return (
    <div className="inmobiliaria-page">
      <div className="page-header">
        <h1>Simulador de Inversión Inmobiliaria</h1>
        <p className="page-subtitle">
          Analiza la rentabilidad de una propiedad de inversión
        </p>
      </div>

      <div className="inmobiliaria-inputs">
        <div className="input-group">
          <label htmlFor="precioCompra" className="label-sm">Precio de Compra</label>
          <input
            id="precioCompra"
            type="range"
            min="100000"
            max="1000000"
            step="5000"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{precioCompra.toLocaleString('es-ES')} €</span>
        </div>

        <div className="input-group">
          <label htmlFor="precioVenta" className="label-sm">Precio de Venta Estimado</label>
          <input
            id="precioVenta"
            type="range"
            min="precioCompra"
            max="precioCompra + 200000"
            step="5000"
            value={precioVentaEstimado}
            onChange={(e) => setPrecioVentaEstimado(parseInt(e.target.value))}
            className="input-range"
          />
          <span className="input-value">{precioVentaEstimado.toLocaleString('es-ES')} €</span>
        </div>

        <div className="input-group">
          <label htmlFor="alquiler" className="label-sm">Alquiler Mensual</label>
          <input
            id="alquiler"
            type="number"
            value={precioAlquilerMensual}
            onChange={(e) => setPrecioAlquilerMensual(parseInt(e.target.value))}
            className="input-field"
            min={Math.round(precioCompra / 20)}
            max={Math.round(precioCompra * 0.02)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="mantenimiento" className="label-sm">Gastos de Mantenimiento Mensuales</label>
          <input
            id="mantenimiento"
            type="number"
            value={gastosMantenimientoMensual}
            onChange={(e) => setGastosMantenimientoMensual(parseInt(e.target.value))}
            className="input-field"
            min="0"
            max="2000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="impuestos" className="label-sm">Impuestos Anuales</label>
          <input
            id="impuestos"
            type="number"
            value={impuestosAnuales}
            onChange={(e) => setImpuestosAnuales(parseInt(e.target.value))}
            className="input-field"
            min="0"
            max="10000"
          />
        </div>
      </div>

      <div className="inmobiliaria-result">
        <div className="result-card surface-container-lowest">
          <h2 className="title-md text-primary">Rentabilidad Anual (ROI)</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">ROI Anual</span>
            <span className="display-lg">{roiAnual}%</span>
          </div>
        </div>

        <div className="result-row">
          <span>Rent Ratio</span>
          <span>{ratioRent.toFixed(1)}%</span>
        </div>
        <div className="result-row">
          <span>Años hasta Pagar la Propiedad</span>
          <span>{yearsToBreakeven} años</span>
        </div>
        <div className="result-row">
          <span>Ganancia de Capital Estimada</span>
          <span className={capitalGanado >= 0 ? 'text-success' : 'text-tertiary'}>
            {capitalGanado >= 0 ? '+' : ''}{capitalGanado.toLocaleString('es-ES')} € ({porcentajeGanancia}%)
          </span>
        </div>
        <div className="result-row highlight">
          <span>Flujo de Caja Anual</span>
          <span className="text-primary">{ingresosAnuales.toLocaleString('es-ES')} €</span>
        </div>
      </div>

      <div className="inmobiliaria-metrics">
        <h2 className="headline-md">Métricas Financieras</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Cap Rate</span>
            <span className="metric-value">
              {Math.round(((precioAlquilerMensual * 12 - gastosAnuales) / precioCompra) * 100, 1)}%
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Cash on Cash</span>
            <span className="metric-value">
              {Math.round(((ingresosAnuales - 50000) / (precioCompra - 50000)) * 100, 1)}%
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">DSCR</span>
            <span className="metric-value">
              {((precioAlquilerMensual * 12) / gastosAnuales).toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      <div className="inmobiliaria-scenario">
        <h2 className="headline-md">Escenarios</h2>
        <div className="scenario-grid">
          <div className="scenario-card">
            <h3 className="title-md">Optimista</h3>
            <p className="scenario-desc">+15% valor, +20% alquiler</p>
            <span className="scenario-value">{Math.round((precioVentaEstimado * 1.15) - precioCompra)} € ganancia</span>
          </div>

          <div className="scenario-card">
            <h3 className="title-md">Realista</h3>
            <p className="scenario-desc">+5% valor, +5% alquiler</p>
            <span className="scenario-value">{Math.round((precioVentaEstimado * 1.05) - precioCompra)} € ganancia</span>
          </div>

          <div className="scenario-card">
            <h3 className="title-md">Pesimista</h3>
            <p className="scenario-desc">-5% valor, -10% alquiler</p>
            <span className="scenario-value">{Math.round((precioVentaEstimado * 0.95) - precioCompra)} € ganancia</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimuladorInmobiliaria
