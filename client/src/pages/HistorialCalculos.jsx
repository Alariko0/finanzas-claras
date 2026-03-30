/**
 * HistorialCalculos.jsx - Vista de historial de cálculos
 * Lista de cálculos guardados en backend MongoDB
 *
 * @see ../utils/api.js - Funciones de autenticación
 */
'use client'

import { useState } from 'react'
import { calculos, obtenerToken } from '../utils/api'
import './HistorialCalculos.css'

/**
 * HistorialCalculos - Lista de cálculos guardados
 * Conectado con backend API en Fase 7
 */

const HistorialCalculos = () => {
  // Mock data - Se conectará con la API en Fase 7
  const calculos = [
    {
      id: 1,
      tipo: 'IRPF',
      fecha: '2026-03-28 14:30',
      resultado: '12.450 €',
      detalle: 'Castilla y León - 25.000€ rendimiento'
    },
    {
      id: 2,
      tipo: 'Hipoteca',
      fecha: '2026-03-27 10:15',
      resultado: '850 € /mes',
      detalle: '180.000€ - 30 años - 3% TAE'
    },
    {
      id: 3,
      tipo: 'Nómina',
      fecha: '2026-03-26 16:45',
      resultado: '2.890 € /mes',
      detalle: '2.500€ bruto - Madrid'
    }
  ]

  const tipos = ['Todos', 'IRPF', 'Hipoteca', 'Nómina', 'Inversión', 'Viajes']

  const [filtro, setFiltro] = useState('Todos')

  const calculosFiltrados = filtro === 'Todos'
    ? calculos
    : calculos.filter((c) => c.tipo === filtro)

  return (
    <div className="historial-page">
      <div className="page-header">
        <h1>Historial de Cálculos</h1>
        <p>Vista de tus cálculos guardados</p>
      </div>

      <section className="filters">
        <div className="filter-group">
          <span className="filter-label">Filtrar por:</span>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="filter-select"
          >
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="calculos-list">
        {calculosFiltrados.length > 0 ? (
          calculosFiltrados.map((calc) => (
            <div key={calc.id} className="calculo-card">
              <div className="calculo-header">
                <h3>{calc.tipo}</h3>
                <span className="calculo-type">{calc.tipo}</span>
              </div>
              <div className="calculo-result">
                <span className="result-label">Resultado:</span>
                <span className="result-value">{calc.resulto}</span>
              </div>
              <div className="calculo-date">
                <span className="date-label">Fecha:</span>
                <span>{calc.fecha}</span>
              </div>
              <div className="calculo-detail">
                <span className="detail-label">Detalle:</span>
                <span>{calc.detalle}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No hay cálculos registrados con este filtro.</p>
          </div>
        )}
      </section>

      <section className="help-section">
        <h3>¿Qué es el historial?</h3>
        <p>
          Cada cálculo que realizas se guarda automáticamente para consultarlo más tarde.
          Puedes filtrar por tipo de cálculo y ver los resultados principales.
        </p>
        <p>
          <strong>Próximamente:</strong> Exportar a CSV, compartir con otros usuarios,
          y sincronización entre dispositivos.
        </p>
      </section>
    </div>
  )
}

export default HistorialCalculos
