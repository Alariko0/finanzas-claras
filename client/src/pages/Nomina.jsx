import { useState } from 'react'
import './Nomina.css'

/**
 * Página: Calculadora de Nómina
 * Desglose visual de retenciones y Seguridad Social 2025
 *
 * Base mínima 2025: 1.265,50€
 * Base máxima 2025: 100.000€
 */

const Nomina = () => {
  const [salario, setSalario] = useState(2000)
  const [convenio, setConvenio] = useState('General')
  const [estadoCivil, setEstadoCivil] = useState('soltero')

  // Cotización a cargo del trabajador (2025)
  const calcularCua = (salario) => {
    const base = Math.min(salario, 33255)
    const cuota = Math.floor(base * 0.0345)
    return cuota
  }

  // Cotización empresa
  const calcularCea = (salario) => {
    const base = Math.min(salario, 33255)
    const cuota = Math.floor(base * 0.047)
    return cuota
  }

  // Cálculo aproximado de IRPF
  const calcularRetencionIrf = (salario) => {
    // Simplificación: 10-15% del salario bruto
    const porcentaje = estadoCivil === 'soltero' ? 15 : 10
    const retencion = salario * (porcentaje / 100)
    return retencion
  }

  const cua = calcularCua(salario)
  const cea = calcularCea(salario)
  const retencionIrf = calcularRetencionIrf(salario)
  const totalRetenciones = cua + cea + retencionIrf
  const neto = salario - totalRetenciones

  return (
    <div className="nomina-page">
      <div className="page-header">
        <h1>Calculadora de Nómina 2025</h1>
        <p className="page-subtitle">
          Desglose visual de retenciones y Seguridad Social
        </p>
      </div>

      <div className="nomina-inputs">
        <div className="input-group">
          <label htmlFor="salario">Salario Bruto Mensual (€)</label>
          <input
            id="salario"
            type="number"
            value={salario}
            onChange={(e) => setSalario(parseInt(e.target.value) || 0)}
            className="input-field"
            min="0"
            max="200000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="convenio">Convenio Colectivo</label>
          <select
            id="convenio"
            value={convenio}
            onChange={(e) => setConvenio(e.target.value)}
            className="input-field"
          >
            <option value="General">General</option>
            <option value="Metalurgia">Metalurgia</option>
            <option value="Comercio">Comercio</option>
            <option value="Osteópatas">Osteópatas</option>
            <option value="Enfermería">Enfermería</option>
            <option value="Abogados">Abogados</option>
            <option value="Médicos">Médicos</option>
            <option value="Arquitectos">Arquitectos</option>
            <option value="Docentes">Docentes</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="estado">Estado Civil</label>
          <select
            id="estado"
            value={estadoCivil}
            onChange={(e) => setEstadoCivil(e.target.value)}
            className="input-field"
          >
            <option value="soltero">Soltero/a</option>
            <option value="casado">Casado/a</option>
            <option value="divorciado">Divorciado/a</option>
            <option value="viudo">Viudo/a</option>
          </select>
        </div>
      </div>

      <div className="nomina-result">
        <div className="result-row">
          <div className="result-label">Salario Bruto</div>
          <div className="result-value">{salario.toLocaleString('es-ES')} €</div>
        </div>

        <div className="result-row">
          <div className="result-label">Seguridad Social</div>
          <div className="result-row-desc">
            <span className="text-secondary">CTA:</span> {cua}€ + <span className="text-secondary">CEA:</span> {cea}€ = <strong>{totalRetenciones - retencionIrf}€</strong>
          </div>
        </div>

        <div className="result-row">
          <div className="result-label">Retenciones IRPF</div>
          <div className="result-row-desc">
            <span className="text-secondary">{estadoCivil === 'soltero' ? 'Soltero/a' : 'Casado/a'}:</span> {retencionIrf.toFixed(2)}€
          </div>
        </div>

        <div className="result-row">
          <div className="result-label">Total a Retener</div>
          <div className="result-value text-tertiary">
            -{totalRetenciones.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €
          </div>
        </div>

        <div className="result-row highlight">
          <div className="result-label">Neto a Perceber</div>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Salario Neto</span>
            <span className="display-lg">{neto.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</span>
          </div>
        </div>
      </div>

      <div className="nomina-chart">
        <div className="chart-container">
          <div className="chart-section">
            <h3 className="headline-sm">Composición del Salario</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(cua / salario) * 100}%`,
                  backgroundColor: 'var(--primary)'
                }}
              />
            </div>
            <div className="progress-label">
              <span className="text-primary">Cua ({cua}€)</span>
            </div>
          </div>

          <div className="chart-section">
            <h3 className="headline-sm">Retenciones IRPF</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(retencionIrf / salario) * 100}%`,
                  backgroundColor: 'var(--tertiary)'
                }}
              />
            </div>
            <div className="progress-label">
              <span className="text-tertiary">{retencionIrf.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Nomina
