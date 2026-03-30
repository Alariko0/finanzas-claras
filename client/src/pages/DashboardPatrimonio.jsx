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

  return (
    <div className="patrimonio-dashboard">
      <div className="page-header">
        <h1>Dashboard de Patrimonio</h1>
        <p className="page-subtitle">
          Vista consolidada de todos tus activos
        </p>
      </div>

      <section className="summary-cards">
        <div className="summary-card">
          <span className="label-sm">Patrimonio Total</span>
          <span className="display-lg">{Math.round(totalPatrimonio).toLocaleString('es-ES')} €</span>
        </div>
        <div className="summary-card">
          <span className="label-sm">Renta Anual Total</span>
          <span className="display-lg">{Math.round(rentasTotales).toLocaleString('es-ES')} €</span>
        </div>
        <div className="summary-card">
          <span className="label-sm">Renta Mensual Media</span>
          <span className="display-lg">{Math.round(rentasTotales / 12).toLocaleString('es-ES')} €</span>
        </div>
        <div className="summary-card">
          <span className="label-sm">Activos</span>
          <span className="display-lg">{Object.keys(patrimonio).length}</span>
        </div>
      </section>

      <section className="category-breakdown">
        <h2>Desglose por Categoría</h2>
        {categorias.map((cat, idx) => (
          <div key={idx} className="category-item">
            <div>
              <div className="category-name">{cat.nombre}</div>
              <div className="category-renta">{cat.renta.toLocaleString('es-ES')} €/año</div>
            </div>
            <div className="category-bar-container">
              <div
                className="category-bar"
                style={{ width: `${cat.porcentaje}%` }}
              />
            </div>
            <div className="category-percentage">{cat.porcentaje.toFixed(1)}%</div>
          </div>
        ))}
      </section>

      <section className="cash-flow">
        <h2>Evolución de la Renta</h2>
        <div className="chart-bars">
          {categorias.map((cat, idx) => (
            <div
              key={idx}
              className="chart-bar"
              style={{
                height: `${(cat.renta / Math.max(...categorias.map(c => c.renta))) * 150}px`,
                backgroundColor: idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--secondary)' : 'var(--tertiary)'
              }}
            >
              <span className="bar-label">{cat.nombre.substring(0, 3)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="metrics">
        <h2>Indicadores Clave</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Ratio Patrimonio/Renta</span>
            <span className="metric-value">
              {(totalPatrimonio / rentasTotales).toFixed(1)}x
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Rendimiento Patrimonial</span>
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
            <span className="metric-value">3 categorías</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPatrimonio
