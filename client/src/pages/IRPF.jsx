/**
 * IRPF.jsx - Calculadora de IRPF 2025
 * Tramos estatales y autonómicos exactos 2025
 *
 * @example
 * npm run dev
 *
 * @see ../utils/calcularIRPF.js - Funciones de cálculo IRPF
 */
'use client'

import { useState } from 'react'
import { calcularIRPF as calcularIRPFUtils } from '../utils/calcularIRPF'
import { TRAMOS_AUTONOMICOS_2025 } from '../utils/calcularIRPF'
import './IRPF.css'

/**
 * IRPF.jsx - Calculadora de IRPF 2025
 * Tramos estatales y autonómicos exactos
 */

const IRPF = () => {
  const [rendimientoAnual, setRendimientoAnual] = useState(25000)
  const [comunidad, setComunidad] = useState('Castilla y León')

  // Obtener resultado de cálculo usando utilidad
  const resultado = calcularIRPFUtils({
    salarioBruto: rendimientoAnual,
    comunidad,
    hijos: 0,
    conyugeDependiente: false
  })

  // Definir variable tramos para el select
  const tramos = TRAMOS_AUTONOMICOS_2025

  return (
    <div className="irpf-page">
      <div className="page-header">
        <h1>Calculadora IRPF 2025</h1>
        <p className="page-subtitle">
          Cálculo de impuestos estatales y autonómicos con tramos exactos
        </p>
      </div>

      <div className="irpf-inputs">
        <div className="input-group">
          <label htmlFor="rendimientoAnual">Rendimiento Anual (€)</label>
          <input
            id="rendimientoAnual"
            type="number"
            value={rendimientoAnual}
            onChange={(e) => setRendimientoAnual(parseInt(e.target.value) || 0)}
            className="input-field"
            min="0"
            max="1500000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="comunidad">Comunidad Autónoma</label>
          <select
            id="comunidad"
            value={comunidad}
            onChange={(e) => setComunidad(e.target.value)}
            className="input-field"
          >
            {Object.keys(tramos).map((com) => (
              <option key={com} value={com}>{com}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="irpf-results">
        <div className="result-card surface-container-lowest">
          <h2 className="title-md text-primary">Cuota Líquida IRPF 2025</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Cuota anual a pagar</span>
            <span className="display-lg">{resultado.cuotaLiquida.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="result-card surface-container-low">
          <h3 className="headline-sm">Desglose</h3>
          <div className="result-row">
            <span className="result-label">Salario Bruto</span>
            <span className="result-value">{resultado.salarioBruto.toLocaleString('es-ES')} €</span>
          </div>
          <div className="result-row">
            <span className="result-label">Base Liquidable</span>
            <span className="result-value">{resultado.baseLiquidable.toLocaleString('es-ES')} €</span>
          </div>
          <div className="result-row">
            <span className="result-label">Impuesto Estatal</span>
            <span className="result-value">{resultado.impuestoEstatal.toLocaleString('es-ES')} €</span>
          </div>
          {resultado.impuestoAutonomico > 0 && (
            <div className="result-row">
              <span className="result-label">Impuesto Autonómico</span>
              <span className="result-value">{resultado.impuestoAutonomico.toLocaleString('es-ES')} €</span>
            </div>
          )}
          <div className="result-row highlight">
            <span className="result-label">Reducciones Totales</span>
            <span className="result-value">{resultado.reducciones.toLocaleString('es-ES')} €</span>
          </div>
          <div className="result-row highlight">
            <span className="result-label">Cuota Líquida Total</span>
            <span className="result-value">{resultado.cuotaLiquida.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="irpf-chart">
          <h3>Distribución de Impuesto</h3>
          <div className="chart-container">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color primary"></span>
                <span>Estatal</span>
              </div>
              {resultado.impuestoAutonomico > 0 && (
                <div className="legend-item">
                  <span className="legend-color secondary"></span>
                  <span>Autonómico</span>
                </div>
              )}
            </div>
            <div className="chart-bars">
              <div className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ height: `${(resultado.impuestoEstatal / (resultado.impuestoEstatal + resultado.impuestoAutonomico || 1)) * 150}%` }}
                />
                <span className="bar-label">{resultado.impuestoEstatal.toLocaleString('es-ES')} €</span>
              </div>
              {resultado.impuestoAutonomico > 0 && (
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${(resultado.impuestoAutonomico / (resultado.impuestoEstatal + resultado.impuestoAutonomico)) * 150}%` }}
                  />
                  <span className="bar-label">{resultado.impuestoAutonomico.toLocaleString('es-ES')} €</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="irpf-table">
        <h3>Detalle por Tramos</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rango</th>
              <th>Base (€)</th>
              <th>%</th>
              <th>Impuesto (€)</th>
            </tr>
          </thead>
          <tbody>
            {resultado.tramosCalculados.map((tramo, idx) => (
              <tr key={idx}>
                <td>{tramo.rango}</td>
                <td>{tramo.base.toLocaleString('es-ES')}</td>
                <td>{tramo.porc}%</td>
                <td>{tramo.impuesto.toLocaleString('es-ES')} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IRPF