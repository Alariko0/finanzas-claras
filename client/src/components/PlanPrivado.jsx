import { Link } from 'react-router-dom'
import { jubilacion } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { usePlan, pensionPublicaMensualEfectiva } from '../context/PlanContext'
import { useNominas } from '../context/NominasContext'
import { nombreComunidad } from '../utils/comunidades'
import { descendientesDe } from '../utils/plan'
import { euro, euroEntero, porcentaje } from '../utils/formato'
import './PlanPrivado.css'

/**
 * PlanPrivado - Plan de pensiones privado dentro de «Plan de jubilación»: ahorro fiscal de hoy,
 * capital del plan y coste fiscal del rescate. Usa la nómina (sueldo, comunidad, familia) y los
 * supuestos de Plan de jubilación (edades, rentabilidad, inflación…); aquí solo se indica lo que se
 * aporta. El cálculo está en el servidor: POST /api/jubilacion/plan-privado.
 */

const OPCIONALES = ['crecimientoAportacion', 'tasaRetiro', 'rentabilidadJubilacion']
const IMPORTES = ['aportacionAnual', 'contribucionEmpresaAnual', 'saldoActual']

function construirEntrada(nomina, supuestos, planPrivado, pensionPublicaMensual) {
  const entrada = {
    comunidad: nomina.comunidad,
    brutoAnual: nomina.brutoAnual,
    grupoCotizacion: nomina.grupo,
    contrato: nomina.contrato,
    contribuyente: { edad: Number(supuestos.edadActual) },
    descendientes: descendientesDe(nomina.hijos, nomina.hijosMenores3),
    edadActual: Number(supuestos.edadActual),
    edadJubilacion: Number(supuestos.edadJubilacion),
    rentabilidad: Number(supuestos.rentabilidad),
    inflacion: Number(supuestos.inflacion || 0)
  }
  for (const c of OPCIONALES) if (supuestos[c] !== '') entrada[c] = Number(supuestos[c])
  if (pensionPublicaMensual !== '') entrada.pensionPublicaMensual = Number(pensionPublicaMensual)
  for (const c of IMPORTES) if (planPrivado[c] !== '') entrada[c] = Number(planPrivado[c])
  return entrada
}

function validar(e, supuestos) {
  if (!(e.brutoAnual > 0)) return 'Indica tu salario bruto en la calculadora de nómina.'
  if (supuestos.rentabilidad === '' || supuestos.edadActual === '' || supuestos.edadJubilacion === '') {
    return 'Rellena las edades y la rentabilidad arriba, en los supuestos de jubilación.'
  }
  if (!Number.isInteger(e.edadActual) || !Number.isInteger(e.edadJubilacion) ||
      e.edadActual < 16 || e.edadActual > 99 || e.edadJubilacion <= e.edadActual || e.edadJubilacion > 100) {
    return 'Revisa las edades: la de jubilación debe ser mayor que la actual.'
  }
  if (IMPORTES.some((c) => e[c] !== undefined && !(e[c] >= 0))) return 'Los importes no pueden ser negativos.'
  return ''
}

const PlanPrivado = () => {
  const { nomina, supuestos, planPrivado, setPlanPrivado, pensionPublicaEstimada } = usePlan()
  const publica = pensionPublicaMensualEfectiva(supuestos, pensionPublicaEstimada)
  const entrada = construirEntrada(nomina, supuestos, planPrivado, publica.texto)
  const { resultado: r, error, cargando } = useCalculo(jubilacion.planPrivado, entrada, {
    invalido: validar(entrada, supuestos)
  })

  const cambia = (campo) => (e) => setPlanPrivado((p) => ({ ...p, [campo]: e.target.value }))
  const f = r?.soportado ? r.fiscal : null

  // Aportaciones al plan de empleo que salen de las nóminas registradas (previsión a diciembre)
  const { resumen } = useNominas()
  const proy = resumen?.proyeccion
  const aportaNominas = proy && (proy.aportacionPlan > 0 || proy.aportacionEmpresaPlan > 0)
  const usarNominas = () =>
    setPlanPrivado((p) => ({
      ...p,
      aportacionAnual: String(proy.aportacionPlan),
      contribucionEmpresaAnual: proy.aportacionEmpresaPlan > 0 ? String(proy.aportacionEmpresaPlan) : ''
    }))
  const yaUsadas = aportaNominas &&
    planPrivado.aportacionAnual === String(proy.aportacionPlan) &&
    planPrivado.contribucionEmpresaAnual === (proy.aportacionEmpresaPlan > 0 ? String(proy.aportacionEmpresaPlan) : '')

  return (
    <section className="plan-privado" aria-busy={cargando}>
      <h2 className="headline-md">Plan de pensiones privado</h2>
      <p className="plan-privado-intro">
        Cuánto te ahorra en impuestos aportar hoy, cuánto capital tendrás y cuánto pagarás al rescatarlo.
        Usa tus supuestos de arriba y los datos de tu <Link to="/nomina">nómina</Link>
        {' '}({euroEntero(nomina.brutoAnual)} brutos al año, {nombreComunidad(nomina.comunidad)}, {nomina.hijos} hijos a cargo).
        {publica.estimada && ' La pensión pública que se suma al rescatar es la estimada en «Plan de pensiones».'}
      </p>

      {aportaNominas && (
        <div className="plan-privado-nominas">
          <p>
            <strong>Según tus nóminas</strong> aportas {euro(proy.aportacionPlan)} al año a tu plan de empleo
            y tu empresa {euro(proy.aportacionEmpresaPlan)} (previsión a diciembre).
          </p>
          <button type="button" className="action-button" onClick={usarNominas} disabled={yaUsadas}>
            {yaUsadas ? 'Usando tus nóminas' : 'Usar mis nóminas'}
          </button>
        </div>
      )}

      <div className="plan-privado-inputs">
        <div className="input-group">
          <label htmlFor="aportacionAnual">Tu aportación anual (€)</label>
          <input
            id="aportacionAnual"
            type="number"
            value={planPrivado.aportacionAnual}
            onChange={cambia('aportacionAnual')}
            className="input-field"
            min="0"
          />
          {f && <p className="input-subtitle">Hasta {euroEntero(f.aportacionPropiaMaxima)} al año se reducen enteros este año</p>}
        </div>

        <div className="input-group">
          <label htmlFor="contribucionEmpresaAnual">Contribución anual de tu empresa (€)</label>
          <input
            id="contribucionEmpresaAnual"
            type="number"
            value={planPrivado.contribucionEmpresaAnual}
            onChange={cambia('contribucionEmpresaAnual')}
            className="input-field"
            min="0"
            placeholder="0"
          />
          <p className="input-subtitle">Plan de empleo: amplía el límite si tú también aportas</p>
        </div>

        <div className="input-group">
          <label htmlFor="saldoActual">Saldo actual del plan (€)</label>
          <input
            id="saldoActual"
            type="number"
            value={planPrivado.saldoActual}
            onChange={cambia('saldoActual')}
            className="input-field"
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      {error && <p className="calculo-error" role="alert">{error}</p>}
      {r && !r.soportado && <p className="calculo-error" role="alert">{r.aviso}</p>}

      {f && (
        <>
          <h3 className="headline-sm">Hoy: lo que ahorras en impuestos</h3>
          <div className="plan-privado-results">
            <div className="result-card surface-container-lowest">
              <h3 className="title-md text-primary">Ahorro fiscal estimado</h3>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">
                  {f.tipoAhorro === null ? 'Aún no aportas nada' : `${porcentaje(f.tipoAhorro, 1)} de lo que aportas`}
                </span>
                <span className="display-lg">{euro(f.ahorroFiscal)}</span>
              </div>
            </div>

            <div className="result-card surface-container-low">
              <h3 className="headline-sm">Lo que te cuesta de verdad</h3>
              <div className="balance-totem">
                <span className="label-sm">Tu aportación menos el ahorro fiscal</span>
                <span className="display-lg">{euro(f.costeNeto)}</span>
              </div>
            </div>
          </div>

          <div className="result-row">
            <span>Límite de reducción este año (tú + empresa)</span>
            <span>{euro(f.limiteReduccion)}</span>
          </div>
          <div className="result-row">
            <span>Aportado en total (tú + empresa)</span>
            <span>{euro(f.aportado)}</span>
          </div>
          <div className="result-row">
            <span>Reduce tu base imponible</span>
            <span>{euro(f.reduccionAplicada)}</span>
          </div>
          {f.exceso > 0 && (
            <div className="result-row">
              <span>Por encima del límite (no reduce este año)</span>
              <span className="text-tertiary">{euro(f.exceso)}</span>
            </div>
          )}
          <div className="result-row">
            <span>Cuota de IRPF sin aportar → aportando</span>
            <span>{euro(f.cuotaSinAportar)} → {euro(f.cuotaAportando)}</span>
          </div>

          <h3 className="headline-sm">Al jubilarte</h3>
          <div className="plan-privado-results">
            <div className="result-card surface-container-lowest">
              <h3 className="title-md text-primary">Capital del plan</h3>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">A los {r.proyeccion.edadJubilacion} años</span>
                <span className="display-lg">{euroEntero(r.proyeccion.capital)}</span>
                <span className="label-sm">{euroEntero(r.proyeccion.capitalReal)} en euros de hoy</span>
              </div>
            </div>

            <div className="result-card surface-container-low">
              <h3 className="headline-sm">Renta del plan</h3>
              <div className="balance-totem">
                <span className="label-sm">Regla del {porcentaje(r.proyeccion.renta.tasaRetiro, 1)}, euros de hoy</span>
                <span className="display-lg">{euro(r.rescate.rentaPlanAnual / 12)}</span>
                <span className="label-sm">al mes, antes de impuestos</span>
              </div>
            </div>

            <div className="result-card surface-container-variant">
              <h3 className="headline-sm">Tras el IRPF del rescate</h3>
              <div className="balance-totem">
                <span className="label-sm">
                  Impuesto: {euro(r.rescate.impuestoAnual)} al año
                  {r.rescate.tipoMedio !== null && ` (${porcentaje(r.rescate.tipoMedio, 1)} de la renta del plan)`}
                </span>
                <span className="display-lg">{euro(r.rescate.netoMensual)}</span>
                <span className="label-sm">netos al mes</span>
              </div>
            </div>
          </div>

          {f.tipoAhorro !== null && r.rescate.tipoMedio !== null && (
            <div className="plan-privado-nota">
              <h3>¿Compensa fiscalmente?</h3>
              <p>
                Hoy recuperas un {porcentaje(f.tipoAhorro, 1)} de lo que aportas; al rescatar en renta pagarías de media
                un {porcentaje(r.rescate.tipoMedio, 1)} sobre lo que cobras del plan
                {r.rescate.pensionPublicaAnual === 0 && ' (sin pensión pública se paga menos: calcúlala en «Plan de pensiones» para ver el efecto real)'}.
                {f.tipoAhorro > r.rescate.tipoMedio
                  ? ' El diferimiento juega a tu favor.'
                  : ' Con estos datos, el ahorro fiscal de hoy no supera lo que pagarías al rescatar.'}
              </p>
            </div>
          )}

          <ul className="calculo-avisos">
            {r.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </>
      )}

      <div className="plan-privado-nota">
        <h3>Cómo se calcula</h3>
        <p>
          Las aportaciones a planes de pensiones reducen la base imponible general del IRPF hasta el menor de dos
          límites: el 30 % de tus rendimientos netos del trabajo y 1.500 € al año, que suben hasta 8.500 € más con
          contribuciones de la empresa (art. 52 de la Ley del IRPF). El ahorro es la diferencia entre la cuota
          de IRPF sin aportar y aportando, con tu comunidad y tu situación familiar.
        </p>
        <p>
          Al jubilarte, lo que cobras del plan tributa como rendimiento del trabajo, sin reducción si se cobra en
          renta (arts. 17.2.a y 18). Se calcula en euros de hoy, sumado a tu pensión pública.
        </p>
      </div>
    </section>
  )
}

export default PlanPrivado
