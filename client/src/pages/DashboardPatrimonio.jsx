import './DashboardPatrimonio.css'

/**
 * DashboardPatrimonio - Vista consolidada de activos
 * Combina inmobiliarios, mobiliarios y cuentas
 */

const DashboardPatrimonio = () => {
  // Datos mock para la demo
  const patrimonio = {
    inmobiliario: {
      valor: 350000,
      rentaAnual: 14000,
      items: [
        { tipo: 'Adquisiciones', valor: 280000 },
        { tipo: 'Plusvalías', valor: 50000 },
        { tipo: 'Depreciación acumulada', valor: -20000 }
      ]
    },
    mobiliario: {
      valor: 150000,
      rentaAnual: 8000,
      items: [
        { tipo: 'Prima inicial', valor: 120000 },
        { tipo: 'Gastos financieros', valor: -20000 },
        { tipo: 'Plusvalías', valor: 10000 }
      ]
    },
    cuentas: {
      valor: 85000,
      rentaAnual: 4250,
      items: [
        { tipo: 'Inversiones', valor: 70000 },
        { tipo: 'Ahorro', valor: 15000 }
      ]
    }
  }

  const totalPatrimonio =
    patrimonio.inmobiliario.valor +
    patrimonio.mobiliario.valor +
    patrimonio.cuentas.valor

  const categorias = [
    {
      nombre: 'Inmobiliario',
      valor: patrimonio.inmobiliario.valor,
      renta: patrimonio.inmobiliario.rentaAnual,
      porcentaje: (patrimonio.inmobiliario.valor / totalPatrimonio) * 100
    },
    {
      nombre: 'Mobiliario',
      valor: patrimonio.mobiliario.valor,
      renta: patrimonio.mobiliario.rentaAnual,
      porcentaje: (patrimonio.mobiliario.valor / totalPatrimonio) * 100
    },
    {
      nombre: 'Cuentas',
      valor: patrimonio.cuentas.valor,
      renta: patrimonio.cuentas.rentaAnual,
      porcentaje: (patrimonio.cuentas.valor / totalPatrimonio) * 100
    }
  ]

  const rentasTotales =
    patrimonio.inmobiliario.rentaAnual +
    patrimonio.mobiliario.rentaAnual +
    patrimonio.cuentas.rentaAnual

  const eur = (n) => `${Math.round(n).toLocaleString('es-ES')} €`
  const [totalEntero, totalDecimales] = totalPatrimonio
    .toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(',')

  const rentaMax = Math.max(...categorias.map((c) => c.renta))
  const colores = ['var(--primary)', 'var(--secondary)', 'var(--outline)']

  // Segmentos del donut: cada uno empieza donde acaba el anterior
  let acumulado = 0
  const segmentos = categorias.map((cat, idx) => {
    const segmento = { ...cat, color: colores[idx], inicio: acumulado }
    acumulado += cat.porcentaje
    return segmento
  })

  return (
    <div className="patrimonio-dashboard">
      <header className="totem">
        <div>
          <p className="totem-label">Patrimonio total</p>
          <p className="totem-valor">
            {totalEntero}
            <span className="totem-decimales">,{totalDecimales} €</span>
          </p>
        </div>
        <div className="totem-resumen">
          <div className="totem-tarjeta">
            <span className="label-sm">Renta anual</span>
            <span className="totem-cifra totem-cifra-primary">{eur(rentasTotales)}</span>
          </div>
          <div className="totem-tarjeta">
            <span className="label-sm">Renta mensual media</span>
            <span className="totem-cifra">{eur(rentasTotales / 12)}</span>
          </div>
        </div>
      </header>

      <div className="grid-asimetrico">
        <section className="panel panel-profundo">
          <h2 className="panel-titulo">Renta por categoría</h2>
          <p className="panel-subtitulo">Renta anual de cada bloque del patrimonio</p>
          <div className="chart-bars" role="img" aria-label="Renta anual por categoría">
            {categorias.map((cat, idx) => (
              <div key={cat.nombre} className="chart-columna">
                <span className="chart-valor">{eur(cat.renta)}</span>
                <div
                  className="chart-bar"
                  style={{
                    height: `${(cat.renta / rentaMax) * 100}%`,
                    background: colores[idx]
                  }}
                />
                <span className="chart-etiqueta">{cat.nombre}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-titulo">Distribución del patrimonio</h2>
          <div className="donut">
            <svg viewBox="0 0 36 36" className="donut-svg" role="img" aria-label="Distribución por categoría">
              {segmentos.map((seg) => (
                <circle
                  key={seg.nombre}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="4"
                  strokeDasharray={`${seg.porcentaje} ${100 - seg.porcentaje}`}
                  strokeDashoffset={-seg.inicio}
                />
              ))}
            </svg>
            <div className="donut-centro">
              <span className="donut-total">100%</span>
              <span className="label-sm">Total</span>
            </div>
          </div>
          <ul className="leyenda">
            {segmentos.map((seg) => (
              <li key={seg.nombre}>
                <span className="leyenda-punto" style={{ background: seg.color }} />
                <span className="leyenda-nombre">{seg.nombre}</span>
                <span className="leyenda-valor">{seg.porcentaje.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="metrics">
        <h2 className="seccion-titulo">Indicadores clave</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Ratio patrimonio/renta</span>
            <span className="metric-value">
              {(totalPatrimonio / rentasTotales).toFixed(1)}x
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Rendimiento patrimonial</span>
            <span className="metric-value">
              {((rentasTotales / totalPatrimonio) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Liquidez</span>
            <span className="metric-value">
              {(patrimonio.cuentas.valor / totalPatrimonio * 100).toFixed(0)}%
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Diversificación</span>
            <span className="metric-value">{categorias.length} categorías</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPatrimonio
