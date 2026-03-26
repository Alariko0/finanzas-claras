import { useState, useEffect } from 'react'
import './DetalleActivo.css'

/**
 * Página: Detalle de Activo
 * Análisis detallado de un activo individual
 * Referencia: Lógica de liquidación de viajes (ID: 9b3ce2789e85413aa33a82f32e2c3dfc)
 */

const DetalleActivo = ({ activoId = 1 }) => {
  const [activo, setActivo] = useState({
    nombre: 'Propiedad Centro',
    tipo: 'inmobiliario',
    adquisicionFecha: '2024-01-15',
    adquisicionPrecio: 250000,
    valorActual: 265000,
    ingresosMensuales: 1800,
    gastosMensuales: 450,
    flujoCajal: 1350,
    historial: [
      { fecha: '2024-01', valor: 250000 },
      { fecha: '2024-06', valor: 258000 },
      { fecha: '2024-12', valor: 262000 },
      { fecha: '2025-02', valor: 265000 }
    ]
  })

  // Calculo de métricas
  const gananciaTotal = activo.valorActual - activo.adquisicionPrecio
  const porcentajeGanancia = ((gananciaTotal / activo.adquisicionPrecio) * 100).toFixed(1)
  const flujoAnual = activo.flujoCajal * 12
  const yearsBreakeven = Math.max(1, Math.round(activo.adquisicionPrecio / flujoAnual))
  const roiAnual = ((flujoAnual / activo.adquisicionPrecio) * 100).toFixed(1)
  const apalancamiento = ((activo.valorActual - activo.flujoCajal * 12) / activo.flujoCajal * 100).toFixed(1)

  // Simulación de datos del backend
  useEffect(() => {
    // Fetch desde backend cuando activoId cambie
    // const fetchActivo = async () => {
    //   const response = await fetch(`/api/activos/${activoId}`)
    //   const data = await response.json()
    //   setActivo(data.activo)
    // }
    // fetchActivo()
  }, [activoId])

  return (
    <div className="detalle-activo-page">
      <div className="page-header">
        <h1>{activo.nombre}</h1>
        <p className="page-subtitle">Análisis detallado del activo</p>
      </div>

      <div className="detalle-header-cards">
        <div className="header-card surface-container-lowest">
          <span className="header-label">Valor Actual</span>
          <span className="display-lg text-primary-fixed-dim">{activo.valorActual.toLocaleString('es-ES')} €</span>
        </div>

        <div className="header-card">
          <span className="header-label">Inversión</span>
          <span>{activo.adquisicionPrecio.toLocaleString('es-ES')} €</span>
        </div>

        <div className="header-card highlight">
          <span className="header-label">Ganancia</span>
          <span className="text-success">{gananciaTotal.toLocaleString('es-ES')} € ({porcentajeGanancia}%)</span>
        </div>
      </div>

      <div className="detalle-metrics">
        <h2 className="headline-md">Métricas Financieras</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Flujo de Caja Anual</span>
            <span className="metric-value">{flujoAnual.toLocaleString('es-ES')} €</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">ROI Anual</span>
            <span className="metric-value">{roiAnual}%</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Años hasta Pagar</span>
            <span className="metric-value">{yearsBreakeven} años</span>
          </div>

          <div className="metric-card highlight">
            <span className="metric-label">Ahorro Mensual</span>
            <span className="metric-value text-primary">{activo.flujoCajal} €</span>
          </div>
        </div>
      </div>

      <div className="detalle-historial">
        <h2 className="headline-md">Historial de Valor</h2>
        <div className="chart-container">
          <div className="chart-bars">
            {activo.historial.map((punto, idx) => {
              const altura = ((punto.valor / activo.valorActual) * 100).toFixed(1)
              return (
                <div key={idx} className="bar-container">
                  <div
                    className="bar"
                    style={{
                      height: `${altura}%`,
                      background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-container) 100%)'
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="chart-labels">
            {activo.historial.map((punto, idx) => (
              <span key={idx} className="label">{punto.fecha}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="detalle-ingresos">
        <h2 className="headline-md">Ingresos y Gastos</h2>
        <div className="ingresos-table">
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Mensual</th>
                <th>Anual</th>
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Alquiler Neto</td>
                <td className="positive">{activo.ingresosMensuales} €</td>
                <td className="positive">{(activo.ingresosMensuales * 12).toLocaleString('es-ES')} €</td>
                <td>Incluye gastos de comunidad</td>
              </tr>
              <tr>
                <td>Gastos Mantenimiento</td>
                <td className="negative">-{activo.gastosMensuales} €</td>
                <td className="negative">-{(activo.gastosMensuales * 12).toLocaleString('es-ES')} €</td>
                <td>Mantenimiento, seguros</td>
              </tr>
              <tr>
                <td>Impuestos</td>
                <td className="negative">-400 €</td>
                <td className="negative">-4.800 €</td>
                <td>IRPF anual</td>
              </tr>
              <tr className="highlight">
                <td>Flujo de Caja</td>
                <td className="positive">{activo.flujoCajal} €</td>
                <td className="positive">{flujoAnual.toLocaleString('es-ES')} €</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="detalle-proyeccion">
        <h2 className="headline-md">Proyección a 10 años</h2>
        <div className="proyeccion-cards">
          <div className="proyeccion-card">
            <span className="proyeccion-label">Valor Estimado</span>
            <span className="display-lg">{Math.round(activo.valorActual * 1.65).toLocaleString('es-ES')} €</span>
            <span className="proyeccion-sub">+65% valor</span>
          </div>

          <div className="proyeccion-card">
            <span className="proyeccion-label">Ingresos Totales</span>
            <span className="display-lg">{Math.round(activo.ingresosMensuales * 120).toLocaleString('es-ES')} €</span>
            <span className="proyeccion-sub">120 meses</span>
          </div>

          <div className="proyeccion-card highlight">
            <span className="proyeccion-label">Ganancia Total</span>
            <span className="display-lg text-primary">
              {Math.round(gananciaTotal + activo.flujoCajal * 120).toLocaleString('es-ES')} €
            </span>
            <span className="proyeccion-sub">Valor + Ingresos</span>
          </div>
        </div>
      </div>

      <div className="detalle-notas">
        <h2 className="headline-md">Notas</h2>
        <div className="notas-list">
          <div className="nota-item">
            <strong>📅 Fecha de Adquisición:</strong> {activo.adquisicionFecha}
          </div>
          <div className="nota-item">
            <strong>📊 Valoración Actual:</strong> Basado en comparables de mercado
          </div>
          <div className="nota-item">
            <strong>💡 Recomendación:</strong> Considera amortización si encuentras oportunidad de plusvalía
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetalleActivo
