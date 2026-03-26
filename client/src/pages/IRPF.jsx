import { useState } from 'react'
import './IRPF.css'

/**
 * Página: Cálculo IRPF 2025
 * Basado en: Lógica Fiscal IRPF 2025 (Screen ID: 33cc47e86ad1470e8c2d050153c995c7)
 *
 * Tramos IRPF para las comunidades sin impuesto autonómico (Castilla y León, País Vasco, Madrid, Murcia, Asturias):
 * - Hasta 11.955€: 19%
 * - De 11.955€ a 18.922€: 27%
 * - De 18.922€ a 30.093€: 31%
 * - De 30.093€ a 35.000€: 33%
 * - De 35.000€ a 48.490€: 35%
 * - De 48.490€ a 79.681€: 42%
 * - De 79.681€ a 136.500€: 44%
 * - Más de 136.500€: 47%
 */

const IRPF = () => {
  const [rendimientoAnual, setRendimientoAnual] = useState(25000)
  const [comunidad, setComunidad] = useState('Castilla y León')

  // Configuración de tramos para comunidades con IRPF
  const tramos = {
    'Andalucía': {
      0: { max: 12609, porc: 47, reduccion: 10875 },
      12609: { max: 18594, porc: 37, reduccion: 0 },
      18594: { max: 34124, porc: 31, reduccion: 0 },
      34124: { max: 199528, porc: 26, reduccion: 0 },
      199528: { porc: 23, reduccion: 0 }
    },
    'Castilla y León': {
      0: { max: 11955, porc: 19, reduccion: 0 },
      11955: { max: 18922, porc: 27, reduccion: 0 },
      18922: { max: 30093, porc: 31, reduccion: 0 },
      30093: { max: 35000, porc: 33, reduccion: 0 },
      35000: { max: 48490, porc: 35, reduccion: 0 },
      48490: { max: 79681, porc: 42, reduccion: 0 },
      79681: { max: 136500, porc: 44, reduccion: 0 },
      136500: { porc: 47, reduccion: 0 }
    },
    'País Vasco': {
      0: { max: 11955, porc: 19, reduccion: 0 },
      11955: { max: 18922, porc: 27, reduccion: 0 },
      18922: { max: 30093, porc: 31, reduccion: 0 },
      30093: { max: 35000, porc: 33, reduccion: 0 },
      35000: { max: 48490, porc: 35, reduccion: 0 },
      48490: { max: 79681, porc: 42, reduccion: 0 },
      79681: { max: 136500, porc: 44, reduccion: 0 },
      136500: { porc: 47, reduccion: 0 }
    },
    'Comunidad de Madrid': {
      0: { max: 11955, porc: 19, reduccion: 0 },
      11955: { max: 18922, porc: 27, reduccion: 0 },
      18922: { max: 30093, porc: 31, reduccion: 0 },
      30093: { max: 35000, porc: 33, reduccion: 0 },
      35000: { max: 48490, porc: 35, reduccion: 0 },
      48490: { max: 79681, porc: 42, reduccion: 0 },
      79681: { max: 136500, porc: 44, reduccion: 0 },
      136500: { porc: 47, reduccion: 0 }
    },
    'Murcia': {
      0: { max: 11955, porc: 19, reduccion: 0 },
      11955: { max: 18922, porc: 27, reduccion: 0 },
      18922: { max: 30093, porc: 31, reduccion: 0 },
      30093: { max: 35000, porc: 33, reduccion: 0 },
      35000: { max: 48490, porc: 35, reduccion: 0 },
      48490: { max: 79681, porc: 42, reduccion: 0 },
      79681: { max: 136500, porc: 44, reduccion: 0 },
      136500: { porc: 47, reduccion: 0 }
    },
    'Asturias': {
      0: { max: 11955, porc: 19, reduccion: 0 },
      11955: { max: 18922, porc: 27, reduccion: 0 },
      18922: { max: 30093, porc: 31, reduccion: 0 },
      30093: { max: 35000, porc: 33, reduccion: 0 },
      35000: { max: 48490, porc: 35, reduccion: 0 },
      48490: { max: 79681, porc: 42, reduccion: 0 },
      79681: { max: 136500, porc: 44, reduccion: 0 },
      136500: { porc: 47, reduccion: 0 }
    }
  }

  // Cálculo del IRPF
  const calcularIRPF = (rendimiento, tramosConfig) => {
    let impuesto = 0
    let rendimientoImpuesto = 0
    let tramoAnterior = 0

    for (const tramoMinimo of Object.keys(tramosConfig)) {
      const tramo = tramosConfig[tramoMinimo]
      const limite = tramo.max ? parseInt(tramo.max) : Infinity

      if (rendimiento > tramoMinimo) {
        const baseImponible = Math.min(rendimiento, limite) - tramoAnterior
        const impuestoTramo = baseImponible * (tramo.porc / 100)
        impuesto += impuestoTramo - tramo.reduccion
        rendimientoImpuesto += baseImponible
        tramoAnterior = limite
      }
    }

    return {
      impuesto,
      rendimientoImpuesto,
      tramosCalculados: Object.keys(tramosConfig).map((tramoMin, idx) => {
        const tramo = tramosConfig[tramoMin]
        const base = Math.max(0, Math.min(rendimiento, tramo.max || Infinity) - (tramoMinimo || 0))
        return {
          rango: `${tramoMinimo} - ${tramo.max || '∞'}`,
          base: Math.round(base),
          porcentaje: tramo.porc,
          impuesto: Math.round(base * tramo.porc / 100) - tramo.reduccion
        }
      })
    }
  }

  const resultado = calcularIRPF(rendimientoAnual, tramos[comunidad] || tramos['Castilla y León'])

  return (
    <div className="irpf-page">
      <div className="page-header">
        <h1>Calculadora IRPF 2025</h1>
        <p className="page-subtitle">
          Cálculo de impuestos para <strong>{comunidad}</strong> (sin impuesto autonómico)
        </p>
      </div>

      <div className="irpf-inputs">
        <div className="input-group">
          <label htmlFor="rendimiento">Rendimiento Anual (€)</label>
          <input
            id="rendimiento"
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
          <h2 className="title-md text-primary">Impuesto a Pagar</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Total IRPF 2025</span>
            <span className="display-lg">{Math.round(resultado.impuesto).toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="result-card surface-container-low">
          <h3 className="headline-sm">Desglose por Tramos</h3>
          <div className="tramos-table">
            <table>
              <thead>
                <tr>
                  <th>Rango</th>
                  <th>Base Imponible</th>
                  <th>%</th>
                  <th>Impuesto</th>
                </tr>
              </thead>
              <tbody>
                {resultado.tramosCalculated.map((tramo, idx) => (
                  <tr key={idx}>
                    <td>{tramo.rango}</td>
                    <td>{tramo.base.toLocaleString('es-ES')} €</td>
                    <td>{tramo.porc}%</td>
                    <td>{tramo.impuesto.toLocaleString('es-ES')} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="irpf-chart">
        {/* Simulación de gráfico CSS */}
        <div className="chart-container">
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color primary"></span>
              <span>Impuesto Estatal</span>
            </div>
            <div className="legend-item">
              <span className="legend-color secondary"></span>
              <span>Impuesto Autonómico</span>
            </div>
          </div>
          <div className="chart-bars">
            {resultado.tramosCalculated.map((tramo, idx) => (
              <div key={idx} className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.min(100, (tramo.impuesto / rendimientoAnual) * 100)}%`,
                    backgroundColor: idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IRPF
