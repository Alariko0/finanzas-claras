import { Link } from 'react-router-dom'
import Icono from '../components/Icono'
import { jubilacion } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { usePlan, pensionPublicaMensualEfectiva } from '../context/PlanContext'
import PlanPrivado from '../components/PlanPrivado'
import { euroEntero, porcentaje, plazoTexto } from '../utils/formato'
import FuentesPie from '../components/FuentesPie'
import './PlanJubilacion.css'

/**
 * PlanJubilacion - Proyección de jubilación
 * El cálculo se hace en el servidor: POST /api/jubilacion/proyeccion.
 * Los campos viajan como texto para poder dejarlos vacíos; los opcionales vacíos no se envían.
 */

const OBLIGATORIOS = ['edadActual', 'edadJubilacion', 'rentabilidad']
const OPCIONALES = [
  'ahorroActual', 'aportacionMensual', 'crecimientoAportacion', 'inflacion', 'tasaRetiro',
  'rentabilidadJubilacion', 'rentaDeseadaMensual', 'pensionPublicaMensual'
]

const aEntrada = (form) => {
  const entrada = {}
  for (const c of [...OBLIGATORIOS, ...OPCIONALES]) {
    if (form[c] !== '' && form[c] !== undefined) entrada[c] = Number(form[c])
  }
  return entrada
}

const validar = (form) => {
  for (const c of OBLIGATORIOS) if (form[c] === '') return 'Rellena la edad actual, la edad de jubilación y la rentabilidad.'
  const e = aEntrada(form)
  if (!Number.isInteger(e.edadActual) || !Number.isInteger(e.edadJubilacion)) return 'Las edades deben ser números enteros.'
  if (e.edadActual < 16 || e.edadActual > 99) return 'La edad actual debe estar entre 16 y 99 años.'
  if (e.edadJubilacion <= e.edadActual) return 'La edad de jubilación debe ser mayor que la actual.'
  if (e.edadJubilacion > 100) return 'La edad de jubilación no puede superar los 100 años.'
  if (Object.values(e).some((v) => !Number.isFinite(v))) return 'Hay un campo con un valor no numérico.'
  return ''
}

const Campo = ({ id, etiqueta, valor, onChange, ayuda, ...resto }) => (
  <div className="input-group">
    <label htmlFor={id}>{etiqueta}</label>
    <input id={id} type="number" value={valor} onChange={onChange} className="input-field" {...resto} />
    {ayuda && <p className="input-subtitle">{ayuda}</p>}
  </div>
)

const PlanJubilacion = () => {
  // Estos supuestos los comparten Nómina (edad) y Plan de pensiones; viven en PlanContext
  const { supuestos: form, setSupuestos: setForm, pensionPublicaEstimada } = usePlan()
  // Pensión pública: la que escribas, o la estimada en «Plan de pensiones» si la dejas vacía
  const publica = pensionPublicaMensualEfectiva(form, pensionPublicaEstimada)

  const cambia = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const campo = (id, etiqueta, ayuda, extra = {}) => (
    <Campo id={id} etiqueta={etiqueta} valor={form[id]} onChange={cambia(id)} ayuda={ayuda} {...extra} />
  )

  const { resultado: r, error, cargando } = useCalculo(jubilacion.proyeccion, aEntrada({ ...form, pensionPublicaMensual: publica.texto }), {
    invalido: validar(form)
  })

  const maximo = r ? Math.max(...r.serie.map((p) => p.capital), 1) : 1

  return (
    <div className="plan-jubilacion-page">
      <div className="page-header">
        <h1>Plan de Jubilación</h1>
        <p className="page-subtitle">
          Todo lo privado: fija aquí tus supuestos (edades, rentabilidad, inflación…), proyecta tu ahorro y
          calcula tu plan de pensiones privado. La pensión pública se estima en{' '}
          <Link to="/jubilacion/pensiones">Plan de pensiones</Link>, con los datos de tu <Link to="/nomina">nómina</Link>.
        </p>
      </div>

      <div className="plan-jubilacion-inputs">
        {campo('edadActual', 'Edad actual', null, { min: 16, max: 99, step: 1 })}
        {campo('edadJubilacion', 'Edad de jubilación', null, { min: 17, max: 100, step: 1 })}
        {campo('ahorroActual', 'Ahorro actual (€)', null, { min: 0 })}
        {campo('aportacionMensual', 'Aportación mensual (€)', 'Al final de cada mes', { min: 0 })}
        {campo('rentabilidad', 'Rentabilidad esperada (% anual, neta de comisiones)', 'Es una hipótesis tuya: no está garantizada', { step: 0.1 })}
        {campo('inflacion', 'Inflación esperada (% anual)', 'Sirve para ver las cifras en euros de hoy', { step: 0.1 })}
      </div>

      <details className="plan-jubilacion-avanzado">
        <summary>Más opciones: objetivo de renta, pensión pública y retiro</summary>
        <div className="plan-jubilacion-inputs">
          {campo('rentaDeseadaMensual', 'Renta mensual que quieres cobrar (€ de hoy)', 'Opcional: calcula cuánto te falta', { min: 0 })}
          {campo('pensionPublicaMensual', 'Pensión pública prevista (€ brutos al año ÷ 12, de hoy)', publica.estimada
            ? `Vacío: se usa tu pensión estimada en Plan de pensiones (${Math.round(Number(publica.texto)).toLocaleString('es-ES')} €)`
            : 'Vacío: calcúlala en Plan de pensiones, o escribe la que te dé la Seguridad Social', { min: 0 })}
          {campo('crecimientoAportacion', 'Subida anual de tu aportación (%)', 'Vacío = la aportación no sube', { min: 0, step: 0.1 })}
          {campo('tasaRetiro', 'Tasa de retiro anual (% del capital)', 'La regla del 4 % es orientativa', { min: 0.1, max: 15, step: 0.1 })}
          {campo('rentabilidadJubilacion', 'Rentabilidad ya jubilado (% anual)', 'Vacío = la misma que antes de jubilarte', { step: 0.1 })}
        </div>
      </details>

      {error && <p className="calculo-error" role="alert">{error}</p>}

      {r && (
        <>
          <div className="plan-jubilacion-results">
            <div className="result-card surface-container-lowest">
              <h2 className="title-md text-primary">Capital acumulado</h2>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">A los {r.edadJubilacion} años ({plazoTexto(r.anosHastaJubilacion * 12)})</span>
                <span className="display-lg">{euroEntero(r.capital)}</span>
                <span className="label-sm">{euroEntero(r.capitalReal)} en euros de hoy</span>
              </div>
            </div>

            <div className="result-card surface-container-low">
              <h3 className="headline-sm">Renta mensual con la regla del {porcentaje(r.renta.tasaRetiro, 1)}</h3>
              <div className="balance-totem">
                <span className="label-sm">Primer año de jubilación</span>
                <span className="display-lg">{euroEntero(r.renta.mensual)}</span>
                <span className="label-sm">{euroEntero(r.renta.mensualReal)} en euros de hoy</span>
              </div>
            </div>

            {r.cobertura && (
              <div className="result-card surface-container-variant">
                <h3 className="headline-sm">Cuánto dura</h3>
                <div className="balance-totem">
                  <span className="label-sm">
                    Retirando {euroEntero(r.cobertura.retiroMensualInicial)} al mes, subiendo con la inflación
                  </span>
                  <span className="display-lg">
                    {r.cobertura.perpetua
                      ? `Más de ${r.cobertura.meses / 12} años`
                      : plazoTexto(r.cobertura.meses)}
                  </span>
                  {!r.cobertura.perpetua && (
                    <span className="label-sm">Hasta los {r.cobertura.edadAgotamiento} años aproximadamente</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="result-row">
            <span>Total aportado</span>
            <span>{euroEntero(r.totalAportado)}</span>
          </div>
          <div className="result-row">
            <span>Rendimientos</span>
            <span className={r.rendimientos >= 0 ? 'text-primary' : 'text-tertiary'}>{euroEntero(r.rendimientos)}</span>
          </div>

          {r.objetivo && (
            <div className="coverage-info">
              <h3>Tu objetivo de renta</h3>
              <p>
                Para cobrar {euroEntero(r.objetivo.rentaDeseadaMensual)} al mes (euros de hoy)
                {r.objetivo.pensionPublicaMensual > 0 &&
                  ` y con una pensión pública de ${euroEntero(r.objetivo.pensionPublicaMensual)}`}
                , tu ahorro debe aportar {euroEntero(r.objetivo.rentaACubrirConAhorro)} al mes. Con una tasa del{' '}
                {porcentaje(r.renta.tasaRetiro, 1)} necesitas {euroEntero(r.objetivo.capitalNecesario)} al jubilarte
                ({euroEntero(r.objetivo.capitalNecesarioReal)} de hoy).
              </p>
              <p>
                {r.objetivo.cumplido
                  ? 'Tu proyección alcanza ese capital.'
                  : `Te faltan ${euroEntero(r.objetivo.falta)}. Para llegar, aporta unos ${euroEntero(r.objetivo.aportacionExtraMensual)} más al mes.`}
              </p>
            </div>
          )}

          <div className="projection-chart" role="img" aria-label="Capital acumulado año a año">
            {r.serie.map((p) => {
              const aportado = Math.min(p.aportado, p.capital)
              const rendimiento = Math.max(0, p.capital - p.aportado)
              return (
                <div key={p.edad} className="chart-columna" title={`${p.edad} años: ${euroEntero(p.capital)}`}>
                  <div className="chart-bar chart-bar-rendimiento" style={{ height: `${(rendimiento / maximo) * 100}%` }} />
                  <div className="chart-bar chart-bar-aportado" style={{ height: `${(aportado / maximo) * 100}%` }} />
                </div>
              )
            })}
          </div>
          <div className="chart-ejes">
            <span>{r.serie[0].edad} años</span>
            <span className="chart-leyenda">
              <i className="chart-punto chart-punto-aportado" /> Aportado
              <i className="chart-punto chart-punto-rendimiento" /> Rendimientos
            </span>
            <span>{r.serie[r.serie.length - 1].edad} años</span>
          </div>

          <div className="coverage-info">
            <h3>Qué pasa si aportas más</h3>
            <p>
              Con {euroEntero(r.efectoAportacionExtra.importeMensual)} más al mes, tu capital al jubilarte
              subiría unos {euroEntero(r.efectoAportacionExtra.capitalExtra)}, con la misma rentabilidad.
            </p>
          </div>

          <ul className="calculo-avisos">
            {r.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </>
      )}

      <PlanPrivado />

      <div className="coverage-info">
        <h3><Icono nombre="bombilla" tamano={16} /> Cómo se calcula</h3>
        <p>
          El capital se capitaliza mes a mes con el tipo mensual equivalente a la rentabilidad anual que indiques,
          sumando tu aportación al final de cada mes. La renta de retiro es una fracción fija del capital
          (4 % por defecto) que sube cada año con la inflación; «cuánto dura» simula esos retiros con la
          rentabilidad que elijas ya jubilado, hasta un máximo de 50 años.
        </p>
      </div>
      <FuentesPie pagina="planJubilacion" />
    </div>
  )
}

export default PlanJubilacion
