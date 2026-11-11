/**
 * Nomina.jsx - Calculadora de nómina 2026
 * El cálculo (Seguridad Social, retención de IRPF y neto) se hace en el servidor:
 * POST /api/fiscal/nomina. Aquí solo se recogen datos y se muestra el resultado.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fiscal } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import './Nomina.css'

const euro = (n) => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fecha = (iso) => new Date(iso).toLocaleDateString('es-ES')

const LIMITE_HIJOS = 8

// Convierte lo que el usuario escribe en el cuerpo que espera la API
function construirEntrada(f) {
  const menores3 = Math.min(f.hijosMenores3, f.hijos)
  const descendientes = [
    ...Array.from({ length: menores3 }, () => ({ edad: 1 })),
    ...Array.from({ length: f.hijos - menores3 }, () => ({ edad: 10 }))
  ]
  return {
    brutoAnual: f.brutoAnual,
    pagas: f.pagas,
    prorrateo: f.pagas === 14 && f.prorrateo,
    grupoCotizacion: f.grupo,
    contrato: f.contrato,
    // La situación 1 exige hijos: sin ellos se calcula como «otra»
    situacionFamiliar: f.hijos === 0 && f.situacion === 1 ? 3 : f.situacion,
    contribuyente: { edad: f.edad },
    descendientes
  }
}

const Nomina = () => {
  const [form, setForm] = useState({
    brutoAnual: 30000,
    pagas: 14,
    prorrateo: false,
    grupo: 1,
    contrato: 'indefinido',
    situacion: 3,
    edad: 35,
    hijos: 0,
    hijosMenores3: 0
  })
  const { resultado, error, cargando } = useCalculo(fiscal.nomina, construirEntrada(form), {
    invalido: form.brutoAnual > 0 ? '' : 'Introduce un salario bruto anual mayor que 0.'
  })

  const cambiar = (campo, valor) => setForm((anterior) => ({ ...anterior, [campo]: valor }))
  const entero = (campo, max) => (e) => {
    const n = Number.parseInt(e.target.value, 10)
    cambiar(campo, Number.isNaN(n) ? 0 : Math.min(max, Math.max(0, n)))
  }

  const ss = resultado?.seguridadSocial
  const pct = (parte) => (resultado ? Math.max(0, (parte / resultado.brutoAnual) * 100) : 0)

  return (
    <div className="nomina-page">
      <div className="page-header">
        <h1>Tu sueldo neto mensual</h1>
        <p className="page-subtitle">
          Lo que cobras cada mes tras la Seguridad Social y la retención de IRPF. La retención es un anticipo:
          el impuesto real del año se calcula en la calculadora de IRPF. Estimación con los datos
          {resultado ? ` de ${fecha(resultado.fechaDatos)}` : ' de 2026'}.
        </p>
      </div>

      <div className="nomina-inputs">
        <div className="input-group">
          <label htmlFor="bruto">Salario bruto anual (€)</label>
          <input
            id="bruto"
            type="number"
            value={form.brutoAnual}
            onChange={(e) => cambiar('brutoAnual', Number(e.target.value))}
            className="input-field"
            min="0"
            max="1000000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="pagas">Pagas al año</label>
          <select
            id="pagas"
            value={form.pagas}
            onChange={(e) => cambiar('pagas', Number(e.target.value))}
            className="input-field"
          >
            <option value={12}>12 pagas</option>
            <option value={14}>14 pagas</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="prorrateo">Pagas extra</label>
          <select
            id="prorrateo"
            value={form.prorrateo ? 'si' : 'no'}
            onChange={(e) => cambiar('prorrateo', e.target.value === 'si')}
            className="input-field"
            disabled={form.pagas === 12}
          >
            <option value="no">Se cobran en su mes</option>
            <option value="si">Prorrateadas</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="contrato">Tipo de contrato</label>
          <select
            id="contrato"
            value={form.contrato}
            onChange={(e) => cambiar('contrato', e.target.value)}
            className="input-field"
          >
            <option value="indefinido">Indefinido</option>
            <option value="temporal">Temporal</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="grupo">Grupo de cotización</label>
          <select
            id="grupo"
            value={form.grupo}
            onChange={(e) => cambiar('grupo', Number(e.target.value))}
            className="input-field"
          >
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>Grupo {g}</option>
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
          <label htmlFor="situacion">Situación familiar</label>
          <select
            id="situacion"
            value={form.situacion}
            onChange={(e) => cambiar('situacion', Number(e.target.value))}
            className="input-field"
          >
            <option value={3}>Otra (soltero/a, casado/a con cónyuge con rentas…)</option>
            <option value={2}>Casado/a, cónyuge sin rentas superiores a 1.500 €</option>
            <option value={1}>Soltero/a, viudo/a o separado/a con hijos a cargo exclusivo</option>
          </select>
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

      {error && <p className="nomina-error" role="alert">{error}</p>}

      {resultado && (
        <div className={`nomina-result${cargando ? ' calculando' : ''}`} aria-busy={cargando}>
          <div className="result-row">
            <div className="result-label">Salario bruto anual</div>
            <div className="result-row-desc">{euro(resultado.brutoAnual)}</div>
          </div>

          <div className="result-row">
            <div className="result-label">Seguridad Social (trabajador)</div>
            <div className="result-row-desc">
              {euro(ss.totalTrabajadorAnual)} al año
              <span className="text-secondary"> · {euro(ss.totalTrabajadorAnual / 12)} al mes</span>
            </div>
          </div>

          <div className="result-row">
            <div className="result-label">Retención de IRPF (anticipo del impuesto)</div>
            <div className="result-row-desc">
              {resultado.irpf.exento ? 'Exento de retención' : `${resultado.irpf.tipo.toLocaleString('es-ES')} %`}
              <span className="text-secondary"> · {euro(resultado.irpf.importeAnual)} al año</span>
            </div>
          </div>

          <div className="result-row">
            <div className="result-label">Coste total para la empresa</div>
            <div className="result-row-desc">
              {euro(resultado.costeEmpresaAnual)}
              <span className="text-secondary"> · SS empresa {euro(ss.totalEmpresaAnual)}</span>
            </div>
          </div>

          <div className="result-row">
            <div className="result-label">Salario neto anual</div>
            <div className="result-row-desc">{euro(resultado.netoAnual)}</div>
          </div>

          {resultado.paga.extra ? (
            <>
              <div className="result-row highlight">
                <div className="result-label">Neto de una paga ordinaria (12)</div>
                <div className="balance-totem text-primary-fixed-dim">
                  <span className="display-lg">{euro(resultado.paga.ordinaria.neto)}</span>
                </div>
              </div>
              <div className="result-row">
                <div className="result-label">Neto de una paga extra (2)</div>
                <div className="result-row-desc">{euro(resultado.paga.extra.neto)}</div>
              </div>
            </>
          ) : (
            <div className="result-row highlight">
              <div className="result-label">Neto mensual (12 pagos)</div>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="display-lg">{euro(resultado.paga.ordinaria.neto)}</span>
              </div>
            </div>
          )}

          <ul className="nomina-avisos">
            {resultado.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </div>
      )}

      {resultado && (
        <div className="nomina-renta">
          <p>
            Esta retención es un anticipo. Para ver cuánto impuesto corresponde a todo el año,
            usa la calculadora de IRPF con estos mismos datos.
          </p>
          <Link
            to="/irpf"
            className="action-button"
            state={{
              desdeNomina: {
                rendimiento: resultado.brutoAnual,
                cotizaciones: Math.round(ss.totalTrabajadorAnual * 100) / 100,
                edad: form.edad,
                hijos: form.hijos,
                hijosMenores3: Math.min(form.hijosMenores3, form.hijos)
              }
            }}
          >
            Ver cómo queda en la renta
          </Link>
        </div>
      )}

      {resultado && (
        <div className="nomina-chart">
          <h3 className="headline-sm">¿A dónde va tu salario bruto?</h3>
          {[
            ['Salario neto', resultado.netoAnual, 'var(--primary)'],
            ['Seguridad Social', ss.totalTrabajadorAnual, 'var(--secondary)'],
            ['IRPF', resultado.irpf.importeAnual, 'var(--tertiary)']
          ].map(([nombre, valor, color]) => (
            <div className="chart-section" key={nombre}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct(valor)}%`, backgroundColor: color }} />
              </div>
              <div className="progress-label">
                {nombre}: {euro(valor)} ({pct(valor).toFixed(1)} %)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Nomina
