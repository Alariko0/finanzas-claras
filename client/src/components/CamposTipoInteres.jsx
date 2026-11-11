import { TIPOS_INTERES, SISTEMAS } from '../utils/tipoInteres'

const MAX_CAMBIOS = 5

/**
 * Selector de tipo de interés y sistema de amortización, con los campos propios de cada tipo.
 * @param {{form: Object, cambiar: (campo: string, valor: any) => void, meses: number,
 *          idBase?: string, soloFijo?: boolean, etiquetaTin?: string}} props
 *   `form` sigue la forma de FORMULARIO_TIPO_INICIAL. `soloFijo` oculta variable y mixto.
 */
export default function CamposTipoInteres({ form, cambiar, meses, idBase = 'tipo', soloFijo = false }) {
  const num = (campo) => (e) => cambiar(campo, e.target.value === '' ? '' : Number(e.target.value))
  const cambios = form.cambiosEuribor

  const editarCambio = (i, campo, valor) =>
    cambiar('cambiosEuribor', cambios.map((c, j) => (j === i ? { ...c, [campo]: valor === '' ? '' : Number(valor) } : c)))

  return (
    <>
      <div className="input-group">
        <label htmlFor={`${idBase}-sistema`} className="label-sm">Sistema de amortización</label>
        <select
          id={`${idBase}-sistema`}
          value={form.sistema}
          onChange={(e) => cambiar('sistema', e.target.value)}
          className="input-field"
        >
          {SISTEMAS.map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
        </select>
      </div>

      {!soloFijo && (
        <div className="input-group">
          <label htmlFor={`${idBase}-tipo`} className="label-sm">Tipo de interés</label>
          <select
            id={`${idBase}-tipo`}
            value={form.tipoInteres}
            onChange={(e) => {
              const tipo = e.target.value
              cambiar('tipoInteres', tipo)
              // En variable el TIN inicial es opcional; en fijo y mixto es obligatorio
              if (tipo === 'variable') cambiar('tin', '')
              else if (form.tin === '') cambiar('tin', 3.5)
            }}
            className="input-field"
          >
            {TIPOS_INTERES.map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
          </select>
        </div>
      )}

      <div className="input-group">
        <label htmlFor={`${idBase}-tin`} className="label-sm">
          {form.tipoInteres === 'fijo' && 'Tipo de interés nominal, TIN (% anual)'}
          {form.tipoInteres === 'mixto' && 'TIN del tramo fijo (% anual)'}
          {form.tipoInteres === 'variable' && 'TIN inicial hasta la primera revisión (% anual, opcional)'}
        </label>
        <input
          id={`${idBase}-tin`}
          type="number"
          value={form.tin}
          onChange={num('tin')}
          className="input-field"
          min="0"
          max="50"
          step="0.05"
          placeholder={form.tipoInteres === 'variable' ? 'Euríbor + diferencial' : undefined}
        />
      </div>

      {form.tipoInteres === 'mixto' && (
        <div className="input-group">
          <label htmlFor={`${idBase}-anosfijos`} className="label-sm">Años a tipo fijo</label>
          <input
            id={`${idBase}-anosfijos`}
            type="number"
            value={form.anosFijos}
            onChange={num('anosFijos')}
            className="input-field"
            min="1"
            max={Math.max(1, Math.floor(meses / 12))}
          />
        </div>
      )}

      {form.tipoInteres !== 'fijo' && (
        <>
          <div className="input-group">
            <label htmlFor={`${idBase}-diferencial`} className="label-sm">Diferencial (puntos sobre el Euríbor)</label>
            <input
              id={`${idBase}-diferencial`}
              type="number"
              value={form.diferencial}
              onChange={num('diferencial')}
              className="input-field"
              min="0"
              max="20"
              step="0.05"
              placeholder="El de tu oferta"
            />
          </div>

          <div className="input-group">
            <label htmlFor={`${idBase}-euribor`} className="label-sm">Euríbor que supones (%)</label>
            <input
              id={`${idBase}-euribor`}
              type="number"
              value={form.euribor}
              onChange={num('euribor')}
              className="input-field"
              min="-5"
              max="30"
              step="0.05"
              placeholder="Valor de tu hipótesis"
            />
            <span className="input-subtitle">
              Es un supuesto: nadie sabe el Euríbor futuro. La TAE legal lo mantiene constante.
            </span>
          </div>

          <div className="input-group">
            <label htmlFor={`${idBase}-revision`} className="label-sm">Revisión del tipo</label>
            <select
              id={`${idBase}-revision`}
              value={form.periodoRevision}
              onChange={(e) => cambiar('periodoRevision', Number(e.target.value))}
              className="input-field"
            >
              <option value={6}>Cada 6 meses</option>
              <option value={12}>Cada 12 meses</option>
            </select>
          </div>

          <div className="input-group">
            <span className="label-sm">Cambios supuestos del Euríbor (opcional)</span>
            {cambios.map((c, i) => (
              <div className="fila-cambio" key={i}>
                <input
                  aria-label={`Cambio ${i + 1}: a partir de la cuota`}
                  type="number"
                  value={c.mes}
                  onChange={(e) => editarCambio(i, 'mes', e.target.value)}
                  className="input-field"
                  min="1"
                  max="600"
                  placeholder="Desde la cuota"
                />
                <input
                  aria-label={`Cambio ${i + 1}: Euríbor (%)`}
                  type="number"
                  value={c.valor}
                  onChange={(e) => editarCambio(i, 'valor', e.target.value)}
                  className="input-field"
                  min="-5"
                  max="30"
                  step="0.05"
                  placeholder="Euríbor %"
                />
                <button
                  type="button"
                  className="action-button"
                  onClick={() => cambiar('cambiosEuribor', cambios.filter((_, j) => j !== i))}
                >
                  Quitar
                </button>
              </div>
            ))}
            {cambios.length < MAX_CAMBIOS && (
              <button
                type="button"
                className="action-button"
                onClick={() => cambiar('cambiosEuribor', [...cambios, { mes: 13, valor: '' }])}
              >
                Añadir un cambio
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
