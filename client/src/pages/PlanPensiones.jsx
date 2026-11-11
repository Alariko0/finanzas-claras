import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fiscal, pension as pensionApi } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { usePlan } from '../context/PlanContext'
import { nombreComunidad } from '../utils/comunidades'
import { combinarHistorial, construirEntradaNomina, construirTramos } from '../utils/plan'
import { nombreMes, tramosDeNominas } from '../utils/recibo'
import { useNominas } from '../context/NominasContext'
import { euro, euroEntero, porcentaje } from '../utils/formato'
import FuentesPie from '../components/FuentesPie'
import './PlanPensiones.css'

/**
 * PlanPensiones - Pensión pública de jubilación (Seguridad Social).
 * Estima la pensión con el historial de cotización (años ya cotizados y sus bases) y con la base de
 * tu nómina actual, y le aplica el IRPF de tu comunidad. Las edades y la inflación son los supuestos
 * de «Plan de jubilación». El cálculo está en el servidor: POST /api/pension/jubilacion.
 */

const dos = (n) => String(n).padStart(2, '0')

// Mes actual y anterior ('AAAA-MM') según el reloj del navegador; el servidor recibe `fechaActual`
const hoy = new Date()
const ANIO = hoy.getFullYear()
const MES = hoy.getMonth() + 1
const FECHA_ACTUAL = `${ANIO}-${dos(MES)}`

function validar(p, supuestos, baseValida) {
  if (supuestos.edadActual === '' || supuestos.edadJubilacion === '') return 'Rellena las edades en Plan de jubilación.'
  const a = Number(supuestos.edadActual)
  const j = Number(supuestos.edadJubilacion)
  if (!Number.isInteger(a) || !Number.isInteger(j) || a < 16 || a > 99 || j <= a || j > 100) {
    return 'Revisa las edades en Plan de jubilación: la de jubilación debe ser mayor que la actual.'
  }
  if (!baseValida) return 'Indica tu salario bruto en Nómina o escribe tu base de cotización actual.'
  if (p.modo === 'media') {
    if ((p.aniosCotizados === '') !== (p.baseMedia === '')) return 'Indica los años cotizados y su base media, o deja ambos vacíos.'
    if (Number(p.aniosCotizados) < 0 || Number(p.baseMedia) < 0) return 'Los años y las bases no pueden ser negativos.'
  } else {
    const anios = p.filas.filter((f) => f.anio !== '').map((f) => Number(f.anio))
    if (anios.some((x) => !Number.isInteger(x) || x < 1960 || x > ANIO)) return `Los años deben estar entre 1960 y ${ANIO}.`
    if (new Set(anios).size !== anios.length) return 'Hay un año repetido en las bases.'
  }
  return ''
}

const PlanPensiones = () => {
  const { nomina, supuestos, pension, setPension, setPensionPublicaEstimada } = usePlan()
  const cambia = (campo) => (e) => setPension((p) => ({ ...p, [campo]: e.target.value }))

  // Base de cotización de la nómina actual (con la prorrata de las pagas extra)
  const entradaNomina = construirEntradaNomina({ ...nomina, edad: Number(supuestos.edadActual) || 0 })
  const { resultado: nom } = useCalculo(fiscal.nomina, entradaNomina, {
    invalido: nomina.brutoAnual > 0 ? '' : 'sin sueldo'
  })
  const baseEstimada = nom?.seguridadSocial.baseCotizacionMensual

  // Nóminas reales: su base actual y las bases de cada mes pasado alimentan el historial
  const { resumen } = useNominas()
  const baseReal = resumen?.ultima?.baseCotizacion > 0 ? resumen.ultima.baseCotizacion : undefined
  const basesNominas = (resumen?.basesCotizacion ?? []).filter((b) => b.mes < FECHA_ACTUAL)
  const baseNomina = baseReal ?? baseEstimada
  const baseManual = pension.baseActual !== ''
  const baseActual = baseManual ? Number(pension.baseActual) : baseNomina

  const entrada = {
    fechaActual: FECHA_ACTUAL,
    edadActual: Number(supuestos.edadActual),
    edadJubilacion: Number(supuestos.edadJubilacion),
    inflacion: Number(supuestos.inflacion || 0),
    tramos: combinarHistorial(construirTramos(pension, { anio: ANIO, mes: MES }), tramosDeNominas(basesNominas)),
    baseMensualActual: baseActual ?? 0,
    situacionMinimo: pension.situacionMinimo,
    comunidad: nomina.comunidad
  }
  if (pension.crecimientoBases !== '') entrada.crecimientoBases = Number(pension.crecimientoBases)

  const { resultado: r, error, cargando } = useCalculo(pensionApi.jubilacion, entrada, {
    invalido: validar(pension, supuestos, baseManual ? Number(pension.baseActual) >= 0 : baseReal !== undefined || nomina.brutoAnual > 0),
    omitir: !baseManual && baseReal === undefined && nomina.brutoAnual > 0 && baseEstimada === undefined
  })

  // Plan de jubilación usa esta pensión (euros de hoy) como pensión pública si no se escribe otra
  useEffect(() => {
    setPensionPublicaEstimada(r?.cumpleRequisitos ? r.pension.anualReal : null)
  }, [r, setPensionPublicaEstimada])

  const filas = pension.filas
  const cambiaFila = (id, campo) => (e) =>
    setPension((p) => ({ ...p, filas: p.filas.map((f) => (f.id === id ? { ...f, [campo]: e.target.value } : f)) }))
  const anadirFila = () =>
    setPension((p) => {
      const ultimo = p.filas.length ? Math.min(...p.filas.map((f) => Number(f.anio) || ANIO)) : ANIO
      const id = p.filas.reduce((m, f) => Math.max(m, f.id), 0) + 1
      return { ...p, filas: [...p.filas, { id, anio: String(ultimo - 1), base: '' }] }
    })
  const quitarFila = (id) => setPension((p) => ({ ...p, filas: p.filas.filter((f) => f.id !== id) }))

  const p = r?.cumpleRequisitos ? r.pension : null

  return (
    <div className="pensiones-page">
      <div className="page-header">
        <h1>Plan de Pensiones</h1>
        <p className="page-subtitle">
          Tu pensión pública de jubilación, según la Ley General de la Seguridad Social: se calcula con lo que
          has cotizado y con tu nómina actual, y se le aplica el IRPF de tu comunidad
        </p>
      </div>

      <div className="pensiones-datos">
        <h2 className="headline-sm">Datos que se usan</h2>
        <dl>
          <div><dt>Edad actual → jubilación</dt><dd>{supuestos.edadActual} → {supuestos.edadJubilacion} años</dd></div>
          <div><dt>Inflación</dt><dd>{supuestos.inflacion || 0} % anual</dd></div>
          <div><dt>Salario bruto</dt><dd>{euroEntero(nomina.brutoAnual)} al año</dd></div>
          <div>
            <dt>Base de cotización actual</dt>
            <dd>{baseActual === undefined ? '…' : `${euro(baseActual)} al mes`}{baseManual ? ' (la tuya)' : baseReal !== undefined ? ` (de tu nómina de ${nombreMes(resumen.ultima.mes)})` : ' (estimada con tu sueldo)'}</dd>
          </div>
          {basesNominas.length > 0 && (
            <div>
              <dt>Historial de tus nóminas</dt>
              <dd>{basesNominas.length} {basesNominas.length === 1 ? 'mes' : 'meses'} con su base real</dd>
            </div>
          )}
          <div><dt>Comunidad (para el IRPF)</dt><dd>{nombreComunidad(nomina.comunidad)}</dd></div>
        </dl>
        <p className="input-subtitle">
          Cámbialos en <Link to="/nomina">Nómina</Link> (tus nóminas, sueldo y comunidad) y en{' '}
          <Link to="/jubilacion">Plan de jubilación</Link> (edades e inflación).
        </p>
      </div>

      <div className="pensiones-historial">
        <h2 className="headline-sm">Lo que ya has cotizado</h2>
        <div className="selector-group" role="group" aria-label="Cómo indicar el historial">
          <button
            type="button"
            className={pension.modo === 'media' ? 'active' : ''}
            onClick={() => setPension((x) => ({ ...x, modo: 'media' }))}
          >
            Solo una media
          </button>
          <button
            type="button"
            className={pension.modo === 'anual' ? 'active' : ''}
            onClick={() => setPension((x) => ({ ...x, modo: 'anual' }))}
          >
            Tengo las bases por año
          </button>
        </div>

        {pension.modo === 'media' ? (
          <div className="pensiones-campos">
            <div className="input-group">
              <label htmlFor="aniosCotizados">Años cotizados hasta hoy</label>
              <input
                id="aniosCotizados"
                type="number"
                value={pension.aniosCotizados}
                onChange={cambia('aniosCotizados')}
                className="input-field"
                min="0"
                max="60"
                step="0.5"
                placeholder="0"
              />
              <p className="input-subtitle">Mira tu vida laboral en «Tu Seguridad Social»</p>
            </div>
            <div className="input-group">
              <label htmlFor="baseMedia">Base de cotización media (€ al mes)</label>
              <input
                id="baseMedia"
                type="number"
                value={pension.baseMedia}
                onChange={cambia('baseMedia')}
                className="input-field"
                min="0"
                placeholder="0"
              />
              <p className="input-subtitle">Aproximada: sirve si no tienes las bases de cada año</p>
            </div>
          </div>
        ) : (
          <div className="bases-anuales">
            <p className="input-subtitle">
              Copia de «Tu Seguridad Social» (informe de bases de cotización) la base mensual de cada año.
              Los años sin cotización déjalos fuera.
            </p>
            {filas.map((f) => (
              <div className="bases-fila" key={f.id}>
                <input
                  type="number"
                  aria-label="Año"
                  value={f.anio}
                  onChange={cambiaFila(f.id, 'anio')}
                  className="input-field"
                  min="1960"
                  max={ANIO}
                />
                <input
                  type="number"
                  aria-label="Base mensual del año (€)"
                  value={f.base}
                  onChange={cambiaFila(f.id, 'base')}
                  className="input-field"
                  min="0"
                  placeholder="Base mensual (€)"
                />
                <button type="button" className="boton-secundario" onClick={() => quitarFila(f.id)} aria-label={`Quitar el año ${f.anio}`}>
                  Quitar
                </button>
              </div>
            ))}
            <button type="button" className="boton-secundario" onClick={anadirFila}>Añadir año</button>
          </div>
        )}

        <div className="pensiones-campos">
          <div className="input-group">
            <label htmlFor="baseActual">Tu base de cotización actual (€ al mes)</label>
            <input
              id="baseActual"
              type="number"
              value={pension.baseActual}
              onChange={cambia('baseActual')}
              className="input-field"
              min="0"
              placeholder={baseNomina === undefined ? '' : String(baseNomina)}
            />
            <p className="input-subtitle">Vacío = la que sale de tu nómina</p>
          </div>
          <div className="input-group">
            <label htmlFor="crecimientoBases">Subida anual de tu base (%)</label>
            <input
              id="crecimientoBases"
              type="number"
              value={pension.crecimientoBases}
              onChange={cambia('crecimientoBases')}
              className="input-field"
              step="0.1"
              placeholder={String(supuestos.inflacion || 0)}
            />
            <p className="input-subtitle">Vacío = igual que la inflación</p>
          </div>
          <div className="input-group">
            <label htmlFor="situacionMinimo">Situación familiar (para la pensión mínima)</label>
            <select
              id="situacionMinimo"
              value={pension.situacionMinimo}
              onChange={cambia('situacionMinimo')}
              className="input-field"
            >
              <option value="sinConyuge">Sin cónyuge</option>
              <option value="conyugeACargo">Con cónyuge a cargo</option>
              <option value="conyugeNoACargo">Con cónyuge no a cargo</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="calculo-error" role="alert">{error}</p>}

      {r && !r.cumpleRequisitos && (
        <div className="pension-comparison" aria-busy={cargando}>
          <h3>Con estos datos no te corresponde pensión de jubilación contributiva</h3>
          <ul>
            {r.motivos.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <p>
            Llevas {r.aniosCotizados} años y {r.mesesCotizadosResto} meses cotizados hasta la jubilación; la edad
            ordinaria para ti sería {r.edadOrdinaria.texto}.
          </p>
        </div>
      )}

      {p && (
        <>
          <div className="pensiones-results" aria-busy={cargando}>
            <div className="result-card surface-container-lowest">
              <h2 className="title-md text-primary">Tu pensión bruta</h2>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">Al mes, en {p.pagas} pagas, a los {supuestos.edadJubilacion} años</span>
                <span className="display-lg">{euro(p.mensual)}</span>
                <span className="label-sm">{euro(p.mensualReal)} en euros de hoy</span>
              </div>
            </div>

            {r.irpf?.soportado && (
              <div className="result-card surface-container-low">
                <h3 className="headline-sm">Tras el IRPF</h3>
                <div className="balance-totem">
                  <span className="label-sm">
                    Neto al mes en euros de hoy · IRPF {porcentaje(r.irpf.tipoMedio, 1)} de media
                  </span>
                  <span className="display-lg">{euro(r.irpf.netoMensual)}</span>
                </div>
              </div>
            )}

            {r.tasaSustitucion !== null && (
              <div className="result-card surface-container-variant">
                <h3 className="headline-sm">Frente a tu base actual</h3>
                <div className="balance-totem">
                  <span className="label-sm">Pensión anual en euros de hoy ÷ tu base anual</span>
                  <span className="display-lg">{porcentaje(r.tasaSustitucion, 0)}</span>
                </div>
              </div>
            )}
          </div>

          {r.irpf && !r.irpf.soportado && <p className="calculo-error" role="alert">{r.irpf.aviso}</p>}

          <div className="result-row">
            <span>Años cotizados hasta la jubilación</span>
            <span>{r.aniosCotizados} años y {r.mesesCotizadosResto} meses</span>
          </div>
          <div className="result-row">
            <span>Edad ordinaria de jubilación para ti</span>
            <span>{r.edadOrdinaria.texto}</span>
          </div>
          <div className="result-row">
            <span>Base reguladora (los {r.baseReguladora.mejoresMeses} mejores de {r.baseReguladora.ventanaMeses} meses ÷ {r.baseReguladora.divisor.toLocaleString('es-ES')})</span>
            <span>{euro(r.baseReguladora.mensual)}</span>
          </div>
          <div className="result-row">
            <span>Porcentaje sobre la base reguladora</span>
            <span>
              {porcentaje(r.porcentaje.base)}
              {r.porcentaje.demora > 0 && ` + ${porcentaje(r.porcentaje.demora)} por demora`}
            </span>
          </div>
          <div className="result-row">
            <span>Pensión máxima ese año ({p.pagas} pagas)</span>
            <span className={p.limitadaPorMaxima ? 'text-tertiary' : ''}>
              {euro(p.maximaMensual)}{p.limitadaPorMaxima && ' · tu pensión está limitada'}
            </span>
          </div>
          <div className="result-row">
            <span>Pensión mínima ese año (al año)</span>
            <span className={p.bajoMinima ? 'text-tertiary' : ''}>
              {euro(p.minimaAnual)}{p.bajoMinima && ' · quedas por debajo'}
            </span>
          </div>

          <ul className="calculo-avisos">
            {r.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </>
      )}

      <div className="savings-breakdown">
        <h3>Cómo se calcula</h3>
        <p>
          La base reguladora es la media de tus mejores bases de cotización en los últimos años, actualizadas con
          el IPC; desde 2026 la ley (art. 209 y disposición transitoria 40.ª de la LGSS) va ampliando el periodo
          hasta los 29 años de los que cuentan los 27 mejores. Sobre esa base se aplica un porcentaje: 50 % por los
          primeros 15 años cotizados y un poco más por cada mes adicional, hasta el 100 % con unos 37 años
          (art. 210). Jubilarte más tarde de la edad ordinaria suma un 4 % por año.
        </p>
        <p>
          La pensión es la misma en toda España; la comunidad solo cambia el IRPF que pagas por ella, porque
          tributa como rendimiento del trabajo. La pensión queda limitada por el máximo anual y, si es muy baja,
          puede tener derecho a un complemento por mínimos (RD 241/2026). Aquí no se incluyen la jubilación
          anticipada, parcial o activa ni otros regímenes.
        </p>
      </div>
      <FuentesPie pagina="planPensiones" />
    </div>
  )
}

export default PlanPensiones
