import { useState } from 'react'
import { euro, fechaCorta, porcentaje } from '../utils/formato'

const FILAS_INICIALES = 12

/**
 * Cuadro de amortización mensual: muestra las primeras cuotas y, bajo demanda, todas.
 * @param {{filas: Array, resumenAnual?: Array}} props - respuesta de /api/prestamos/cuadro
 */
export default function TablaAmortizacion({ filas, resumenAnual }) {
  const [vista, setVista] = useState('mensual')
  const [todo, setTodo] = useState(false)
  const visibles = todo ? filas : filas.slice(0, FILAS_INICIALES)

  return (
    <div>
      {resumenAnual && (
        <div className="selector-group">
          <button type="button" className={vista === 'mensual' ? 'active' : ''} onClick={() => setVista('mensual')}>
            Mensual
          </button>
          <button type="button" className={vista === 'anual' ? 'active' : ''} onClick={() => setVista('anual')}>
            Año a año
          </button>
        </div>
      )}

      <div className="tabla-container">
        {vista === 'mensual' ? (
          <table className="amortizacion-table">
            <thead>
              <tr>
                <th>Cuota</th>
                {filas[0].fecha && <th>Fecha</th>}
                {filas[0].tin !== undefined && <th>TIN</th>}
                <th>Importe</th>
                <th>Intereses</th>
                <th>Capital</th>
                <th>Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.numero}>
                  <td className="mes">{f.numero}</td>
                  {f.fecha && <td className="fecha">{fechaCorta(f.fecha)}</td>}
                  {f.tin !== undefined && <td>{porcentaje(f.tin)}</td>}
                  <td>{euro(f.cuota)}</td>
                  <td>{euro(f.intereses)}</td>
                  <td>{euro(f.capital)}</td>
                  <td>{euro(f.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="amortizacion-table">
            <thead>
              <tr>
                <th>Año</th>
                <th>Pagado</th>
                <th>Intereses</th>
                <th>Capital</th>
                <th>Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {resumenAnual.map((a) => (
                <tr key={a.anio}>
                  <td className="mes">{a.anio}</td>
                  <td>{euro(a.cuotas)}</td>
                  <td>{euro(a.intereses)}</td>
                  <td>{euro(a.capital)}</td>
                  <td>{euro(a.saldoFinal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {vista === 'mensual' && filas.length > FILAS_INICIALES && (
        <button type="button" className="action-button" onClick={() => setTodo((v) => !v)}>
          {todo ? 'Mostrar solo las primeras cuotas' : `Mostrar las ${filas.length} cuotas`}
        </button>
      )}
    </div>
  )
}
