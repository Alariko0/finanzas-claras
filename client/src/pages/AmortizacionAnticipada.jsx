import { useState } from 'react'
import Icono from '../components/Icono'
import CamposTipoInteres from '../components/CamposTipoInteres'
import { prestamos } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { FORMULARIO_TIPO_INICIAL, entradaTipo, errorTipo } from '../utils/tipoInteres'
import { euro, porcentaje, plazoTexto, fechaCorta } from '../utils/formato'
import './AmortizacionAnticipada.css'

/**
 * Página: Simulador de Amortización Anticipada
 * Efecto de amortizar parte de una hipoteca o préstamo a tipo fijo: reducir cuota o reducir plazo.
 * El cálculo se hace en el servidor: POST /api/prestamos/amortizacion.
 */

const AmortizacionAnticipada = () => {
  const [form, setForm] = useState({
    ...FORMULARIO_TIPO_INICIAL,
    capital: 200000,
    meses: 300,
    mesAmortizacion: 60,
    importe: 20000,
    modo: 'reducirPlazo',
    comisionPct: 0,
    nuevoTin: ''
  })

  const cambiar = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }))
  const numero = (campo) => (e) => cambiar(campo, Math.max(0, Number(e.target.value) || 0))
  const entero = (campo) => (e) => cambiar(campo, Math.max(0, Math.trunc(Number(e.target.value)) || 0))

  const entrada = {
    capital: form.capital,
    meses: form.meses,
    mesAmortizacion: form.mesAmortizacion,
    importe: form.importe,
    modo: form.modo,
    comisionPct: form.comisionPct,
    ...entradaTipo(form),
    ...(form.nuevoTin !== '' ? { nuevoTin: Number(form.nuevoTin) } : {})
  }
  let invalido = ''
  if (!(form.meses >= 1 && form.meses <= 600)) invalido = 'El plazo debe estar entre 1 y 600 meses.'
  else if (form.mesAmortizacion >= form.meses) invalido = 'Las cuotas ya pagadas deben ser menos que el plazo total.'
  else invalido = errorTipo(form, form.meses)
  const { resultado: r, error, cargando } = useCalculo(prestamos.amortizacion, entrada, { invalido })

  const ahorroTotal = r ? Math.max(0, r.ahorroIntereses) : 0
  const parteComision = r && ahorroTotal + r.comision > 0 ? (r.comision / (ahorroTotal + r.comision)) * 100 : 0

  return (
    <div className="amortizacion-page">
      <div className="page-header">
        <h1>Amortización Anticipada</h1>
        <p className="page-subtitle">
          Calcula cuánto ahorras amortizando parte de tu hipoteca o préstamo a tipo fijo
        </p>
      </div>

      <div className="amortizacion-scenario">
        <h2 className="headline-md">Tu préstamo</h2>
        <div className="scenario-inputs">
          <div className="input-group">
            <label htmlFor="capital" className="label-sm">Capital inicial (€)</label>
            <input id="capital" type="number" value={form.capital} onChange={numero('capital')} className="input-field" min="1" />
          </div>

          <CamposTipoInteres form={form} cambiar={cambiar} meses={form.meses} idBase="amo" />

          <div className="input-group">
            <label htmlFor="meses" className="label-sm">Plazo total (meses)</label>
            <input id="meses" type="number" value={form.meses} onChange={entero('meses')} className="input-field" min="1" max="600" />
            <span className="input-value">{plazoTexto(form.meses)}</span>
          </div>

          <div className="input-group">
            <label htmlFor="pagadas" className="label-sm">Cuotas ya pagadas</label>
            <input id="pagadas" type="number" value={form.mesAmortizacion} onChange={entero('mesAmortizacion')} className="input-field" min="0" max={Math.max(0, form.meses - 1)} />
            {r && <span className="input-value">Capital pendiente: {euro(r.saldoAntes)}</span>}
          </div>
        </div>
      </div>

      <div className="amortizacion-scenario">
        <h2 className="headline-md">Propuesta de amortización</h2>
        <div className="scenario-inputs">
          <div className="input-group">
            <label htmlFor="importe" className="label-sm">Importe a amortizar (€)</label>
            <input id="importe" type="number" value={form.importe} onChange={numero('importe')} className="input-field" min="1" />
          </div>

          <div className="input-group">
            <label htmlFor="modo" className="label-sm">Qué prefieres reducir</label>
            <select id="modo" value={form.modo} onChange={(e) => cambiar('modo', e.target.value)} className="input-field">
              <option value="reducirPlazo">Reducir el plazo (misma cuota)</option>
              <option value="reducirCuota">Reducir la cuota (mismo plazo)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="comision" className="label-sm">Comisión por amortizar (% de lo amortizado)</label>
            <input id="comision" type="number" value={form.comisionPct} onChange={numero('comisionPct')} className="input-field" min="0" max="100" step="0.05" />
            {r && (
              <span className="input-subtitle">
                Máximo legal: {porcentaje(r.comisionMaximaLegalPct)}. {r.comisionMaximaLegalNota}
              </span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="nuevoTin" className="label-sm">Pasar a tipo fijo con este TIN tras amortizar (opcional)</label>
            <input
              id="nuevoTin"
              type="number"
              value={form.nuevoTin}
              onChange={(e) => cambiar('nuevoTin', e.target.value)}
              className="input-field"
              min="0"
              max="50"
              step="0.05"
              placeholder="Sin cambio de tipo"
            />
          </div>
        </div>
      </div>

      {error && <p className="calculo-error" role="alert">{error}</p>}

      {r && (
        <div className="amortizacion-result" aria-busy={cargando}>
          <h2 className="headline-md">Impacto financiero</h2>
          <div className="result-cards">
            <div className="result-card highlight">
              <h3 className="title-md">Intereses ahorrados</h3>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="display-lg">{euro(r.ahorroIntereses)}</span>
              </div>
            </div>

            <div className="result-card">
              <h3 className="title-md">Comisión</h3>
              <div className="display-lg text-tertiary">{euro(r.comision)}</div>
            </div>

            <div className="result-card">
              <h3 className="title-md">Ahorro neto</h3>
              <div className="display-lg text-primary-fixed-dim">{euro(r.ahorroNeto)}</div>
            </div>

            <div className="result-card">
              <h3 className="title-md">Cuota mensual</h3>
              <div className="display-lg">
                {r.liquidaPrestamo ? '—' : euro(r.cuotaNueva)}
              </div>
              <span className="input-value">Antes: {euro(r.cuotaActual)}</span>
            </div>

            <div className="result-card">
              <h3 className="title-md">Plazo total</h3>
              <div className="display-lg">{plazoTexto(r.mesesNuevos)}</div>
              <span className="input-value">
                Antes: {plazoTexto(r.mesesActuales)}
                {r.mesesAhorrados > 0 ? ` · ${plazoTexto(r.mesesAhorrados)} menos` : ''}
              </span>
            </div>

            {r.fechaFinNueva && (
              <div className="result-card">
                <h3 className="title-md">Última cuota</h3>
                <div className="display-lg">{fechaCorta(r.fechaFinNueva)}</div>
                <span className="input-value">Antes: {fechaCorta(r.fechaFinActual)}</span>
              </div>
            )}
          </div>

          {r.liquidaPrestamo && (
            <p className="calculo-aviso">El importe cubre todo el capital pendiente: el préstamo queda cancelado.</p>
          )}
          {r.ahorroNeto < 0 && (
            <p className="calculo-aviso">Con esta comisión, amortizar te cuesta más de lo que ahorras en intereses.</p>
          )}
        </div>
      )}

      {r && (
        <div className="amortizacion-chart">
          <h2 className="headline-md">Comisión frente al ahorro</h2>
          <div className="chart-container">
            <div className="comparison-bar">
              <div className="bar-segment" style={{ width: `${parteComision}%`, background: 'var(--tertiary)' }} />
            </div>
            <div className="comparison-labels">
              <span>Comisión: {euro(r.comision)}</span>
              <span>Intereses ahorrados: {euro(r.ahorroIntereses)}</span>
              <span>Neto: {euro(r.ahorroNeto)}</span>
            </div>
          </div>
        </div>
      )}

      {r && (
        <ul className="calculo-avisos">
          {r.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
        </ul>
      )}

      <div className="amortizacion-info">
        <h2 className="headline-md">Consideraciones</h2>
        <div className="info-list">
          <div className="info-item">
            <strong><Icono nombre="fiscal" tamano={16} /> Ahorro en intereses:</strong> Al reducir el capital pendiente, pagas menos intereses cada mes.
          </div>
          <div className="info-item">
            <strong><Icono nombre="historial" tamano={16} /> Reducir plazo o cuota:</strong> Reducir el plazo ahorra más intereses; reducir la cuota alivia el presupuesto mensual.
          </div>
          <div className="info-item">
            <strong><Icono nombre="alerta" tamano={16} /> Comisión:</strong> Revisa en tu contrato la comisión por amortización parcial; puede anular el ahorro.
          </div>
          <div className="info-item">
            <strong><Icono nombre="ahorro" tamano={16} /> Fuente de fondos:</strong> Amortiza con ahorros que no necesites a corto plazo, no con deuda más cara.
          </div>
        </div>
      </div>
    </div>
  )
}

export default AmortizacionAnticipada
