import { useState } from 'react'
import './PlanPensiones.css'

/**
 * PlanPensiones - Planes de pensiones complementarios
 * Calcula deducción fiscal y capital acumulado
 */

const PlanPensiones = () => {
  const [tipoPlan, setTipoPlan] = useState('individual')
  const [aportacionAnual, setAportacionAnual] = useState(1000)
  const [anosHastaJubilacion, setAnosHastaJubilacion] = useState(30)
  const [rentabilidad, setRentabilidad] = useState(5)
  const [rendimientoAnual, setRendimientoAnual] = useState(20000)

  // Límite fiscal 2025: 1.500€ anuales
  const LIMITE_FISCAL = 1500
  const ahorroFiscal = Math.min(aportacionAnual, LIMITE_FISCAL) * 22.5 / 100

  const calcularPensiones = () => {
    const anos = anosHastaJubilacion
    const factor = 1 + rentabilidad / 100
    const aportacionAnualReal = aportacionAnual

    // Capital acumulado
    const capitalAcumulado = aportacionAnualReal *
      (Math.pow(factor, anos) - 1) / (factor - 1)

    // Prestación estimada (4% anual)
    const prestacionAnual = (capitalAcumulado * (rentabilidad / 100)) / 12
    const prestacionMensual = Math.round(prestacionAnual)

    return { capitalAcumulado, prestacionMensual }
  }

  const resultado = calcularPensiones()

  const tiposPlan = [
    { value: 'individual', label: 'Plan Individual', icon: '👤' },
    { value: 'empresa', label: 'Plan de Empresa', icon: '🏢' },
    { value: 'asociado', label: 'Plan Asociado', icon: '🤝' }
  ]

  return (
    <div className="pensiones-page">
      <div className="page-header">
        <h1>Plan de Pensiones</h1>
        <p className="page-subtitle">
          Calcula tu ahorro fiscal y capital acumulado
        </p>
      </div>

      <div className="pensiones-inputs">
        <div className="input-group">
          <label htmlFor="tipoPlan">Tipo de Plan</label>
          <select
            id="tipoPlan"
            value={tipoPlan}
            onChange={(e) => setTipoPlan(e.target.value)}
            className="input-field"
          >
            {tiposPlan.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="aportacionAnual">Aportación Anual (€)</label>
          <input
            id="aportacionAnual"
            type="number"
            value={aportacionAnual}
            onChange={(e) => setAportacionAnual(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
          <p className="info-text">Límite fiscal 2025: {LIMITE_FISCAL}€</p>
        </div>

        <div className="input-group">
          <label htmlFor="anosHastaJubilacion">Años hasta la Jubilación</label>
          <input
            id="anosHastaJubilacion"
            type="number"
            value={anosHastaJubilacion}
            onChange={(e) => setAnosHastaJubilacion(parseInt(e.target.value) || 0)}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label htmlFor="rendimiento">Rentabilidad Esperada (% anual)</label>
          <input
            id="rendimiento"
            type="number"
            value={rentabilidad}
            onChange={(e) => setRentabilidad(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label htmlFor="rendimientoAnual">Rendimiento Anual (€)</label>
          <input
            id="rendimientoAnual"
            type="number"
            value={rendimientoAnual}
            onChange={(e) => setRendimientoAnual(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
        </div>
      </div>

      <div className="pensiones-results">
        <div className="result-card surface-container-lowest">
          <h2 className="title-md text-primary">Capital Acumulado</h2>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Al jubilarte</span>
            <span className="display-lg">{Math.round(resultado.capitalAcumulado).toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="tax-savings-card">
          <h3 className="headline-sm">Ahorro Fiscal Estimado</h3>
          <p className="body-md">
            Al aportar {aportacionAnual}€/año, puedes deducir hasta {LIMITE_FISCAL}€ de tu declaración
            con una tasa marginal de {rentabilidad}%, ahorrando aproximadamente{' '}
            <strong>{Math.round(ahorroFiscal).toLocaleString('es-ES')} €</strong> cada año.
          </p>
        </div>

        <div className="result-card surface-container-low">
          <h3 className="headline-sm">Prestación Mensual Estimada</h3>
          <div className="balance-totem">
            <span className="label-sm">Con retiro del 4% anual</span>
            <span className="display-lg">{resultado.prestacionMensual.toLocaleString('es-ES')} €</span>
          </div>
        </div>
      </div>

      <div className="pension-comparison">
        <h3>Beneficios del Plan de Pensiones</h3>
        <ul>
          <li><strong>Deducción fiscal:</strong> Hasta 1.500€ anuales deducibles en tu IRPF</li>
          <li><strong>Crecimiento a largo plazo:</strong> Beneficio del interés compuesto</li>
          <li><strong>Seguridad:</strong> Fondos regulados y transparentes</li>
          <li><strong>Flexibilidad:</strong> Retos desde los 62 años (anticipeco programado)</li>
        </ul>
      </div>

      <div className="savings-breakdown">
        <h3>Cómo funciona el ahorro fiscal</h3>
        <p>
          Los planes de pensiones permiten deducir del IRPF hasta {LIMITE_FISCAL}€ anuales.
          Si tu tipo marginal es del {rentabilidad}%, cada euro ahorrado representa {rentabilidad / 100}€
          menos de impuestos.
        </p>
        <p>
          <strong>Ejemplo:</strong> Con una aportación de {aportacionAnual}€ y rentabilidad del {rentabilidad}%:
        </p>
        <ul>
          <li>Deducción fiscal anual: {Math.round(ahorroFiscal).toLocaleString('es-ES')} €</li>
          <li>Ganancia total por ahorro fiscal en {anosHastaJubilacion} años:</li>
          <li>{Math.round(ahorroFiscal * anosHastaJubilacion).toLocaleString('es-ES')} €</li>
        </ul>
      </div>
    </div>
  )
}

export default PlanPensiones
