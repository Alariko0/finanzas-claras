/**
 * PersonalizarModulos.jsx - Gestión de módulos activos
 * Toggle para activar/desactivar cada módulo
 *
 * @see design-system.md - Design tokens
 */
'use client'

import { useState } from 'react'
import './PersonalizarModulos.css'

/**
 * PersonalizarModulos - Grid de módulos con toggle
 */

const PersonalizarModulos = () => {
  const [modulos, setModulos] = useState({
    irpf: { nombre: 'IRPF', icon: '📊', desc: 'Cálculo de impuestos 2025', activo: true },
    nomina: { nombre: 'Nómina', icon: '💰', desc: 'Desglose salarial', activo: true },
    gastos: { nombre: 'Gastos', icon: '🛒', desc: 'Gastos compartidos', activo: true },
    hipoteca: { nombre: 'Hipotecas', icon: '🏠', desc: 'Simulador hipotecario', activo: true },
    inversion: { nombre: 'Inversión', icon: '📈', desc: 'Gestión cartera', activo: true },
    jubilation: { nombre: 'Jubilación', icon: '📅', desc: 'Planificación', activo: true },
    viajes: { nombre: 'Viajes', icon: '✈️', desc: 'Presupuestos grupo', activo: true }
  })

  const toggleModulo = (key) => {
    setModulos({
      ...modulos,
      [key]: { ...modulos[key], activo: !modulos[key].activo }
    })
  }

  const guardarConfiguracion = () => {
    localStorage.setItem('fc_modulos', JSON.stringify(modulos))
    alert('Configuración guardada en localStorage')
  }

  return (
    <div className="modulos-page">
      <div className="page-header">
        <h1>Personalizar Módulos</h1>
        <p>Activa o desactiva los módulos que utilizas</p>
      </div>

      <div className="module-grid">
        {Object.entries(modulos).map(([key, mod]) => (
          <div key={key} className="module-card" onClick={() => toggleModulo(key)}>
            <div className="module-icon">{mod.icon}</div>
            <h3 className="module-name">{mod.nombre}</h3>
            <p className="module-description">{mod.desc}</p>
            <span className={`module-status ${mod.activo ? 'enabled' : 'disabled'}`}>
              {mod.activo ? 'Activado' : 'Desactivado'}
            </span>
          </div>
        ))}
      </div>

      <button onClick={guardarConfiguracion} className="save-button">
        Guardar Configuración
      </button>

      <p className="info-text">
        Los módulos desactivados no aparecerán en el menú principal.
        Tu configuración se guarda localmente.
      </p>
    </div>
  )
}

export default PersonalizarModulos
