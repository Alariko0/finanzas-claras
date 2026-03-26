import { useState } from 'react'
import './PresupuestosAhorro.css'

/**
 * Página: Presupuestos y Ahorro
 * Planificación financiera personal
 */

const PresupuestosAhorro = () => {
  const [renda, setRenda] = useState(3000)
  const [porcentajeAhorro, setPorcentajeAhorro] = useState(10)
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: 'Necesidades', porcentaje: 50, monto: 1500 },
    { id: 2, nombre: 'Deseos', porcentaje: 20, monto: 600 },
    { id: 3, nombre: 'Ahorro', porcentaje: 10, monto: 300 },
    { id: 4, nombre: 'Inversión', porcentaje: 10, monto: 300 },
    { id: 5, nombre: 'Imprevistos', porcentaje: 10, monto: 300 }
  ])

  const total = categorias.reduce((sum, c) => sum + c.monto, 0)
  const saldo = renda - total
  const objetivoAhorro = 10000
  const porcentajeProgreso = Math.min(100, (300 / objetivoAhorro) * 100)

  return (
    <div className="presupuestos-page">
      <div className="page-header">
        <h1>Presupuestos y Ahorro</h1>
        <p className="page-subtitle">
          Planifica tu mes financiero con el método 50/30/20
        </p>
      </div>

      <div className="presupuestos-controls">
        <div className="control-group">
          <label htmlFor="renda" className="label-sm">Renda Mensual</label>
          <input
            id="renda"
            type="number"
            value={renda}
            onChange={(e) => setRenda(parseInt(e.target.value) || 0)}
            className="input-field"
            min="0"
            max="100000"
          />
        </div>

        <div className="control-group">
          <label htmlFor="porcentajeAhorro" className="label-sm">Objetivo Ahorro (% mensual)</label>
          <input
            id="porcentajeAhorro"
            type="number"
            value={porcentajeAhorro}
            onChange={(e) => setPorcentajeAhorro(parseInt(e.target.value) || 0)}
            className="input-field"
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="presupuestos-metodo">
        <div className="metodo-card">
          <div className="metodo-header">
            <h3 className="headline-sm">Necesidades (50%)</h3>
            <span className="metodo-value">
              {categorias.find(c => c.nombre === 'Necesidades')?.monto} €
            </span>
          </div>
          <div className="metodo-bar">
            <div className="metodo-fill needs"></div>
          </div>
        </div>

        <div className="metodo-card">
          <div className="metodo-header">
            <h3 className="headline-sm">Deseos (30%)</h3>
            <span className="metodo-value">
              {categorias.find(c => c.nombre === 'Deseos')?.monto} €
            </span>
          </div>
          <div className="metodo-bar">
            <div className="metodo-fill wants"></div>
          </div>
        </div>

        <div className="metodo-card highlight">
          <div className="metodo-header">
            <h3 className="headline-sm">Ahorro (20%)</h3>
            <span className="metodo-value">
              {categorias.find(c => c.nombre === 'Ahorro')?.monto} €
            </span>
          </div>
          <div className="metodo-bar">
            <div className="metodo-fill savings"></div>
          </div>
        </div>
      </div>

      <div className="presupuestos-categorias">
        <h2 className="headline-md">Distribución Detallada</h2>
        <div className="categorias-grid">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="categoria-card"
              style={{
                gridColumn: categoria.nombre === 'Necesidades' ? 'span 2' : undefined,
                background:
                  categoria.nombre === 'Necesidades'
                    ? 'var(--surface-container)'
                    : categoria.nombre === 'Deseos'
                    ? 'var(--surface-variant)'
                    : 'var(--surface-container-highest)'
              }}
            >
              <div className="categoria-header">
                <span className="categoria-icon">
                  {categoria.nombre === 'Necesidades' ? '🏠' :
                   categoria.nombre === 'Deseos' ? '🎉' :
                   categoria.nombre === 'Ahorro' ? '🐷' : '📈'}
                </span>
                <span className="categoria-nombre">{categoria.nombre}</span>
              </div>
              <div className="categoria-info">
                <span>{(categoria.porcentaje).toFixed(0)}%</span>
                <span>{categoria.monto.toLocaleString('es-ES')} €</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="presupuestos-meta">
        <div className="meta-card">
          <h3 className="title-lg">Ahorro en Progreso</h3>
          <div className="meta-bar">
            <div
              className="meta-fill"
              style={{
                width: `${porcentajeProgreso}%`,
                background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-container) 100%)'
              }}
            />
          </div>
          <div className="meta-info">
            <span>300 de {objetivoAhorro.toLocaleString('es-ES')} €</span>
            <span>{porcentajeProgreso.toFixed(1)}%</span>
          </div>
        </div>

        <div className="meta-card">
          <h3 className="title-lg">Saldo Mensual</h3>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="label-sm">Ahorro Disponible</span>
            <span className="display-lg">
              {Math.round(saldo).toLocaleString('es-ES')} €
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PresupuestosAhorro
