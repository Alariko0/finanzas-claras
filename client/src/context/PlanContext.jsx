/**
 * PlanContext.jsx - Datos compartidos entre Nómina, Plan de jubilación y Plan de pensiones.
 *  - `nomina`: el formulario de la calculadora de nómina (sueldo, familia, comunidad…).
 *  - `supuestos`: lo que se fija en «Plan de jubilación» (edades, rentabilidad, inflación, tasa de
 *    retiro, objetivo de renta) y el ahorro libre del plan de jubilación.
 *  - `planPrivado`: aportaciones y saldo del plan de pensiones privado (dentro de Plan de jubilación).
 *  - `pension`: lo que se rellena en «Plan de pensiones» (la pensión pública): historial de cotización.
 *  - `pensionPublicaEstimada`: la pensión pública anual en euros de hoy que calcula «Plan de
 *    pensiones»; Plan de jubilación la usa como pensión pública si no se escribe otra.
 * Los campos de texto pueden estar vacíos; quien los usa los convierte. Solo en memoria: se pierde
 * al recargar. Guardarlo con sesión llegará con F5.
 */

import { createContext, useContext, useMemo, useState } from 'react'

const PlanContext = createContext(null)

export const nominaInicial = () => ({
  brutoAnual: 30000,
  pagas: 14,
  prorrateo: false,
  grupo: 1,
  contrato: 'indefinido',
  situacion: 3,
  hijos: 0,
  hijosMenores3: 0,
  comunidad: 'madrid'
})

export const supuestosIniciales = () => ({
  edadActual: '35',
  edadJubilacion: '67',
  ahorroActual: '10000',
  aportacionMensual: '500',
  rentabilidad: '5',
  inflacion: '2',
  crecimientoAportacion: '',
  tasaRetiro: '4',
  rentabilidadJubilacion: '',
  rentaDeseadaMensual: '',
  pensionPublicaMensual: ''
})

export const planPrivadoInicial = () => ({
  aportacionAnual: '1500',
  contribucionEmpresaAnual: '',
  saldoActual: ''
})

export const pensionInicial = () => ({
  modo: 'media', // 'media': años cotizados y base media · 'anual': bases por año
  aniosCotizados: '',
  baseMedia: '',
  filas: [], // [{ id, anio, base }]
  baseActual: '', // vacío = la que sale de la nómina
  crecimientoBases: '',
  situacionMinimo: 'sinConyuge'
})

/** Pensión pública mensual (anual ÷ 12, euros de hoy) para Plan de jubilación: la escrita o la estimada. */
export function pensionPublicaMensualEfectiva(supuestos, estimadaAnual) {
  if (supuestos.pensionPublicaMensual !== '') return { texto: supuestos.pensionPublicaMensual, estimada: false }
  if (estimadaAnual > 0) return { texto: String(Math.round((estimadaAnual / 12) * 100) / 100), estimada: true }
  return { texto: '', estimada: false }
}

export function PlanProvider({ children }) {
  const [nomina, setNomina] = useState(nominaInicial)
  const [supuestos, setSupuestos] = useState(supuestosIniciales)
  const [planPrivado, setPlanPrivado] = useState(planPrivadoInicial)
  const [pension, setPension] = useState(pensionInicial)
  const [pensionPublicaEstimada, setPensionPublicaEstimada] = useState(null)

  const valor = useMemo(
    () => ({
      nomina, setNomina, supuestos, setSupuestos, planPrivado, setPlanPrivado,
      pension, setPension, pensionPublicaEstimada, setPensionPublicaEstimada
    }),
    [nomina, supuestos, planPrivado, pension, pensionPublicaEstimada]
  )
  return <PlanContext.Provider value={valor}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const contexto = useContext(PlanContext)
  if (!contexto) throw new Error('usePlan debe usarse dentro de <PlanProvider>')
  return contexto
}
