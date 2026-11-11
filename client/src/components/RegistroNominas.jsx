import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormularioRecibo from './FormularioRecibo'
import { nominas as nominasApi } from '../utils/api'
import { ANIO_FISCAL, useNominas } from '../context/NominasContext'
import { aFormulario, nombreMes, reciboInicial } from '../utils/recibo'
import { euro } from '../utils/formato'
import './RegistroNominas.css'

/**
 * RegistroNominas - Las nóminas reales del usuario mes a mes.
 * La vigente es la última ordinaria: sus datos no cambian hasta registrar otra más reciente, y de
 * ahí beben IRPF (acumulado y proyección), Gastos (ingresos) y Plan de pensiones (bases de cotización).
 * Una nómina nueva parte de los datos de la vigente: solo hay que cambiar lo que haya cambiado.
 */

const RegistroNominas = () => {
  const { nominas, resumen, cargando, error, conSesion, recargar } = useNominas()
  const [form, setForm] = useState(null) // null: se ve la lista; objeto: formulario abierto
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [avisosGuardado, setAvisosGuardado] = useState([])

  const vigente = nominas.find((n) => n.tipo === 'ordinaria')

  const abrirNueva = () => {
    const hoy = new Date()
    const siguiente = vigente ? (vigente.mes === 12 ? { anio: vigente.anio + 1, mes: 1 } : { anio: vigente.anio, mes: vigente.mes + 1 }) : { anio: ANIO_FISCAL, mes: hoy.getMonth() + 1 }
    const base = vigente ? aFormulario(vigente) : reciboInicial(siguiente.anio, siguiente.mes)
    setForm({ ...base, anio: String(siguiente.anio), mes: String(siguiente.mes), tipo: 'ordinaria', fechaCobro: '', liquidoDeclarado: '' })
    setEditandoId(null)
    setErrorGuardar('')
    setAvisosGuardado([])
  }

  const abrirEdicion = (n) => {
    setForm(aFormulario(n))
    setEditandoId(n.id)
    setErrorGuardar('')
    setAvisosGuardado([])
  }

  const cerrar = () => {
    setForm(null)
    setEditandoId(null)
    setErrorGuardar('')
  }

  const guardar = async (entrada) => {
    setGuardando(true)
    setErrorGuardar('')
    try {
      const { avisos } = editandoId ? await nominasApi.actualizar(editandoId, entrada) : await nominasApi.crear(entrada)
      setAvisosGuardado(avisos)
      await recargar()
      cerrar()
    } catch (e) {
      setErrorGuardar(e.errores?.[0]?.message || e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (n) => {
    if (!window.confirm(`¿Eliminar la nómina de ${nombreMes(n.mes)} de ${n.anio}?`)) return
    try {
      await nominasApi.eliminar(n.id)
      await recargar()
    } catch (e) {
      setErrorGuardar(e.message)
    }
  }

  if (form) {
    return (
      <section className="registro-nominas">
        <h2>{editandoId ? 'Editar nómina' : 'Añadir nómina'}</h2>
        {!editandoId && vigente && (
          <p className="registro-ayuda">
            Parte de tu última nómina ({nombreMes(vigente.mes)} de {vigente.anio}): cambia solo lo que haya cambiado.
          </p>
        )}
        <FormularioRecibo
          form={form}
          setForm={setForm}
          onGuardar={guardar}
          onCancelar={cerrar}
          guardando={guardando}
          conSesion={conSesion}
          error={errorGuardar}
          editando={!!editandoId}
        />
      </section>
    )
  }

  return (
    <section className="registro-nominas">
      <p className="registro-ayuda">
        Apunta lo que dice tu recibo, concepto a concepto. Tus datos no cambian hasta que cobres otra nómina y la
        registres: con ellos, el IRPF va calculando con tus cifras reales, Gastos conoce tus ingresos y el Plan de
        pensiones recibe tus bases de cotización mes a mes.
      </p>

      {!conSesion && (
        <p className="registro-aviso">
          <Link to="/account">Inicia sesión</Link> para guardar tus nóminas. Mientras tanto puedes rellenar una y ver sus totales.
        </p>
      )}
      {error && <p className="registro-error" role="alert">{error}</p>}
      {errorGuardar && <p className="registro-error" role="alert">{errorGuardar}</p>}
      {avisosGuardado.length > 0 && (
        <ul className="registro-avisos">
          {avisosGuardado.map((a) => <li key={a}>Nómina guardada, pero: {a}</li>)}
        </ul>
      )}

      <button type="button" className="action-button" onClick={abrirNueva}>
        {vigente ? 'Añadir la nómina de este mes' : 'Añadir mi primera nómina'}
      </button>

      {conSesion && cargando && nominas.length === 0 && <p className="registro-ayuda">Cargando tus nóminas…</p>}

      {resumen?.ultima && (
        <div className="registro-resumen">
          <div>
            <span className="label-sm">Última nómina (vigente)</span>
            <strong>{euro(resumen.ultima.liquido)}</strong>
            <small>{nombreMes(resumen.ultima.mes)} de {resumen.ultima.anio} · líquido</small>
          </div>
          <div>
            <span className="label-sm">Cobrado en {resumen.anio}</span>
            <strong>{euro(resumen.acumulado.liquido)}</strong>
            <small>{euro(resumen.acumulado.bruto)} brutos · IRPF retenido {euro(resumen.acumulado.irpf)}</small>
          </div>
          {resumen.proyeccion && (
            <div>
              <span className="label-sm">Previsto a diciembre</span>
              <strong>{euro(resumen.proyeccion.liquido)}</strong>
              <small>{euro(resumen.proyeccion.ingresoMensualMedio)} al mes de media</small>
            </div>
          )}
        </div>
      )}
      {resumen?.avisos.length > 0 && resumen.nominasRegistradas > 0 && (
        <ul className="registro-avisos">
          {resumen.avisos.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}

      {nominas.length > 0 && (
        <div className="registro-tabla-caja">
          <table className="registro-tabla">
            <thead>
              <tr>
                <th>Nómina</th>
                <th>Empresa</th>
                <th className="num">Bruto</th>
                <th className="num">Deducciones</th>
                <th className="num">Líquido</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {nominas.map((n) => (
                <tr key={n.id}>
                  <td>
                    {nombreMes(n.mes)} {n.anio}
                    {n.tipo === 'extra' && <span className="registro-etiqueta">Paga extra</span>}
                    {n.id === vigente?.id && <span className="registro-etiqueta vigente">Vigente</span>}
                  </td>
                  <td>{n.datos.encabezado?.empresa ?? '—'}</td>
                  <td className="num">{euro(n.totales.bruto)}</td>
                  <td className="num">{euro(n.totales.deducciones)}</td>
                  <td className="num">{euro(n.totales.liquido)}</td>
                  <td className="registro-acciones-fila">
                    <button type="button" onClick={() => abrirEdicion(n)}>Editar</button>
                    <button type="button" className="peligro" onClick={() => eliminar(n)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resumen?.ultima && (
        <p className="registro-enlaces">
          Estos datos ya se usan en <Link to="/irpf">IRPF</Link>, <Link to="/gastos">Gastos</Link> y{' '}
          <Link to="/jubilacion/pensiones">Plan de pensiones</Link>.
        </p>
      )}
    </section>
  )
}

export default RegistroNominas
