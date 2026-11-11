/**
 * PresupuestosAhorro.jsx - Presupuestos mensuales y objetivo de ahorro
 * Un presupuesto del hogar y uno por persona (por ejemplo, para el dinero libre a fin de mes).
 * Dos modos: método 50/30/20 (porcentajes editables) o partidas libres. Los ingresos y lo gastado
 * de cada categoría se toman de «Gastos del hogar» (HogarContext) cuando hay datos. El cálculo se
 * hace en el servidor: POST /api/hogar/presupuesto. Aquí solo se recogen datos y se muestra el resultado.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icono from '../components/Icono'
import { configPresupuestoInicial, useHogar } from '../context/HogarContext'
import { hogar } from '../utils/api'
import { euro, porcentaje, plazoTexto } from '../utils/formato'
import useCalculo from '../hooks/useCalculo'
import './PresupuestosAhorro.css'

const MAX_PARTIDAS = 20
const BLOQUES = [
  { clave: 'necesidades', nombre: 'Necesidades', icono: 'hipotecas' },
  { clave: 'deseos', nombre: 'Deseos', icono: 'estrella' },
  { clave: 'ahorro', nombre: 'Ahorro', icono: 'ahorro' }
]
const ESTADOS = {
  dentro: ['Dentro del presupuesto', 'bien'],
  excedido: ['Te has pasado', 'mal'],
  cumplido: ['Objetivo cumplido', 'bien'],
  pordebajo: ['Por debajo del objetivo', 'mal']
}

const redondear = (n) => Math.round(n * 100) / 100
// Campo opcional: vacío = no se envía
const opcional = (texto) => (texto === '' ? undefined : Number(texto))

const PresupuestosAhorro = () => {
  const { personas, presupuestos, cambiarPresupuesto, nuevoId, resultado: reparto } = useHogar()

  const presupuestosDisponibles = [
    { clave: 'hogar', nombre: 'Hogar' },
    ...personas.map((p, i) => ({ clave: `persona-${p.id}`, nombre: p.nombre || `Persona ${i + 1}` }))
  ]
  const [elegido, setElegido] = useState('hogar')
  const activo = presupuestosDisponibles.some((p) => p.clave === elegido) ? elegido : 'hogar'
  const config = presupuestos[activo] ?? configPresupuestoInicial()
  const actualizar = (parche) => cambiarPresupuesto(activo, parche)
  const { modo, base, porcentajes, gastadoManual, partidas, objetivoAhorro, ahorroActual } = config

  // Datos que vienen de Gastos del hogar para el presupuesto elegido
  const indicePersona = personas.findIndex((p) => `persona-${p.id}` === activo)
  const fila = activo === 'hogar' ? reparto : reparto?.personas?.[indicePersona]
  const datos = fila && {
    ingresos: activo === 'hogar' ? fila.totalIngresos : fila.ingresoMensual,
    real: fila.realPorCategoria,
    libre: fila.saldo
  }
  const sincronizado = Boolean(datos) && datos.ingresos > 0
  const sobreLibre = sincronizado && base === 'libre'

  const ingresoMensual = sincronizado ? (sobreLibre ? Math.max(0, datos.libre) : datos.ingresos) : config.ingresoManual
  const gastadoSincronizado = sincronizado && !sobreLibre

  const sumaPorcentajes = redondear(
    modo === '50-30-20'
      ? BLOQUES.reduce((s, b) => s + porcentajes[b.clave], 0)
      : partidas.reduce((s, p) => s + p.porcentaje, 0)
  )

  let invalido = ''
  if (!(ingresoMensual > 0)) {
    invalido = sobreLibre
      ? 'No te queda dinero libre este mes: los gastos igualan o superan los ingresos.'
      : 'Indica los ingresos mensuales (o rellénalos en Gastos del hogar).'
  } else if (modo === '50-30-20' && sumaPorcentajes !== 100) {
    invalido = `Los porcentajes deben sumar 100 (ahora suman ${sumaPorcentajes}).`
  } else if (modo === 'libre' && partidas.length === 0) {
    invalido = 'Añade al menos una partida.'
  } else if (modo === 'libre' && partidas.some((p) => !(p.porcentaje > 0))) {
    invalido = 'Cada partida necesita un porcentaje mayor que 0.'
  } else if (modo === 'libre' && sumaPorcentajes > 100) {
    invalido = `Los porcentajes no pueden superar 100 (ahora suman ${sumaPorcentajes}).`
  } else if (opcional(objetivoAhorro) !== undefined && !(Number(objetivoAhorro) > 0)) {
    invalido = 'El objetivo de ahorro debe ser mayor que 0.'
  }

  const gastado = gastadoSincronizado
    ? datos.real
    : sobreLibre
      ? {}
      : Object.fromEntries(
          BLOQUES.filter((b) => gastadoManual[b.clave] !== '').map((b) => [b.clave, Number(gastadoManual[b.clave])])
        )

  const entrada = {
    modo,
    ingresoMensual,
    ...(modo === '50-30-20'
      ? { porcentajes, gastado }
      : {
          partidas: partidas.map((p) => ({
            nombre: p.nombre,
            porcentaje: p.porcentaje,
            ahorro: p.ahorro,
            ...(p.gastado === '' ? {} : { gastado: Number(p.gastado) })
          }))
        }),
    ...(opcional(objetivoAhorro) !== undefined ? { objetivoAhorro: Number(objetivoAhorro) } : {}),
    ...(opcional(ahorroActual) !== undefined ? { ahorroActual: Number(ahorroActual) } : {})
  }
  const { resultado, error, cargando } = useCalculo(hogar.presupuesto, entrada, { invalido })

  const importe = (e) => Math.min(10000000, Math.max(0, Number(e.target.value) || 0))
  const pct = (e) => Math.min(100, Math.max(0, Number(e.target.value) || 0))
  const cambiarPartida = (id, campo, valor) =>
    actualizar({ partidas: partidas.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)) })

  return (
    <div className="presupuestos-page">
      <div className="page-header">
        <h1>Presupuesto y ahorro</h1>
        <p className="page-subtitle">
          Reparte el ingreso mensual del hogar, o el de cada persona, con el método 50/30/20 o con partidas propias,
          y calcula cuánto tardas en alcanzar un objetivo de ahorro. Es una estimación orientativa.
        </p>
      </div>

      <div className="presupuestos-modo">
        <div className="selector-group" role="group" aria-label="Presupuesto">
          {presupuestosDisponibles.map((p) => (
            <button
              key={p.clave}
              type="button"
              className={activo === p.clave ? 'active' : ''}
              onClick={() => setElegido(p.clave)}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="presupuestos-controls">
        {sincronizado ? (
          <div className="control-group">
            <label htmlFor="base">Presupuestar sobre</label>
            <select id="base" value={base} onChange={(e) => actualizar({ base: e.target.value })} className="input-field">
              <option value="ingresos">Ingresos: {euro(datos.ingresos)}</option>
              <option value="libre">Dinero libre tras los gastos: {euro(Math.max(0, datos.libre))}</option>
            </select>
          </div>
        ) : (
          <div className="control-group">
            <label htmlFor="ingreso">Ingresos mensuales netos (€)</label>
            <input
              id="ingreso"
              type="number"
              value={config.ingresoManual}
              onChange={(e) => actualizar({ ingresoManual: importe(e) })}
              className="input-field"
              min="0"
              max="10000000"
            />
          </div>
        )}
        <div className="control-group">
          <label htmlFor="objetivo">Objetivo de ahorro (€, opcional)</label>
          <input
            id="objetivo"
            type="number"
            value={objetivoAhorro}
            onChange={(e) => actualizar({ objetivoAhorro: e.target.value })}
            className="input-field"
            min="0"
            placeholder="Por ejemplo, 10000"
          />
        </div>
        <div className="control-group">
          <label htmlFor="ahorrado">Ya ahorrado (€, opcional)</label>
          <input
            id="ahorrado"
            type="number"
            value={ahorroActual}
            onChange={(e) => actualizar({ ahorroActual: e.target.value })}
            className="input-field"
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      <p className="presupuestos-origen">
        {sincronizado
          ? <>Ingresos y gastos tomados de <Link to="/gastos">Gastos del hogar</Link>.{' '}
              {sobreLibre ? 'Sobre el dinero libre no se compara con lo gastado, porque los gastos ya están descontados.' : ''}</>
          : <>Sin datos en <Link to="/gastos">Gastos del hogar</Link> para este presupuesto: escribe los ingresos a mano o rellénalos allí.</>}
      </p>

      <div className="presupuestos-modo">
        <div className="selector-group" role="group" aria-label="Método de presupuesto">
          <button type="button" className={modo === '50-30-20' ? 'active' : ''} onClick={() => actualizar({ modo: '50-30-20' })}>
            Método 50/30/20
          </button>
          <button type="button" className={modo === 'libre' ? 'active' : ''} onClick={() => actualizar({ modo: 'libre' })}>
            Partidas libres
          </button>
        </div>
      </div>

      {modo === '50-30-20' ? (
        <div className="presupuestos-editor">
          <p className="presupuestos-ayuda">
            Necesidades, deseos y ahorro. Por defecto 50/30/20, pero puedes cambiar los porcentajes mientras sumen 100.
            {gastadoSincronizado
              ? ' La columna «Real» sale de los gastos que has clasificado en Gastos del hogar.'
              : !sobreLibre && ' Si quieres comparar con lo que gastas de verdad, rellena la columna «Real».'}
          </p>
          <div className="presupuestos-fila presupuestos-fila-bloque presupuestos-fila-cabecera" aria-hidden="true">
            <span>Bloque</span><span>Porcentaje (%)</span><span>Real al mes (€)</span>
          </div>
          {BLOQUES.map((b) => (
            <div key={b.clave} className="presupuestos-fila presupuestos-fila-bloque">
              <span className="presupuestos-nombre"><Icono nombre={b.icono} tamano={20} /> {b.nombre}</span>
              <input
                type="number"
                aria-label={`Porcentaje de ${b.nombre}`}
                value={porcentajes[b.clave]}
                min="0"
                max="100"
                step="0.01"
                onChange={(e) => actualizar({ porcentajes: { ...porcentajes, [b.clave]: pct(e) } })}
                className="input-field"
              />
              <input
                type="number"
                aria-label={b.clave === 'ahorro' ? 'Ahorrado de verdad al mes' : `Gastado de verdad en ${b.nombre}`}
                value={gastadoSincronizado ? datos.real[b.clave] : sobreLibre ? '' : gastadoManual[b.clave]}
                min="0"
                placeholder={sobreLibre ? 'No aplica' : 'Opcional'}
                readOnly={gastadoSincronizado}
                disabled={sobreLibre}
                onChange={(e) => actualizar({ gastadoManual: { ...gastadoManual, [b.clave]: e.target.value } })}
                className="input-field"
              />
            </div>
          ))}
          <p className={`presupuestos-suma${sumaPorcentajes === 100 ? '' : ' mal'}`}>Suma: {sumaPorcentajes} %</p>
        </div>
      ) : (
        <div className="presupuestos-editor">
          <p className="presupuestos-ayuda">
            Crea tus propias partidas con su porcentaje. Si la suma es menor que 100, lo que falta queda sin asignar.
            Marca «Ahorro» en las partidas que cuentan como ahorro.
          </p>
          {partidas.length > 0 && (
            <div className="presupuestos-fila presupuestos-fila-partida presupuestos-fila-cabecera" aria-hidden="true">
              <span>Nombre</span><span>Porcentaje (%)</span><span>Real al mes (€)</span><span>Ahorro</span><span />
            </div>
          )}
          {partidas.map((p, i) => (
            <div key={p.id} className="presupuestos-fila presupuestos-fila-partida">
              <input
                type="text"
                aria-label={`Nombre de la partida ${i + 1}`}
                value={p.nombre}
                maxLength={50}
                placeholder="Vivienda, comida…"
                onChange={(e) => cambiarPartida(p.id, 'nombre', e.target.value)}
                className="input-field"
              />
              <input
                type="number"
                aria-label={`Porcentaje de ${p.nombre || `la partida ${i + 1}`}`}
                value={p.porcentaje}
                min="0"
                max="100"
                step="0.01"
                onChange={(e) => cambiarPartida(p.id, 'porcentaje', pct(e))}
                className="input-field"
              />
              <input
                type="number"
                aria-label={`Importe real de ${p.nombre || `la partida ${i + 1}`}`}
                value={p.gastado}
                min="0"
                placeholder="Opcional"
                onChange={(e) => cambiarPartida(p.id, 'gastado', e.target.value)}
                className="input-field"
              />
              <label className="presupuestos-check">
                <input
                  type="checkbox"
                  checked={p.ahorro}
                  onChange={(e) => cambiarPartida(p.id, 'ahorro', e.target.checked)}
                />
                <span>Ahorro</span>
              </label>
              <button
                type="button"
                className="presupuestos-quitar"
                onClick={() => actualizar({ partidas: partidas.filter((x) => x.id !== p.id) })}
              >
                Quitar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="action-button"
            disabled={partidas.length >= MAX_PARTIDAS}
            onClick={() => actualizar({
              partidas: [...partidas, { id: nuevoId(), nombre: '', porcentaje: 0, ahorro: false, gastado: '' }]
            })}
          >
            Añadir partida
          </button>
          {partidas.length > 0 && (
            <p className={`presupuestos-suma${sumaPorcentajes <= 100 ? '' : ' mal'}`}>Suma: {sumaPorcentajes} %</p>
          )}
        </div>
      )}

      {error && <p className="presupuestos-error" role="alert">{error}</p>}

      {resultado && (
        <div className={`presupuestos-resultado${cargando ? ' calculando' : ''}`} aria-busy={cargando}>
          <div className="presupuestos-categorias">
            <h2 className="headline-md">Distribución mensual</h2>
            <div className="categorias-grid">
              {resultado.partidas.map((p) => (
                <div key={p.clave} className="categoria-card">
                  <div className="categoria-header">
                    <span className="categoria-nombre">{p.nombre}</span>
                    <span>{porcentaje(p.porcentaje, 2)}</span>
                  </div>
                  <span className="categoria-importe">{euro(p.importe)}</span>
                  <div className="presupuestos-barra">
                    <div
                      className={`presupuestos-barra-relleno${p.ahorro ? ' ahorro' : ''}`}
                      style={{ width: `${p.porcentaje}%` }}
                    />
                  </div>
                  {p.estado && (
                    <div className="categoria-real">
                      <span>{p.ahorro ? 'Ahorrado' : 'Gastado'}: {euro(p.gastado)}</span>
                      <span className={ESTADOS[p.estado][1]}>
                        {ESTADOS[p.estado][0]} ({p.diferencia >= 0 ? '+' : ''}{euro(p.diferencia)})
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {resultado.sinAsignar > 0 && (
                <div className="categoria-card sin-asignar">
                  <div className="categoria-header">
                    <span className="categoria-nombre">Sin asignar</span>
                    <span>{porcentaje(resultado.porcentajeSinAsignar, 2)}</span>
                  </div>
                  <span className="categoria-importe">{euro(resultado.sinAsignar)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="presupuestos-meta">
            <div className="meta-card">
              <h3 className="title-lg">Tu ahorro</h3>
              <div className="balance-totem text-primary-fixed-dim">
                <span className="label-sm">Ahorro al mes</span>
                <span className="display-lg">{euro(resultado.ahorroMensual)}</span>
              </div>
              <div className="meta-info">
                <span>Al año: {euro(resultado.ahorroAnual)}</span>
                <span>{resultado.tasaAhorro === null ? '—' : porcentaje(resultado.tasaAhorro, 1)} de lo presupuestado</span>
              </div>
            </div>

            {resultado.meta && (
              <div className="meta-card">
                <h3 className="title-lg">Objetivo de ahorro</h3>
                <div className="meta-bar">
                  <div className="meta-fill" style={{ width: `${resultado.meta.progreso}%` }} />
                </div>
                <div className="meta-info">
                  <span>{euro(resultado.meta.ahorroActual)} de {euro(resultado.meta.objetivo)}</span>
                  <span>{porcentaje(resultado.meta.progreso, 1)}</span>
                </div>
                <div className="meta-info">
                  <span>
                    {resultado.meta.mesesParaObjetivo === null
                      ? 'No se alcanza con este presupuesto'
                      : resultado.meta.mesesParaObjetivo === 0
                        ? 'Objetivo alcanzado'
                        : `Lo alcanzas en ${plazoTexto(resultado.meta.mesesParaObjetivo)}`}
                  </span>
                  <span>Faltan {euro(resultado.meta.restante)}</span>
                </div>
              </div>
            )}
          </div>

          <ul className="presupuestos-avisos">
            {resultado.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

export default PresupuestosAhorro
