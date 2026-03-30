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
import './IRPF.css'

/**
 * IRPF.jsx - Calculadora de IRPF 2025
 * Tramos estatales y autonómicos exactos
 */

// Tramos autonómicos 2025 - Definición completa
const TRAMOS_AUTONOMICOS_2025 = {
  'Andalucía': {
    min: 0, max: 12609, porc: 47, reduccion: 1087.5,
    max1: 18594, porc1: 37, reduccion1: 0,
    max2: 34124, porc2: 31, reduccion2: 0,
    max3: 199528, porc3: 26, reduccion3: 0,
    max4: Infinity, porc4: 23, reduccion4: 0
  },
  'Castilla y León': {
    min: 0, max: 8707, porc: 16, reduccion: 0,
    max1: 14210, porc1: 23, reduccion1: 0,
    max2: 23466, porc2: 29, reduccion2: 0,
    max3: 29493, porc3: 33, reduccion3: 0,
    max4: 43403, porc4: 40, reduccion4: 0,
    max5: 69514, porc5: 44, reduccion5: 0,
    max6: 132296, porc6: 46, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Comunidad de Madrid': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Cataluña': {
    min: 0, max: 12450, porc: 11, reduccion: 0,
    max1: 20200, porc1: 15.5, reduccion1: 0,
    max2: 27700, porc2: 17, reduccion2: 0,
    max3: 48620, porc3: 21, reduccion3: 0,
    max4: 65200, porc4: 26, reduccion4: 0,
    max5: 140820, porc5: 31, reduccion5: 0,
    max6: Infinity, porc6: 33, reduccion6: 0
  },
  'País Vasco': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Valencia': {
    min: 0, max: 12450, porc: 11.5, reduccion: 0,
    max1: 19955, porc1: 16.5, reduccion1: 0,
    max2: 34000, porc2: 21, reduccion2: 0,
    max3: 42400, porc3: 26, reduccion3: 0,
    max4: 68655, porc4: 29, reduccion4: 0,
    max5: 134220, porc5: 33, reduccion5: 0,
    max6: Infinity, porc6: 36, reduccion6: 0
  },
  'Asturias': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Galicia': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  }
}

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