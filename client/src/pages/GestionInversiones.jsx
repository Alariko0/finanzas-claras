import { useState } from 'react'
import './GestionInversiones.css'

/**
 * Página: Gestión de Inversiones
 * Portafolio completo de activos de inversión
 */

const GestionInversiones = () => {
  const [activos, setActivos] = useState([
    { id: 1, nombre: 'Propiedad Centro', tipo: 'inmobiliario', adquisicion: 175000, valorActual: 185000, ingresos: 1200, gastos: 450, categoria: 'Inmobiliario' },
    { id: 2, nombre: 'ETF S&P 500', tipo: 'acciones', adquisicion: 15000, valorActual: 18500, ingresos: 350, gastos: 20, categoria: 'Mercado' },
    { id: 3, nombre: 'Bonos del Estado', tipo: 'fondos', adquisicion: 50000, valorActual: 52000, ingresos: 800, gastos: 100, categoria: 'Deuda' },
    { id: 4, nombre: 'Acciones Tech', tipo: 'acciones', adquisicion: 20000, valorActual: 24500, ingresos: 0, gastos: 50, categoria: 'Mercado' },
    { id: 5, nombre: 'Fondo Robo', tipo: 'fondos', adquisicion: 10000, valorActual: 11200, ingresos: 150, gastos: 30, categoria: 'Mercado' }
  ])

  const totalInversion = activos.reduce((sum, a) => sum + a.adquisicion, 0)
  const totalValor = activos.reduce((sum, a) => sum + a.valorActual, 0)
  const ganancia = totalValor - totalInversion
  const porcentajeGanancia = ((ganancia / totalInversion) * 100).toFixed(2)
  const ingresosTotales = activos.reduce((sum, a) => sum + a.ingresos, 0)
  const gastosTotales = activos.reduce((sum, a) => sum + a.gastos, 0)
  const flujoCajal = ingresosTotales - gastosTotales

  const tiposActivos = [
    { id: 'acciones', nombre: 'Acciones', color: '#008560' },
    { id: 'inmobiliario', nombre: 'Inmobiliario', color: '#3e6655' },
    { id: 'fondos', nombre: 'Fondos', color: '#993f3a' },
    { id: 'cripto', nombre: 'Cripto', color: '#ba1a1a' }
  ]

  const categorias = ['Mercado', 'Inmobiliario', 'Deuda']

  return (
    <div className="inversion-page">
      <div className="page-header">
        <h1>Gestión de Inversiones</h1>
        <p className="page-subtitle">
          Vista consolidada de todos tus activos
        </p>
      </div>

      <div className="inversion-summary">
        <div className="summary-card surface-container-lowest">
          <span className="summary-label">Valor Total del Portafolio</span>
          <div className="balance-totem text-primary-fixed-dim">
            <span className="display-lg">{totalValor.toLocaleString('es-ES')} €</span>
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-label">Ganancia/Prerimiento</span>
          <span className={ganancia >= 0 ? 'text-success' : 'text-tertiary'}>
            {ganancia >= 0 ? '+' : ''}{ganancia.toFixed(2)} € ({porcentajeGanancia}%)
          </span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Ingresos Totales</span>
          <span className="text-primary">{ingresosTotales.toLocaleString('es-ES')} €/mes</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Flujo de Caja</span>
          <span className={flujoCajal >= 0 ? 'text-success' : 'text-tertiary'}>
            {flujoCajal >= 0 ? '+' : ''}{flujoCajal.toLocaleString('es-ES')} €/mes
          </span>
        </div>
      </div>

      <div className="inversion-allocation">
        <h2 className="headline-md">Distribución del Portafolio</h2>
        <div className="allocation-grid">
          {categorias.map((categoria) => {
            const categoriaActivos = activos.filter(a => a.categoria === categoria)
            const categoriaValor = categoriaActivos.reduce((sum, a) => sum + a.valorActual, 0)
            const porcentaje = ((categoriaValor / totalValor) * 100).toFixed(1)

            return (
              <div key={categoria} className="allocation-item">
                <span className="allocation-label">{categoria}</span>
                <span className="allocation-value">
                  {categoriaValor.toLocaleString('es-ES')} € ({porcentaje}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="inversion-activos">
        <h2 className="headline-md">Mis Activos</h2>
        <div className="activos-grid">
          {activos.map((activo) => (
            <div key={activo.id} className="activo-card">
              <div className="activo-header">
                <span className="activo-icon">
                  {activo.tipo === 'acciones' ? '📈' :
                   activo.tipo === 'inmobiliario' ? '🏠' : '💰'}
                </span>
                <span className="activo-nombre">{activo.nombre}</span>
                <span className="activo-tipo">{activo.categoria}</span>
              </div>
              <div className="activo-info">
                <div className="info-row">
                  <span className="info-label">Valor</span>
                  <span className="info-value">{activo.valorActual.toLocaleString('es-ES')} €</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Inversión Inicial</span>
                  <span className="info-value">{activo.adquisicion.toLocaleString('es-ES')} €</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ingresos Mensuales</span>
                  <span className="info-value text-primary">{activo.ingresos} €</span>
                </div>
              </div>
              <div className="activo-ganancia">
                <span className="ganancia-label">
                  {(activo.valorActual - activo.adquisicion).toFixed(0)} € ({((activo.valorActual / activo.adquisicion - 1) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="inversion-tipos">
        <h2 className="headline-md">Tipos de Activos</h2>
        <div className="tipos-grid">
          {tiposActivos.map((tipo) => (
            <div
              key={tipo.id}
              className="tipo-card"
              style={{ backgroundColor: tipo.color + '20' }}
            >
              <div className="tipo-color" style={{ background: tipo.color }}></div>
              <span className="tipo-nombre">{tipo.nombre}</span>
              <span className="tipo-activos">
                {activos.filter(a => a.tipo === tipo.id).length} activos
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GestionInversiones
