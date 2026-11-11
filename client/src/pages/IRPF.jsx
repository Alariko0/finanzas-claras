/**
 * IRPF.jsx - Calculadora de IRPF 2026 (rendimientos del trabajo, base general)
 * El cálculo se hace en el servidor: POST /api/fiscal/irpf. Muestra la cuota íntegra
 * (antes de deducciones y retenciones), no el resultado de la declaración.
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fiscal } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { useNominas } from '../context/NominasContext'
import { usePlan } from '../context/PlanContext'
import { COMUNIDADES } from '../utils/comunidades'
import FuentesPie from '../components/FuentesPie'
import './IRPF.css'

const euro = (n) => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fecha = (iso) => new Date(iso).toLocaleDateString('es-ES')

const LIMITE_HIJOS = 8

function construirEntrada(f) {
  const menores3 = Math.min(f.hijosMenores3, f.hijos)
  return {
    comunidad: f.comunidad,
    rendimientoIntegro: f.rendimiento,
    cotizacionesSS: Math.min(f.cotizaciones, f.rendimiento),
    contribuyente: { edad: f.edad },
    descendientes: [
      ...Array.from({ length: menores3 }, () => ({ edad: 1 })),
      ...Array.from({ length: f.hijos - menores3 }, () => ({ edad: 10 }))
    ]
  }
}

const IRPF = () => {
  // Si llega desde la calculadora de nómina, parte de sus datos
  const desdeNomina = useLocation().state?.desdeNomina
  const [form, setForm] = useState({
    rendimiento: 30000,
    cotizaciones: 1950,
    comunidad: 'madrid',
    edad: 35,
    hijos: 0,
    hijosMenores3: 0,
    ...desdeNomina
  })
  const { resultado, error, cargando } = useCalculo(fiscal.irpf, construirEntrada(form), {
    invalido: form.rendimiento >= 0 ? '' : 'El rendimiento no puede ser negativo.'
  })

  // Nóminas reales del usuario: acumulado del año y previsión a diciembre
  const { resumen } = useNominas()
  const { nomina, supuestos } = usePlan()
  const proy = resumen?.proyeccion

  const cambiar = (campo, valor) => setForm((anterior) => ({ ...anterior, [campo]: valor }))
  const usarNominas = () =>
    setForm((anterior) => ({
      ...anterior,
      rendimiento: proy.baseIrpf,
      cotizaciones: proy.cotizacionesTrabajador,
      comunidad: nomina.comunidad,
      edad: Number(supuestos.edadActual) || anterior.edad,
      hijos: nomina.hijos,
      hijosMenores3: Math.min(nomina.hijosMenores3, nomina.hijos)
    }))
  const conNominas = !!proy && form.rendimiento === proy.baseIrpf && form.cotizaciones === proy.cotizacionesTrabajador
  const numero = (campo) => (e) => cambiar(campo, Math.max(0, Number(e.target.value) || 0))
  const entero = (campo, max) => (e) => {
    const n = Number.parseInt(e.target.value, 10)
    cambiar(campo, Number.isNaN(n) ? 0 : Math.min(max, Math.max(0, n)))
  }

  const soportado = resultado?.soportado
  const totalCuota = soportado ? resultado.cuotaEstatal + resultado.cuotaAutonomica : 0
  const parte = (v) => (totalCuota > 0 ? (v / totalCuota) * 100 : 0)

  return (
    <div className="irpf-page">
      <div className="page-header">
        <h1>Tu IRPF del año 2026</h1>
        <p className="page-subtitle">
          Impuesto anual de los rendimientos del trabajo, estatal y autonómico: es la cuota íntegra, antes de
          deducciones y de las retenciones que ya te han descontado en la nómina. Estimación con los datos
          {resultado ? ` de ${fecha(resultado.fechaDatos)}` : ' de 2026'}.
        </p>
        <p className="irpf-enlace">
          {desdeNomina && 'Datos traídos de tu nómina. '}
          <Link to="/nomina">¿Buscas tu sueldo neto mensual? Ir a la calculadora de nómina</Link>
        </p>
      </div>

      {proy && (
        <div className="irpf-nominas">
          <p>
            <strong>Con tus nóminas de {resumen.anio}</strong>: llevas {euro(resumen.acumulado.irpf)} retenidos en
            {' '}{resumen.mesesRegistrados.length} {resumen.mesesRegistrados.length === 1 ? 'mes' : 'meses'} y la previsión
            a diciembre es de {euro(proy.baseIrpf)} de rendimiento, {euro(proy.cotizacionesTrabajador)} de Seguridad
            Social y {euro(proy.irpf)} de retenciones.
          </p>
          <button type="button" className="action-button" onClick={usarNominas} disabled={conNominas}>
            {conNominas ? 'Usando tus nóminas' : 'Usar mis nóminas'}
          </button>
        </div>
      )}

      <div className="irpf-inputs">
        <div className="input-group">
          <label htmlFor="rendimiento">Rendimiento íntegro del trabajo (€)</label>
          <input
            id="rendimiento"
            type="number"
            value={form.rendimiento}
            onChange={numero('rendimiento')}
            className="input-field"
            min="0"
            max="1500000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="cotizaciones">Cotizaciones a la Seguridad Social (€)</label>
          <input
            id="cotizaciones"
            type="number"
            value={form.cotizaciones}
            onChange={numero('cotizaciones')}
            className="input-field"
            min="0"
            max="1500000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="comunidad">Comunidad autónoma</label>
          <select
            id="comunidad"
            value={form.comunidad}
            onChange={(e) => cambiar('comunidad', e.target.value)}
            className="input-field"
          >
            {COMUNIDADES.map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="edad">Tu edad</label>
          <input
            id="edad"
            type="number"
            value={form.edad}
            onChange={entero('edad', 100)}
            className="input-field"
            min="16"
            max="100"
          />
        </div>

        <div className="input-group">
          <label htmlFor="hijos">Hijos a cargo</label>
          <input
            id="hijos"
            type="number"
            value={form.hijos}
            onChange={entero('hijos', LIMITE_HIJOS)}
            className="input-field"
            min="0"
            max={LIMITE_HIJOS}
          />
        </div>

        <div className="input-group">
          <label htmlFor="menores3">De ellos, menores de 3 años</label>
          <input
            id="menores3"
            type="number"
            value={Math.min(form.hijosMenores3, form.hijos)}
            onChange={entero('hijosMenores3', LIMITE_HIJOS)}
            className="input-field"
            min="0"
            max={form.hijos}
          />
        </div>
      </div>

      {error && <p className="irpf-error" role="alert">{error}</p>}

      {resultado && !soportado && (
        <div className="irpf-results">
          <div className="result-card surface-container-low">
            <h2 className="title-md text-primary">Régimen no soportado</h2>
            <p>{resultado.aviso}</p>
            <p className="result-hint">No se muestra ningún importe para no dar una cifra falsa.</p>
          </div>
        </div>
      )}

      {soportado && (
        <>
          <div className={`irpf-results${cargando ? ' calculando' : ''}`} aria-busy={cargando}>
            <div className="result-card surface-container-lowest">
              <h2 className="title-md text-primary">Impuesto anual (cuota íntegra)</h2>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">Antes de deducciones y retenciones · tipo medio {resultado.tipoMedio.toLocaleString('es-ES')} %</span>
                <span className="display-lg">{euro(resultado.cuotaIntegra)}</span>
              </div>
            </div>

            {conNominas && (
              <div className="result-card surface-container-low">
                <h3 className="headline-sm">Frente a lo que te retienen</h3>
                <div className="result-row">
                  <span className="result-label">Retenciones previstas a diciembre</span>
                  <span className="result-value">{euro(proy.irpf)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Cuota íntegra estimada</span>
                  <span className="result-value">{euro(resultado.cuotaIntegra)}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">{proy.irpf >= resultado.cuotaIntegra ? 'Retenido de más (orientativo)' : 'Retenido de menos (orientativo)'}</span>
                  <span className="result-value">{euro(Math.abs(proy.irpf - resultado.cuotaIntegra))}</span>
                </div>
                <p className="result-hint">
                  Orientativo: la cuota íntegra va antes de deducciones (como las de vivienda o donativos) y solo cuenta
                  tus rendimientos del trabajo. La declaración real puede salir distinta.
                </p>
              </div>
            )}

            <div className="result-card surface-container-low">
              <h3 className="headline-sm">Desglose</h3>
              <div className="result-row">
                <span className="result-label">Rendimiento neto previo</span>
                <span className="result-value">{euro(resultado.rendimientoNetoPrevio)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Otros gastos deducibles</span>
                <span className="result-value">{euro(resultado.otrosGastos)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Reducción por rendimientos del trabajo</span>
                <span className="result-value">{euro(resultado.reduccionTrabajo)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Base liquidable general</span>
                <span className="result-value">{euro(resultado.baseLiquidableGeneral)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Mínimo personal y familiar (estatal)</span>
                <span className="result-value">{euro(resultado.minimoEstatal)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Mínimo personal y familiar (autonómico)</span>
                <span className="result-value">{euro(resultado.minimoAutonomico)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Cuota estatal</span>
                <span className="result-value">{euro(resultado.cuotaEstatal)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Cuota autonómica</span>
                <span className="result-value">{euro(resultado.cuotaAutonomica)}</span>
              </div>
              <div className="result-row highlight">
                <span className="result-label">Cuota íntegra total</span>
                <span className="result-value">{euro(resultado.cuotaIntegra)}</span>
              </div>
            </div>
          </div>

          <div className="irpf-chart">
            <h3>Distribución de la cuota</h3>
            <div className="chart-container">
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color primary"></span>
                  <span>Estatal {parte(resultado.cuotaEstatal).toFixed(1)} %</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color secondary"></span>
                  <span>Autonómica {parte(resultado.cuotaAutonomica).toFixed(1)} %</span>
                </div>
              </div>
              <div className="progress-bar" style={{ width: '100%' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${parte(resultado.cuotaEstatal)}%`, backgroundColor: 'var(--primary)' }}
                />
              </div>
            </div>
          </div>

          <ul className="irpf-avisos">
            {resultado.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </>
      )}
      <FuentesPie pagina="irpf" />
    </div>
  )
}

export default IRPF
