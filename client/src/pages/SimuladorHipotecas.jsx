import { useState } from 'react'
import { prestamos } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import TablaAmortizacion from '../components/TablaAmortizacion'
import CamposTipoInteres from '../components/CamposTipoInteres'
import { FORMULARIO_TIPO_INICIAL, entradaTipo, errorTipo } from '../utils/tipoInteres'
import { euro, porcentaje, plazoTexto, hoyISO, fechaCorta } from '../utils/formato'
import './SimuladorHipotecas.css'

/**
 * Página: Simulador de Hipotecas (fija, variable y mixta; sistema francés, alemán o americano)
 * El cálculo se hace en el servidor: POST /api/prestamos/cuadro.
 */

const NOMBRE_SISTEMA = {
  frances: 'sistema francés',
  aleman: 'sistema alemán',
  americano: 'sistema americano'
}

const SimuladorHipotecas = () => {
  const [form, setForm] = useState({
    ...FORMULARIO_TIPO_INICIAL,
    capital: 200000,
    plazo: 25,
    unidad: 'anios',
    comisionApertura: 0,
    gastosMensuales: 0,
    fechaInicio: hoyISO()
  })
  const meses = form.unidad === 'anios' ? form.plazo * 12 : form.plazo

  const entrada = {
    capital: form.capital,
    meses,
    comisionApertura: form.comisionApertura,
    gastosMensuales: form.gastosMensuales,
    ...(form.fechaInicio ? { fechaInicio: form.fechaInicio } : {}),
    ...entradaTipo(form)
  }
  const invalido = !(Number.isInteger(meses) && meses >= 1 && meses <= 600)
    ? 'El plazo debe ser un número entero entre 1 mes y 50 años.'
    : errorTipo(form, meses)
  const { resultado: r, error, cargando } = useCalculo(prestamos.cuadro, entrada, { invalido })

  const cambiar = (campo, valor) => setForm((anterior) => ({ ...anterior, [campo]: valor }))
  const numero = (campo) => (e) => cambiar(campo, Math.max(0, Number(e.target.value) || 0))

  const parteCapital = r ? (r.capital / r.totalCuotas) * 100 : 0
  const variable = r && r.tipoInteres !== 'fijo'
  const etiquetaCuota = r?.sistema === 'frances' && !variable ? 'Cuota mensual' : 'Primera cuota'

  return (
    <div className="hipotecas-page">
      <div className="page-header">
        <h1>Simulador de Hipotecas</h1>
        <p className="page-subtitle">
          Cuota, TAE y cuadro de amortización de una hipoteca a tipo fijo, variable o mixto.
          El sistema francés (cuota constante) es el habitual en España.
        </p>
      </div>

      <div className="hipotecas-grid">
        <div className="hipotecas-inputs">
          <div className="input-group">
            <label htmlFor="capital" className="label-sm">Capital del préstamo (€)</label>
            <input
              id="capital"
              type="number"
              value={form.capital}
              onChange={numero('capital')}
              className="input-field"
              min="1"
              max="100000000"
            />
          </div>

          <CamposTipoInteres form={form} cambiar={cambiar} meses={meses} idBase="hip" />

          <div className="input-group">
            <label htmlFor="plazo" className="label-sm">Plazo</label>
            <input
              id="plazo"
              type="number"
              value={form.plazo}
              onChange={(e) => cambiar('plazo', Math.max(0, Math.trunc(Number(e.target.value)) || 0))}
              className="input-field"
              min="1"
              max={form.unidad === 'anios' ? 50 : 600}
            />
            <select
              aria-label="Unidad del plazo"
              value={form.unidad}
              onChange={(e) => {
                const unidad = e.target.value
                setForm((a) => ({
                  ...a,
                  unidad,
                  plazo: unidad === 'anios' ? Math.max(1, Math.round(meses / 12)) : meses
                }))
              }}
              className="input-field"
            >
              <option value="anios">Años</option>
              <option value="meses">Meses</option>
            </select>
            <span className="input-subtitle">{plazoTexto(meses)} ({meses} cuotas)</span>
          </div>

          <div className="input-group">
            <label htmlFor="comision" className="label-sm">Comisión de apertura (% del capital)</label>
            <input
              id="comision"
              type="number"
              value={form.comisionApertura}
              onChange={numero('comisionApertura')}
              className="input-field"
              min="0"
              max="100"
              step="0.05"
            />
          </div>

          <div className="input-group">
            <label htmlFor="seguros" className="label-sm">Seguros vinculados (€ al mes)</label>
            <input
              id="seguros"
              type="number"
              value={form.gastosMensuales}
              onChange={numero('gastosMensuales')}
              className="input-field"
              min="0"
            />
            <span className="input-subtitle">No cambian la cuota, pero sí la TAE.</span>
          </div>

          <div className="input-group">
            <label htmlFor="fecha" className="label-sm">Fecha de firma</label>
            <input
              id="fecha"
              type="date"
              value={form.fechaInicio}
              onChange={(e) => cambiar('fechaInicio', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="hipotecas-result" aria-busy={cargando}>
          {error && <p className="calculo-error" role="alert">{error}</p>}
          {r && (
            <>
              <div className="result-card surface-container-lowest">
                <h2 className="title-md text-primary">{etiquetaCuota} ({NOMBRE_SISTEMA[r.sistema]})</h2>
                <div className="balance-totem text-primary-fixed-dim">
                  <span className="display-lg">{euro(r.cuota)}</span>
                </div>
              </div>

              <div className="result-row">
                <span>{variable ? 'TIN inicial' : 'TIN'}</span>
                <span>{porcentaje(r.tinInicial)}</span>
              </div>
              {(variable || r.sistema !== 'frances') && (
                <>
                  <div className="result-row">
                    <span>Cuota máxima</span>
                    <span>{euro(r.cuotaMaxima)}</span>
                  </div>
                  <div className="result-row">
                    <span>Cuota mínima</span>
                    <span>{euro(r.cuotaMinima)}</span>
                  </div>
                </>
              )}
              <div className="result-row">
                <span>TAE{variable ? ' (supuesto legal)' : ''}</span>
                <span>{r.tae === null ? 'No calculable' : porcentaje(r.tae)}</span>
              </div>
              <div className="result-row">
                <span>Total en cuotas</span>
                <span>{euro(r.totalCuotas)}</span>
              </div>
              {r.comisionApertura > 0 && (
                <div className="result-row">
                  <span>Comisión de apertura</span>
                  <span>{euro(r.comisionApertura)}</span>
                </div>
              )}
              <div className="result-row highlight">
                <span>Intereses totales</span>
                <span className="text-tertiary">{euro(r.totalIntereses)}</span>
              </div>
              {r.fechaFin && (
                <div className="result-row">
                  <span>Última cuota</span>
                  <span>{fechaCorta(r.fechaFin)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {r && variable && (
        <>
          <div className="hipotecas-tabla">
            <h2 className="headline-md">Si el Euríbor cambia</h2>
            <div className="tabla-container">
              <table className="amortizacion-table">
                <thead>
                  <tr>
                    <th>Euríbor</th>
                    <th>TIN final</th>
                    <th>Cuota máxima</th>
                    <th>Cuota mínima</th>
                    <th>Intereses totales</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mes">Tu supuesto</td>
                    <td>{porcentaje(r.filas[r.filas.length - 1].tin)}</td>
                    <td>{euro(r.cuotaMaxima)}</td>
                    <td>{euro(r.cuotaMinima)}</td>
                    <td>{euro(r.totalIntereses)}</td>
                    <td>—</td>
                  </tr>
                  {r.escenarios.map((e) => (
                    <tr key={e.puntos}>
                      <td className="mes">{e.puntos > 0 ? `+${e.puntos}` : e.puntos} puntos</td>
                      <td>{porcentaje(e.tinFinal)}</td>
                      <td>{euro(e.cuotaMaxima)}</td>
                      <td>{euro(e.cuotaMinima)}</td>
                      <td>{euro(e.totalIntereses)}</td>
                      <td className={e.diferenciaIntereses > 0 ? 'text-tertiary' : ''}>
                        {e.diferenciaIntereses > 0 ? '+' : ''}{euro(e.diferenciaIntereses)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="hipotecas-tabla">
            <h2 className="headline-md">Revisiones del tipo y de la cuota</h2>
            <div className="tabla-container">
              <table className="amortizacion-table">
                <thead>
                  <tr>
                    <th>Cuota nº</th>
                    {r.revisiones[0].fecha && <th>Fecha</th>}
                    <th>TIN</th>
                    <th>Cuota desde aquí</th>
                  </tr>
                </thead>
                <tbody>
                  {r.revisiones.map((v) => (
                    <tr key={v.numero}>
                      <td className="mes">{v.numero}</td>
                      {v.fecha && <td className="fecha">{fechaCorta(v.fecha)}</td>}
                      <td>{porcentaje(v.tin)}</td>
                      <td>{euro(v.cuota)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {r && (
        <>
          <div className="hipotecas-tabla">
            <h2 className="headline-md">Cuadro de amortización</h2>
            <TablaAmortizacion filas={r.filas} resumenAnual={r.resumenAnual} />
          </div>

          <div className="hipotecas-chart">
            <h2 className="headline-md">Desglose de pagos</h2>
            <div className="chart-container">
              <div className="chart-bar">
                <div className="bar-fill" style={{ width: `${parteCapital}%`, background: 'var(--primary)' }} />
                <div className="bar-fill" style={{ flex: 1, background: 'var(--tertiary)' }} />
              </div>
              <div className="chart-legend">
                <div className="legend-item primary">
                  <span className="legend-label">Capital ({parteCapital.toFixed(0)} %)</span>
                </div>
                <div className="legend-item secondary">
                  <span className="legend-label">Intereses ({(100 - parteCapital).toFixed(0)} %)</span>
                </div>
              </div>
            </div>
          </div>

          <ul className="calculo-avisos">
            {r.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </>
      )}
    </div>
  )
}

export default SimuladorHipotecas
