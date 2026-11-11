/**
 * HogarContext.jsx - Datos del hogar compartidos entre «Gastos del hogar» y «Presupuesto y ahorro».
 * Aquí viven las personas, sus ingresos, los gastos (con su categoría), la configuración de cada
 * presupuesto y el reparto calculado por el servidor (POST /api/hogar/reparto). Así Presupuesto
 * toma lo que se haya rellenado en Gastos aunque se navegue entre páginas.
 * Solo en memoria: se pierde al recargar. Guardarlo con sesión llegará con F5.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { hogar } from '../utils/api'
import useCalculo from '../hooks/useCalculo'

const HogarContext = createContext(null)

export const CATEGORIAS = [
  { clave: 'necesidades', nombre: 'Necesidad' },
  { clave: 'deseos', nombre: 'Deseo' },
  { clave: 'ahorro', nombre: 'Ahorro' }
]

export const configPresupuestoInicial = () => ({
  modo: '50-30-20',
  base: 'ingresos', // 'ingresos' o 'libre' (lo que queda tras los gastos)
  ingresoManual: 0, // solo cuando no hay datos en Gastos
  porcentajes: { necesidades: 50, deseos: 30, ahorro: 20 },
  gastadoManual: { necesidades: '', deseos: '', ahorro: '' },
  partidas: [],
  objetivoAhorro: '',
  ahorroActual: ''
})

export function HogarProvider({ children }) {
  const siguienteId = useRef(3)
  const nuevoId = useCallback(() => siguienteId.current++, [])

  const [metodo, setMetodo] = useState('proporcional')
  const [personas, setPersonas] = useState([
    { id: 1, nombre: 'Persona 1', ingresoMensual: 0, gastosIndividuales: [] },
    { id: 2, nombre: 'Persona 2', ingresoMensual: 0, gastosIndividuales: [] }
  ])
  const [gastos, setGastos] = useState([])
  const [presupuestos, setPresupuestos] = useState({ hogar: configPresupuestoInicial() })

  const cambiarPresupuesto = useCallback((clave, parche) =>
    setPresupuestos((todos) => ({ ...todos, [clave]: { ...(todos[clave] ?? configPresupuestoInicial()), ...parche } })), [])

  const totalCompartido = gastos.reduce((suma, g) => suma + g.importe, 0)
  const totalIngresos = personas.reduce((suma, p) => suma + p.ingresoMensual, 0)
  const hayDatos = totalIngresos > 0 || totalCompartido > 0 ||
    personas.some((p) => p.gastosIndividuales.length > 0)
  const invalido = metodo === 'proporcional' && totalCompartido > 0 && totalIngresos === 0
    ? 'Para repartir en proporción a los ingresos, indica los ingresos de al menos una persona.'
    : ''

  const entrada = {
    metodo,
    personas: personas.map((p) => ({
      nombre: p.nombre,
      ingresoMensual: p.ingresoMensual,
      gastosIndividuales: p.gastosIndividuales.map(({ concepto, importe, categoria }) => ({ concepto, importe, categoria }))
    })),
    gastosCompartidos: gastos.map(({ concepto, importe, categoria }) => ({ concepto, importe, categoria }))
  }
  const { resultado, error, cargando } = useCalculo(hogar.reparto, entrada, { invalido, omitir: !hayDatos })

  const valor = useMemo(() => ({
    metodo, setMetodo, personas, setPersonas, gastos, setGastos, nuevoId,
    presupuestos, cambiarPresupuesto, resultado, error, cargando
  }), [metodo, personas, gastos, nuevoId, presupuestos, cambiarPresupuesto, resultado, error, cargando])

  return <HogarContext.Provider value={valor}>{children}</HogarContext.Provider>
}

export function useHogar() {
  const contexto = useContext(HogarContext)
  if (!contexto) throw new Error('useHogar debe usarse dentro de HogarProvider')
  return contexto
}
