import { useState } from 'react'
import Icono from '../components/Icono'
import TablaAmortizacion from '../components/TablaAmortizacion'
import { prestamos } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { SISTEMAS } from '../utils/tipoInteres'
import { euro, porcentaje, plazoTexto } from '../utils/formato'
import FuentesPie from '../components/FuentesPie'
import './PrestamosPersonales.css'

/**
 * Página: Préstamos Personales
 * Cuota, coste total y TAE con comisiones. El cálculo se hace en el servidor:
 * POST /api/prestamos/cuadro.
 */

const PrestamosPersonales = () => {
  const [form, setForm] = useState({
    sistema: 'frances',
    capital: 10000,
    tin: 6.5,
    meses: 48,
    comisionApertura: 0,
    gastosMensuales: 0
  })

  const { resultado: r, error, cargando } = useCalculo(prestamos.cuadro, form, {
    invalido: Number.isInteger(form.meses) && form.meses >= 1 && form.meses <= 600
      ? ''
      : 'El plazo debe ser un número entero de meses entre 1 y 600.'
  })

  const numero = (campo) => (e) => setForm((a) => ({ ...a, [campo]: Math.max(0, Number(e.target.value) || 0) }))

  return (
    <div className="prestamos-page">
      <div className="page-header">
        <h1>Préstamos Personales</h1>
        <p className="page-subtitle">
          Calcula tu cuota mensual, el coste total y la TAE real incluyendo comisiones
        </p>
      </div>

      <div className="prestamos-selectors">
        <div className="selector-group">
          <label htmlFor="capital" className="label-sm">Importe del préstamo (€)</label>
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

        <div className="selector-group">
          <label htmlFor="tin" className="label-sm">Tipo de interés nominal, TIN (% anual)</label>
          <input
            id="tin"
            type="number"
            value={form.tin}
            onChange={numero('tin')}
            className="input-field"
            min="0"
            max="50"
            step="0.1"
          />
        </div>

        <div className="selector-group">
          <label htmlFor="meses" className="label-sm">Plazo (meses)</label>
          <input
            id="meses"
            type="number"
            value={form.meses}
            onChange={(e) => setForm((a) => ({ ...a, meses: Math.max(0, Math.trunc(Number(e.target.value)) || 0) }))}
            className="input-field"
            min="1"
            max="600"
          />
          <span className="input-value">{plazoTexto(form.meses)}</span>
        </div>

        <div className="selector-group">
          <label htmlFor="sistema" className="label-sm">Sistema de amortización</label>
          <select
            id="sistema"
            value={form.sistema}
            onChange={(e) => setForm((a) => ({ ...a, sistema: e.target.value }))}
            className="input-field"
          >
            {SISTEMAS.map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
          </select>
        </div>

        <div className="selector-group">
          <label htmlFor="comision" className="label-sm">Comisión de apertura (%)</label>
          <input
            id="comision"
            type="number"
            value={form.comisionApertura}
            onChange={numero('comisionApertura')}
            className="input-field"
            min="0"
            max="100"
            step="0.1"
          />
        </div>

        <div className="selector-group">
          <label htmlFor="seguro" className="label-sm">Seguro del préstamo (€ al mes)</label>
          <input
            id="seguro"
            type="number"
            value={form.gastosMensuales}
            onChange={numero('gastosMensuales')}
            className="input-field"
            min="0"
          />
        </div>
      </div>

      {error && <p className="calculo-error" role="alert">{error}</p>}

      {r && (
        <>
          <div className="prestamos-result" aria-busy={cargando}>
            <div className="result-card surface-container-lowest">
              <h2 className="title-md text-primary">
                {form.sistema === 'frances' ? 'Cuota mensual (sistema francés)' : 'Primera cuota'}
              </h2>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="display-lg">{euro(r.cuota)}</span>
              </div>
            </div>

            <div className="result-cards">
              <div className="result-card">
                <h3 className="title-md">Total a pagar</h3>
                <span className="display-lg">{euro(r.totalPagado)}</span>
              </div>

              <div className="result-card highlight">
                <h3 className="title-md">Coste total</h3>
                <span className="display-lg text-tertiary">{euro(r.costeTotal)}</span>
              </div>

              <div className="result-card">
                <h3 className="title-md">TAE</h3>
                <span className="display-lg">{r.tae === null ? '—' : porcentaje(r.tae)}</span>
              </div>
            </div>
          </div>

          <div className="prestamos-info">
            <h2 className="headline-md">Cuadro de amortización</h2>
            <TablaAmortizacion filas={r.filas} resumenAnual={r.resumenAnual} />
          </div>

          <ul className="calculo-avisos">
            {r.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </>
      )}

      <div className="prestamos-info">
        <h2 className="headline-md">Consejos para reducir costes</h2>
        <div className="consejos-list">
          <div className="consejo-item">
            <span className="consejo-icon"><Icono nombre="bombilla" /></span>
            <span>Un plazo más largo reduce la cuota mensual, pero aumenta los intereses totales.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon"><Icono nombre="trofeo" /></span>
            <span>Compara siempre la TAE, no el TIN: incluye comisiones y seguros que te obliguen a contratar.</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon"><Icono nombre="jubilacion" /></span>
            <span>Los pagos anticipados reducen el capital pendiente y los intereses: pruébalo en «Amortización anticipada».</span>
          </div>
          <div className="consejo-item">
            <span className="consejo-icon"><Icono nombre="alerta" /></span>
            <span>Revisa la comisión por amortización anticipada o cancelación antes de firmar.</span>
          </div>
        </div>
      </div>
      <FuentesPie pagina="prestamos" />
    </div>
  )
}

export default PrestamosPersonales
