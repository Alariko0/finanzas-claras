/**
 * GastosFamiliares.jsx - Reparto de gastos del hogar
 * El reparto (proporcional a los ingresos o a partes iguales) se calcula en el servidor:
 * POST /api/hogar/reparto. Los datos viven en HogarContext para que «Presupuesto y ahorro»
 * los aproveche. Aquí solo se recogen los datos y se muestra el resultado.
 */

import { Link } from 'react-router-dom'
import { CATEGORIAS, useHogar } from '../context/HogarContext'
import { useNominas } from '../context/NominasContext'
import { euro, porcentaje } from '../utils/formato'
import './GastosFamiliares.css'

const MAX_PERSONAS = 10
const MAX_GASTOS = 100
const MAX_INDIVIDUALES = 50

const SelectorCategoria = ({ valor, etiqueta, onChange }) => (
  <select aria-label={etiqueta} value={valor} onChange={(e) => onChange(e.target.value)} className="input-field">
    {CATEGORIAS.map((c) => <option key={c.clave} value={c.clave}>{c.nombre}</option>)}
  </select>
)

const GastosFamiliares = () => {
  const {
    metodo, setMetodo, personas, setPersonas, gastos, setGastos, nuevoId, resultado, error, cargando
  } = useHogar()

  // Ingreso neto real: el que sale de las nóminas registradas (media mensual del año, con pagas extra)
  const { resumen } = useNominas()
  const ingresoNomina = resumen?.proyeccion?.ingresoMensualMedio

  const importe = (e) => Math.min(10000000, Math.max(0, Number(e.target.value) || 0))
  const cambiarPersona = (id, campo, valor) =>
    setPersonas((lista) => lista.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))
  const cambiarGasto = (id, campo, valor) =>
    setGastos((lista) => lista.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)))
  const cambiarIndividual = (personaId, id, campo, valor) =>
    setPersonas((lista) => lista.map((p) => (p.id !== personaId
      ? p
      : { ...p, gastosIndividuales: p.gastosIndividuales.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)) })))

  return (
    <div className="gastos-page">
      <div className="page-header">
        <h1>Gastos del hogar</h1>
        <p className="page-subtitle">
          Reparte los gastos compartidos entre las personas del hogar y comprueba cuánto le queda libre a cada una.
          Estimación orientativa: el reparto es un acuerdo entre vosotros.
        </p>
      </div>

      <div className="gastos-inputs">
        <div className="input-group">
          <label htmlFor="metodo">Cómo se reparten los gastos compartidos</label>
          <select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)} className="input-field">
            <option value="proporcional">En proporción a los ingresos de cada persona</option>
            <option value="igual">A partes iguales</option>
          </select>
        </div>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Personas</h2>
        {ingresoNomina > 0 && (
          <div className="gastos-nomina">
            <p>
              <strong>Según tus nóminas</strong> cobras de media {euro(ingresoNomina)} netos al mes
              (última nómina: {euro(resumen.ultima.liquido)}).
            </p>
            <button
              type="button"
              className="action-button"
              disabled={personas[0].ingresoMensual === ingresoNomina}
              onClick={() => cambiarPersona(personas[0].id, 'ingresoMensual', ingresoNomina)}
            >
              Usar en {personas[0].nombre || 'la primera persona'}
            </button>
          </div>
        )}
        <div className="gastos-editor">
          <div className="gastos-fila gastos-fila-personas gastos-fila-cabecera" aria-hidden="true">
            <span>Nombre</span><span>Ingresos al mes (€)</span><span />
          </div>
          {personas.map((p, i) => (
            <div key={p.id} className="gastos-fila gastos-fila-personas">
              <input
                type="text"
                aria-label={`Nombre de la persona ${i + 1}`}
                value={p.nombre}
                maxLength={50}
                onChange={(e) => cambiarPersona(p.id, 'nombre', e.target.value)}
                className="input-field"
              />
              <input
                type="number"
                aria-label={`Ingresos mensuales de ${p.nombre || `la persona ${i + 1}`}`}
                value={p.ingresoMensual}
                min="0"
                max="10000000"
                onChange={(e) => cambiarPersona(p.id, 'ingresoMensual', importe(e))}
                className="input-field"
              />
              <button
                type="button"
                className="gastos-quitar"
                disabled={personas.length === 1}
                onClick={() => setPersonas((lista) => lista.filter((x) => x.id !== p.id))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="action-button"
          disabled={personas.length >= MAX_PERSONAS}
          onClick={() => setPersonas((lista) => [
            ...lista,
            { id: nuevoId(), nombre: `Persona ${lista.length + 1}`, ingresoMensual: 0, gastosIndividuales: [] }
          ])}
        >
          Añadir persona
        </button>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Gastos compartidos</h2>
        {gastos.length > 0 && (
          <div className="gastos-editor">
            <div className="gastos-fila gastos-fila-gastos gastos-fila-cabecera" aria-hidden="true">
              <span>Concepto</span><span>Importe al mes (€)</span><span>Tipo</span><span />
            </div>
            {gastos.map((g, i) => (
              <div key={g.id} className="gastos-fila gastos-fila-gastos">
                <input
                  type="text"
                  aria-label={`Concepto del gasto compartido ${i + 1}`}
                  placeholder="Alquiler, luz, internet…"
                  value={g.concepto}
                  maxLength={100}
                  onChange={(e) => cambiarGasto(g.id, 'concepto', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  aria-label={`Importe de ${g.concepto || `el gasto compartido ${i + 1}`}`}
                  value={g.importe}
                  min="0"
                  max="10000000"
                  onChange={(e) => cambiarGasto(g.id, 'importe', importe(e))}
                  className="input-field"
                />
                <SelectorCategoria
                  valor={g.categoria}
                  etiqueta={`Tipo de ${g.concepto || `el gasto compartido ${i + 1}`}`}
                  onChange={(v) => cambiarGasto(g.id, 'categoria', v)}
                />
                <button
                  type="button"
                  className="gastos-quitar"
                  onClick={() => setGastos((lista) => lista.filter((x) => x.id !== g.id))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="action-button"
          disabled={gastos.length >= MAX_GASTOS}
          onClick={() => setGastos((lista) => [
            ...lista,
            { id: nuevoId(), concepto: '', importe: 0, categoria: 'necesidades' }
          ])}
        >
          Añadir gasto compartido
        </button>
      </div>

      <div className="gastos-section">
        <h2 className="headline-md">Gastos individuales</h2>
        {personas.map((p, i) => (
          <div key={p.id} className="gastos-persona">
            <h3>{p.nombre || `Persona ${i + 1}`}</h3>
            {p.gastosIndividuales.length > 0 && (
              <div className="gastos-editor">
                <div className="gastos-fila gastos-fila-gastos gastos-fila-cabecera" aria-hidden="true">
                  <span>Concepto</span><span>Importe al mes (€)</span><span>Tipo</span><span />
                </div>
                {p.gastosIndividuales.map((g, j) => (
                  <div key={g.id} className="gastos-fila gastos-fila-gastos">
                    <input
                      type="text"
                      aria-label={`Concepto del gasto ${j + 1} de ${p.nombre}`}
                      placeholder="Gimnasio, ropa, hucha…"
                      value={g.concepto}
                      maxLength={100}
                      onChange={(e) => cambiarIndividual(p.id, g.id, 'concepto', e.target.value)}
                      className="input-field"
                    />
                    <input
                      type="number"
                      aria-label={`Importe de ${g.concepto || `el gasto ${j + 1}`} de ${p.nombre}`}
                      value={g.importe}
                      min="0"
                      max="10000000"
                      onChange={(e) => cambiarIndividual(p.id, g.id, 'importe', importe(e))}
                      className="input-field"
                    />
                    <SelectorCategoria
                      valor={g.categoria}
                      etiqueta={`Tipo de ${g.concepto || `el gasto ${j + 1}`} de ${p.nombre}`}
                      onChange={(v) => cambiarIndividual(p.id, g.id, 'categoria', v)}
                    />
                    <button
                      type="button"
                      className="gastos-quitar"
                      onClick={() => cambiarPersona(p.id, 'gastosIndividuales', p.gastosIndividuales.filter((x) => x.id !== g.id))}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="action-button"
              disabled={p.gastosIndividuales.length >= MAX_INDIVIDUALES}
              onClick={() => cambiarPersona(p.id, 'gastosIndividuales', [
                ...p.gastosIndividuales,
                { id: nuevoId(), concepto: '', importe: 0, categoria: 'deseos' }
              ])}
            >
              Añadir gasto de {p.nombre || `Persona ${i + 1}`}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="gastos-error" role="alert">{error}</p>}

      {resultado && (
        <div className={`gastos-results${cargando ? ' calculando' : ''}`} aria-busy={cargando}>
          <div className="gastos-section">
            <h2 className="headline-md">Cuánto paga cada persona</h2>
            <div className="gastos-grid">
              {resultado.personas.map((p, i) => (
                <div key={personas[i]?.id ?? i} className="gastos-card surface-container-lowest">
                  <div className="card-label">{p.nombre}</div>
                  <div className="cuota-display">
                    <span className="caption">Cuota compartida al mes</span>
                    <span className="display-lg">{euro(p.cuotaCompartida)}</span>
                  </div>
                  <div className="card-footer">
                    <span className="caption">Del reparto</span>
                    <span>{p.porcentajeDelReparto === null ? '—' : porcentaje(p.porcentajeDelReparto, 1)}</span>
                  </div>
                  <div className="card-footer">
                    <span className="caption">De sus ingresos</span>
                    <span>{p.porcentajeSobreIngresos === null ? '—' : porcentaje(p.porcentajeSobreIngresos, 1)}</span>
                  </div>
                  <div className="card-footer">
                    <span className="caption">Gastos individuales</span>
                    <span>{euro(p.totalIndividuales)}</span>
                  </div>
                  <div className="card-footer">
                    <span className="caption">Libre a fin de mes</span>
                    <span className={p.saldo >= 0 ? 'text-success' : 'text-tertiary'}>{euro(p.saldo)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gastos-section budget-section">
            <h2 className="headline-md">Resumen mensual del hogar</h2>
            <div className="budget-card">
              <div className="budget-row"><span>Ingresos</span><span>{euro(resultado.totalIngresos)}</span></div>
              <div className="budget-row"><span>Gastos compartidos</span><span>{euro(resultado.totalCompartido)}</span></div>
              <div className="budget-row"><span>Gastos individuales</span><span>{euro(resultado.totalIndividuales)}</span></div>
              <div className="budget-row">
                <span>Libre a fin de mes</span>
                <span className={resultado.saldo >= 0 ? 'text-success' : 'text-tertiary'}>{euro(resultado.saldo)}</span>
              </div>
              <div className="budget-row">
                <span>Sobre los ingresos</span>
                <span>{resultado.porcentajeLibre === null ? '—' : porcentaje(resultado.porcentajeLibre, 1)}</span>
              </div>
            </div>
          </div>

          <p className="gastos-enlace">
            Estos datos se usan en <Link to="/gastos/presupuestos">Presupuesto y ahorro</Link>, donde puedes
            tener un presupuesto del hogar y otro personal para cada uno.
          </p>

          <ul className="gastos-avisos">
            {resultado.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
            <li>Lo que aparto para ahorrar cuenta como gasto: «libre» es lo que sobra después de todo.</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default GastosFamiliares
