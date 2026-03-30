/**
 * Nomina.jsx - Calculadora de nómina 2025
 * Desglose visual de retenciones y Seguridad Social
 *
 * Reglas IRPF 2025:
 * - Base liquidable = Salario - reducciones
 * - Reducciones: 5.550€ personal + 2.400€ por hijo
 * - Tramos estatales: 9.5%-24.5%
 * - Tramos autonómicos: 11%-47% (varía por comunidad)
 *
 * @see ../utils/calcularIRPF.js - Funciones de cálculo IRPF exactas
 */
'use client'

import { useState } from 'react'
import { calcularIRPF } from '../utils/calcularIRPF'
import './Nomina.css'

/**
 * Página: Calculadora de Nómina
 * Desglose visual de retenciones y Seguridad Social 2025
 */

const Nomina = () => {
  const [salarioMensual, setSalarioMensual] = useState(2000)
  const [convenio, setConvenio] = useState('General')
  const [estadoCivil, setEstadoCivil] = useState('soltero')
  const [hijos, setHijos] = useState(0)
  const [comunidad, setComunidad] = useState('Otras') // Opciones: 'Castilla y León', 'Andalucía', etc.
  const [haciendaRetencion, setHaciendaRetencion] = useState(15) // % retención estimada

  // Cálculo IRPF usando función utilitaria con tramos exactos 2025
  const calcularIRPF2025 = () => {
    const salarioAnual = salarioMensual * 12
    const resultado = calcularIRPF({
      salarioBruto: salarioAnual,
      comunidad: comunidad === 'Otras' ? 'Otras' : comunidad,
      hijos,
      conyugeDependiente: estadoCivil === 'casado'
    })
    return resultado
  }

  const resultadoIRPF = calcularIRPF2025()

  // Cálculo de Seguridad Social (2025)
  const calcularCua = (salario) => {
    const base = Math.min(salario, 3608) // Límite cotización 2025
    return Math.floor(base * 0.0635)
  }

  // Cotización empresa (aproximada - incluye formación, riesgos, etc.)
  const calcularCea = (salario) => {
    const base = Math.min(salario, 3608)
    return Math.floor(base * 0.0664) // Aprox. 6.64% empresa
  }

  // Cálculo aproximado de retención IRPF basada en resultado IRPF
  const calcularRetencionIrf = () => {
    const retencionBase = resultadoIRPF.cuotaLiquida / 12
    return retencionBase * (haciendaRetencion / 100)
  }

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
          <div className="result-label">Salario Bruto Anual</div>
          <div className="result-value">{(salarioMensual * 12).toLocaleString('es-ES')} €</div>
        </div>

        <div className="result-row">
          <div className="result-label">Seguridad Social (Trabajador)</div>
          <div className="result-row-desc">
            <span className="text-secondary">Cua:</span> {calcularCua(salarioMensual)}€
          </div>
        </div>

        <div className="result-row">
          <div className="result-label">Cotización Empresa</div>
          <div className="result-row-desc">
            <span className="text-secondary">Cea:</span> {calcularCea(salarioMensual)}€
          </div>
        </div>

        <div className="result-row">
          <div className="result-label">Base IRPF</div>
          <div className="result-row-desc">
            <span className="text-secondary">Ahorro personal:</span> {resultadoIRPF.reducciones}€
          </div>
        </div>

        <div className="result-row">
          <div className="result-label">Retenciones IRPF</div>
          <div className="result-row-desc">
            <span className="text-secondary">{estadoCivil} - {hijos} hijos:</span> {calcularRetencionIrf().toFixed(2)}€
          </div>
        </div>

        <div className="result-row">
          <div className="result-label">Neto por calcular</div>
          <div className="result-row-desc">
            <span className="text-secondary">Cuota líquida mensual:</span> {resultadoIRPF.netoMensual}€
          </div>
        </div>

        <div className="result-row highlight">
          <div className="result-label">Neto A Perceber (estimado)</div>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Salario Neto</span>
            <span className="display-lg">{(resultadoIRPF.netoMensual - calcularRetencionIrf()).toFixed(2)} €</span>
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
