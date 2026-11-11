import { useEffect, useState } from 'react'
import { convenios, fiscal } from '../utils/api'
import useCalculo from '../hooks/useCalculo'
import { aEntradaRecibo, aplicarRetribucionConvenio, categoriasDisponibles, hayDevengos, linea, MESES } from '../utils/recibo'
import { euro } from '../utils/formato'
import './FormularioRecibo.css'

/**
 * FormularioRecibo - Una nómina real, concepto a concepto, con la estructura del recibo de salarios:
 * encabezado, devengos, deducciones, líquido y bases de cotización. Los totales y los avisos los
 * calcula el servidor (POST /api/fiscal/recibo) mientras se escribe; guardar es cosa del padre.
 */

const COMPLEMENTOS = ['Antigüedad', 'Peligrosidad', 'Turnicidad', 'Nocturnidad', 'Comisiones', 'Plus de convenio']
const NO_SALARIALES = ['Dietas', 'Plus de transporte', 'Indemnización por traslado', 'Indemnización por despido']
const OTRAS = ['Anticipo de nómina', 'Retribución en especie']

const Campo = ({ id, etiqueta, valor, onCambio, tipo = 'number', ayuda, ...resto }) => (
  <div className="input-group">
    <label htmlFor={id}>{etiqueta}</label>
    <input
      id={id}
      type={tipo}
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      className="input-field"
      {...(tipo === 'number' ? { min: '0', step: '0.01', inputMode: 'decimal' } : {})}
      {...resto}
    />
    {ayuda && <small className="recibo-ayuda">{ayuda}</small>}
  </div>
)

const Lista = ({ id, titulo, sugerencias, lineas, onCambio }) => {
  const cambiar = (i, parche) => onCambio(lineas.map((l, k) => (k === i ? { ...l, ...parche } : l)))
  return (
    <div className="recibo-lista">
      <p className="recibo-lista-titulo">{titulo}</p>
      <datalist id={`${id}-sugerencias`}>
        {sugerencias.map((s) => <option key={s} value={s} />)}
      </datalist>
      {lineas.map((l, i) => (
        <div className="recibo-linea" key={l.id}>
          <input
            className="input-field"
            list={`${id}-sugerencias`}
            placeholder="Concepto"
            aria-label={`${titulo}: concepto ${i + 1}`}
            value={l.concepto}
            maxLength={80}
            onChange={(e) => cambiar(i, { concepto: e.target.value })}
          />
          <input
            className="input-field"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Importe (€)"
            aria-label={`${titulo}: importe ${i + 1}`}
            value={l.importe}
            onChange={(e) => cambiar(i, { importe: e.target.value })}
          />
          <button type="button" className="recibo-quitar" onClick={() => onCambio(lineas.filter((_, k) => k !== i))}>
            Quitar
          </button>
        </div>
      ))}
      <button type="button" className="recibo-anadir" onClick={() => onCambio([...lineas, linea()])}>
        + Añadir concepto
      </button>
    </div>
  )
}

const FormularioRecibo = ({ form, setForm, onGuardar, onCancelar, guardando, conSesion, error, editando }) => {
  const entrada = aEntradaRecibo(form)
  const { resultado, error: errorCalculo } = useCalculo(fiscal.recibo, entrada, { omitir: !hayDevengos(form) })

  const poner = (ruta, valor) =>
    setForm((f) => {
      const copia = structuredClone(f)
      const claves = ruta.split('.')
      const ultimo = claves.pop()
      claves.reduce((o, k) => o[k], copia)[ultimo] = valor
      return copia
    })
  const c = (ruta) => (valor) => poner(ruta, valor)
  const t = resultado?.totales

  // Convenio colectivo de la lista: sus categorías y tablas se piden al servidor
  const enc = form.encabezado
  const [lista, setLista] = useState([])
  const [detalle, setDetalle] = useState(null)
  const [manutencion, setManutencion] = useState(false)
  const [conAvisos, setConAvisos] = useState([])
  const [errorConvenio, setErrorConvenio] = useState('')

  useEffect(() => {
    let vigente = true
    convenios.listar().then((l) => vigente && setLista(l)).catch(() => {})
    return () => { vigente = false }
  }, [])

  useEffect(() => {
    if (!enc.convenioId) {
      setDetalle(null)
      return undefined
    }
    let vigente = true
    convenios.obtener(enc.convenioId).then((d) => vigente && setDetalle(d)).catch(() => vigente && setDetalle(null))
    return () => { vigente = false }
  }, [enc.convenioId])

  const elegirConvenio = (id) => {
    const elegido = lista.find((x) => x.id === id)
    setConAvisos([])
    setErrorConvenio('')
    setForm((f) => ({
      ...f,
      encabezado: {
        ...f.encabezado,
        convenioId: id,
        convenioClase: '',
        convenioNivel: '',
        ...(elegido && { convenio: elegido.nombre })
      }
    }))
  }

  const elegirCategoria = (nombre) => {
    const cat = detalle.categorias.find((x) => x.nombre === nombre)
    setForm((f) => ({
      ...f,
      encabezado: {
        ...f.encabezado,
        categoria: cat?.nombre ?? '',
        convenioNivel: cat?.nivel ?? '',
        grupoProfesional: cat && f.encabezado.grupoProfesional === '' ? `Nivel ${cat.nivel}` : f.encabezado.grupoProfesional
      }
    }))
  }

  const rellenarConConvenio = async () => {
    setErrorConvenio('')
    try {
      const r = await convenios.retribucion(enc.convenioId, {
        anio: Number(form.anio),
        clase: enc.convenioClase,
        nivel: enc.convenioNivel,
        manutencionEnMetalico: manutencion
      })
      setForm((f) => aplicarRetribucionConvenio(f, r))
      setConAvisos([...r.avisos, ...r.lineas.filter((l) => l.nota).map((l) => `${l.concepto}: ${l.nota}`)])
    } catch (e) {
      setErrorConvenio(e.errores?.[0]?.message || e.message)
    }
  }
  const categorias = detalle && enc.convenioClase ? categoriasDisponibles(detalle, enc.convenioClase) : []

  return (
    <form
      className="recibo-form"
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar(entrada)
      }}
    >
      <fieldset>
        <legend>1. Encabezado</legend>
        <div className="recibo-grid">
          <Campo id="rc-empresa" etiqueta="Empresa" tipo="text" maxLength={100} valor={form.encabezado.empresa} onCambio={c('encabezado.empresa')} />
          <div className="input-group recibo-convenio">
            <label htmlFor="rc-convenio-lista">Convenio colectivo</label>
            <select id="rc-convenio-lista" className="input-field" value={enc.convenioId} onChange={(e) => elegirConvenio(e.target.value)}>
              <option value="">Otro o ninguno (escribe el nombre)</option>
              {lista.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
            {!enc.convenioId && (
              <>
                <input
                  id="rc-convenio" type="text" maxLength={150} className="input-field"
                  aria-label="Nombre del convenio colectivo" placeholder="Nombre del convenio"
                  value={enc.convenio} onChange={(e) => poner('encabezado.convenio', e.target.value)}
                />
                <small className="recibo-ayuda">Si no tienes uno, el mínimo es el Estatuto de los Trabajadores.</small>
              </>
            )}
            {enc.convenioId && detalle && (
              <div className="recibo-convenio-datos">
                <div className="recibo-grid">
                  <div className="input-group">
                    <label htmlFor="rc-clase">Tipo de establecimiento</label>
                    <select
                      id="rc-clase" className="input-field" value={enc.convenioClase}
                      onChange={(e) => setForm((f) => ({ ...f, encabezado: { ...f.encabezado, convenioClase: e.target.value, convenioNivel: '', categoria: '' } }))}
                    >
                      <option value="">Elige uno</option>
                      {Object.entries(detalle.clases).map(([clave, texto]) => <option key={clave} value={clave}>{texto}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="rc-categoria">Categoría</label>
                    <select
                      id="rc-categoria" className="input-field" value={enc.categoria} disabled={!enc.convenioClase}
                      onChange={(e) => elegirCategoria(e.target.value)}
                    >
                      <option value="">{enc.convenioClase ? 'Elige tu categoría' : 'Elige antes el tipo de establecimiento'}</option>
                      {categorias.map((x) => <option key={x.nombre} value={x.nombre}>Nivel {x.nivel} · {x.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <label className="recibo-check">
                  <input type="checkbox" checked={manutencion} onChange={(e) => setManutencion(e.target.checked)} />
                  Cobro la manutención en metálico
                </label>
                <button
                  type="button" className="recibo-anadir" onClick={rellenarConConvenio}
                  disabled={!enc.convenioClase || !enc.convenioNivel}
                >
                  Rellenar con las tablas del convenio
                </button>
                <small className="recibo-ayuda">
                  Pone el salario base y los pluses de la tabla del año {form.anio} como punto de partida; lo que cobras de verdad es lo de tu recibo.
                  Fuente: <a href={detalle.fuente.url} target="_blank" rel="noopener noreferrer">{detalle.fuente.boletin}</a>.
                </small>
                {errorConvenio && <small className="recibo-error" role="alert">{errorConvenio}</small>}
                {conAvisos.length > 0 && (
                  <ul className="recibo-avisos">
                    {conAvisos.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
          <Campo id="rc-grupoprof" etiqueta="Grupo profesional" tipo="text" maxLength={80} valor={form.encabezado.grupoProfesional} onCambio={c('encabezado.grupoProfesional')} />
          <Campo id="rc-categoria" etiqueta="Categoría" tipo="text" maxLength={80} valor={form.encabezado.categoria} onCambio={c('encabezado.categoria')} />
          <Campo id="rc-antiguedad" etiqueta="Fecha de antigüedad" tipo="date" valor={form.encabezado.fechaAntiguedad} onCambio={c('encabezado.fechaAntiguedad')} />
          <div className="input-group">
            <label htmlFor="rc-grupo">Grupo de cotización</label>
            <select id="rc-grupo" className="input-field" value={form.encabezado.grupoCotizacion} onChange={(e) => poner('encabezado.grupoCotizacion', e.target.value)}>
              <option value="">Sin indicar</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Grupo {g}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="rc-contrato">Tipo de contrato</label>
            <select id="rc-contrato" className="input-field" value={form.encabezado.contrato} onChange={(e) => poner('encabezado.contrato', e.target.value)}>
              <option value="">Sin indicar</option>
              <option value="indefinido">Indefinido</option>
              <option value="temporal">Temporal</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="rc-mes">Mes de la nómina</label>
            <select id="rc-mes" className="input-field" value={form.mes} onChange={(e) => poner('mes', e.target.value)}>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <Campo id="rc-anio" etiqueta="Año" valor={form.anio} onCambio={c('anio')} min="2000" max="2100" step="1" />
          <Campo id="rc-dias" etiqueta="Días del periodo" valor={form.encabezado.diasPeriodo} onCambio={c('encabezado.diasPeriodo')} min="1" max="31" step="1" />
          <div className="input-group">
            <label htmlFor="rc-tipo">Tipo de nómina</label>
            <select id="rc-tipo" className="input-field" value={form.tipo} onChange={(e) => poner('tipo', e.target.value)}>
              <option value="ordinaria">Mensual (ordinaria)</option>
              <option value="extra">Paga extraordinaria</option>
            </select>
          </div>
          <Campo id="rc-cobro" etiqueta="Fecha de cobro" tipo="date" valor={form.fechaCobro} onCambio={c('fechaCobro')} />
        </div>
      </fieldset>

      <fieldset>
        <legend>2. Devengos (salario bruto)</legend>
        <p className="recibo-subtitulo">Percepciones salariales</p>
        <div className="recibo-grid">
          <Campo id="rc-base" etiqueta="Salario base (€)" valor={form.devengos.salarioBase} onCambio={c('devengos.salarioBase')} />
          <Campo id="rc-extras" etiqueta="Horas extraordinarias (€)" valor={form.devengos.horasExtra} onCambio={c('devengos.horasExtra')} />
          <Campo
            id="rc-prorrata" etiqueta="Pagas extra prorrateadas (€)" valor={form.devengos.pagaExtraProrrateada}
            onCambio={c('devengos.pagaExtraProrrateada')} ayuda="Solo si te las pagan repartidas en cada mes."
          />
        </div>
        <Lista
          id="rc-comp" titulo="Complementos salariales" sugerencias={COMPLEMENTOS}
          lineas={form.devengos.complementos} onCambio={(l) => poner('devengos.complementos', l)}
        />
        <p className="recibo-subtitulo">Percepciones no salariales</p>
        <Lista
          id="rc-nosal" titulo="Dietas, transporte, indemnizaciones" sugerencias={NO_SALARIALES}
          lineas={form.devengos.noSalariales} onCambio={(l) => poner('devengos.noSalariales', l)}
        />
        {t && <p className="recibo-subtotal">Total devengado: <strong>{euro(t.bruto)}</strong></p>}
      </fieldset>

      <fieldset>
        <legend>3. Deducciones</legend>
        <p className="recibo-subtitulo">Cotizaciones a la Seguridad Social (a cargo del trabajador)</p>
        <div className="recibo-grid">
          <Campo id="rc-cc" etiqueta="Contingencias comunes (€)" valor={form.deducciones.ss.contingenciasComunes} onCambio={c('deducciones.ss.contingenciasComunes')} />
          <Campo id="rc-desempleo" etiqueta="Desempleo (€)" valor={form.deducciones.ss.desempleo} onCambio={c('deducciones.ss.desempleo')} />
          <Campo id="rc-fp" etiqueta="Formación profesional (€)" valor={form.deducciones.ss.formacionProfesional} onCambio={c('deducciones.ss.formacionProfesional')} />
          <Campo id="rc-mei" etiqueta="MEI (€)" valor={form.deducciones.ss.mei} onCambio={c('deducciones.ss.mei')} />
          <Campo id="rc-sshe" etiqueta="Cotización por horas extra (€)" valor={form.deducciones.ss.horasExtra} onCambio={c('deducciones.ss.horasExtra')} />
          <Campo id="rc-sol" etiqueta="Cotización de solidaridad (€)" valor={form.deducciones.ss.solidaridad} onCambio={c('deducciones.ss.solidaridad')} />
        </div>
        <p className="recibo-subtitulo">Retención de IRPF</p>
        <div className="recibo-grid">
          <Campo
            id="rc-irpf-base" etiqueta="Base de retención (€)" valor={form.deducciones.irpf.base}
            onCambio={c('deducciones.irpf.base')} ayuda="Si no la escribes, se usan los devengos salariales."
          />
          <Campo id="rc-irpf-tipo" etiqueta="Tipo (%)" valor={form.deducciones.irpf.tipo} onCambio={c('deducciones.irpf.tipo')} max="100" />
          <Campo id="rc-irpf-importe" etiqueta="Importe retenido (€)" valor={form.deducciones.irpf.importe} onCambio={c('deducciones.irpf.importe')} />
        </div>
        <p className="recibo-subtitulo">Otras deducciones</p>
        <div className="recibo-grid">
          <Campo id="rc-plan" etiqueta="Aportación al plan de pensiones de empleo (€)" valor={form.deducciones.aportacionPlanEmpleo} onCambio={c('deducciones.aportacionPlanEmpleo')} />
          <Campo
            id="rc-plan-empresa" etiqueta="Aportación de la empresa al plan (€)" valor={form.aportacionEmpresaPlan}
            onCambio={c('aportacionEmpresaPlan')} ayuda="No se descuenta de tu nómina; sirve para tu plan de pensiones."
          />
        </div>
        <Lista
          id="rc-otras" titulo="Anticipos y retribuciones en especie" sugerencias={OTRAS}
          lineas={form.deducciones.otras} onCambio={(l) => poner('deducciones.otras', l)}
        />
        {t && <p className="recibo-subtotal">Total deducido: <strong>{euro(t.deducciones)}</strong></p>}
      </fieldset>

      <fieldset>
        <legend>4. Líquido a percibir</legend>
        <div className="recibo-grid">
          <Campo
            id="rc-liquido" etiqueta="Líquido que pone tu recibo (€)" valor={form.liquidoDeclarado}
            onCambio={c('liquidoDeclarado')} ayuda="Opcional: sirve para comprobar que las cifras cuadran."
          />
        </div>
        {t && (
          <p className="recibo-liquido">
            Bruto {euro(t.bruto)} − deducciones {euro(t.deducciones)} = <strong>{euro(t.liquido)}</strong>
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>5. Bases de cotización (pie de la nómina)</legend>
        <p className="recibo-ayuda">No es dinero que cobres: es la base con la que la Seguridad Social calcula tus prestaciones, como la jubilación.</p>
        <div className="recibo-grid">
          <Campo id="rc-bcc" etiqueta="Contingencias comunes (€)" valor={form.bases.contingenciasComunes} onCambio={c('bases.contingenciasComunes')} />
          <Campo id="rc-bcp" etiqueta="Contingencias profesionales (€)" valor={form.bases.contingenciasProfesionales} onCambio={c('bases.contingenciasProfesionales')} />
          <Campo id="rc-bhe" etiqueta="Horas extraordinarias (€)" valor={form.bases.horasExtra} onCambio={c('bases.horasExtra')} />
        </div>
      </fieldset>

      {errorCalculo && <p className="recibo-error" role="alert">{errorCalculo}</p>}
      {resultado?.avisos.length > 0 && (
        <ul className="recibo-avisos">
          {resultado.avisos.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}
      {error && <p className="recibo-error" role="alert">{error}</p>}

      <div className="recibo-acciones">
        <button type="submit" className="action-button" disabled={guardando || !conSesion || !hayDevengos(form)}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar nómina'}
        </button>
        {onCancelar && <button type="button" className="recibo-cancelar" onClick={onCancelar}>Cancelar</button>}
        {!conSesion && <span className="recibo-ayuda">Inicia sesión para guardar tus nóminas.</span>}
      </div>
    </form>
  )
}

export default FormularioRecibo
