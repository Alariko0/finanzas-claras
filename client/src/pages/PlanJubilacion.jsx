import { useState } from 'react'
import './PlanJubilacion.css'

/**
 * PlanJubilacion - Proyección de jubilación
 * Inputs: edad actual, edad jubilación, ahorro actual, aportación mensual, rentabilidad
 */

const PlanJubilacion = () => {
  const [edadActual, setEdadActual] = useState(35)
  const [edadJubilacion, setEdadJubilacion] = useState(67)
  const [ahorroActual, setAhorroActual] = useState(10000)
  const [aportacionMensual, setAportacionMensual] = useState(500)
  const [rentabilidad, setRentabilidad] = useState(6) // % anual

  // Cálculo con interés compuesto
  const calcularJubilacion = () => {
    const anosHastaJubilacion = edadJubilacion - edadActual
    const factorRentabilidad = 1 + rentabilidad / 100
    const aportacionAnual = aportacionMensual * 12

    // Fórmula de interés compuesto para anualidades
    const capitalAcumulado = ahorroActual * Math.pow(factorRentabilidad, anosHastaJubilacion) +
      (aportacionAnual * (Math.pow(factorRentabilidad, anosHastaJubilacion) - 1)) /
      (factorRentabilidad - 1)

    // Renta mensual estimada al 4% de extracción
    const rentaMensual = (capitalAcumulado * (rentabilidad / 100 / 12)) / 1.04

    const anosCobertura = rentaMensual > 0 ? 25 : 0 // Estimación estándar

    return { capitalAcumulado, rentaMensual, anosCobertura }
  }

  const resultado = calcularJubilacion()

  return (
    <div className="plan-jubilacion-page">
      <div className="page-header">
        <h1>Plan de Jubilación</h1>
        <p className="page-subtitle">
          Proyecta tu capital al jubilarte y tu renta mensual
        </p>
      </div>

      <div className="plan-jubilacion-inputs">
        <div className="input-group">
          <label htmlFor="edadActual">Edad Actual</label>
          <input
            id="edadActual"
            type="number"
            value={edadActual}
            onChange={(e) => setEdadActual(parseInt(e.target.value) || 0)}
            className="input-field"
            min="18"
            max={edadJubilacion - 1}
          />
        </div>

        <div className="input-group">
          <label htmlFor="edadJubilacion">Edad Jubilación</label>
          <input
            id="edadJubilacion"
            type="number"
            value={edadJubilacion}
            onChange={(e) => setEdadJubilacion(parseInt(e.target.value) || 0)}
            className="input-field"
            min={edadActual + 1}
            max="100"
          />
        </div>

        <div className="input-group">
          <label htmlFor="ahorroActual">Ahorro Actual (€)</label>
          <input
            id="ahorroActual"
            type="number"
            value={ahorroActual}
            onChange={(e) => setAhorroActual(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label htmlFor="aportacionMensual">Aportación Mensual (€)</label>
          <input
            id="aportacionMensual"
            type="number"
            value={aportacionMensual}
            onChange={(e) => setAportacionMensual(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label htmlFor="rentabilidad">Rentabilidad Esperada (% anual)</label>
          <input
            id="rentabilidad"
            type="number"
            value={rentabilidad}
            onChange={(e) => setRentabilidad(parseFloat(e.target.value) || 0)}
            className="input-field"
            min="1"
            max="20"
          />
        </div>
      </div>

      <div className="plan-jubilation-results">
        <div className="result-card surface-container-lowest">
          <h2 className="title-md text-primary">Capital Acumulado</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Al jubilarte</span>
            <span className="display-lg">{Math.round(resultado.capitalAcumulado).toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="result-card surface-container-low">
          <h3 className="headline-sm">Renta Mensual Estimada</h3>
          <div className="balance-totem">
            <span className="label-sm">Con retiro del 4%</span>
            <span className="display-lg">{Math.round(resultado.rentaMensual).toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="result-card surface-container-variant">
          <h3 className="headline-sm">Años de Cobertura</h3>
          <div className="balance-totem">
            <span className="label-sm">Estimación estándar</span>
            <span className="display-lg">{resultado.anosCobertura} años</span>
          </div>
        </div>
      </div>

      <div className="projection-chart">
        {/* Simulación de gráfico CSS */}
        <div className="chart-bar" style={{ height: `${Math.min(200, (resultado.capitalAcumulado / 500000) * 200)}px` }} />
      </div>

      <div className="coverage-info">
        <h3>Explicación</h3>
        <p>
          Tu capital acumulado proyecta a {Math.round(resultado.capitalAcumulado).toLocaleString('es-ES')} €
          basándose en {edadJubilacion - edadActual} años de crecimiento con rentabilidad del {rentabilidad}%.
        </p>
        <p>
          La renta mensual estimada de {Math.round(resultado.rentaMensual).toLocaleString('es-ES')} €
          asume un retiro del 4% anual (estrategia conservadora para preservar el capital).
        </p>
        <p>
          <strong>Consejo:</strong> Aumentar tu aportación mensual por 100€ puede incrementar
          tu capital al jubilarte en más de 300€ debido al efecto del interés compuesto.
        </p>
      </div>
    </div>
  )
}

export default PlanJubilacion
