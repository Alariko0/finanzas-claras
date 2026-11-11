/**
 * NominasContext.jsx - Las nóminas reales del usuario, compartidas por Nómina, IRPF, Gastos y
 * Plan de pensiones. Con sesión, carga la lista y el resumen del año (acumulado, proyección y
 * bases de cotización); sin sesión queda vacío. La vigente es la última nómina ordinaria: sus
 * datos no cambian hasta que se registra otra más reciente.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { nominas as nominasApi } from '../utils/api'
import { useAuth } from './AuthContext'
import { usePlan } from './PlanContext'

// Los datos fiscales de la app son de este ejercicio
export const ANIO_FISCAL = 2026

const NominasContext = createContext(null)

const VACIO = { nominas: [], resumen: null, cargando: false, error: '' }

export function NominasProvider({ children }) {
  const { user } = useAuth()
  const { nomina } = usePlan()
  const pagas = nomina.pagas
  const [estado, setEstado] = useState(VACIO)

  const recargar = useCallback(async () => {
    if (!user) {
      setEstado(VACIO)
      return
    }
    setEstado((e) => ({ ...e, cargando: true, error: '' }))
    try {
      const [lista, resumen] = await Promise.all([
        nominasApi.listar(),
        nominasApi.resumen({ anio: ANIO_FISCAL, pagas })
      ])
      setEstado({ nominas: lista, resumen, cargando: false, error: '' })
    } catch (e) {
      setEstado((anterior) => ({ ...anterior, cargando: false, error: e.message }))
    }
  }, [user, pagas])

  useEffect(() => {
    recargar()
  }, [recargar])

  const valor = useMemo(() => ({ ...estado, conSesion: !!user, recargar }), [estado, user, recargar])
  return <NominasContext.Provider value={valor}>{children}</NominasContext.Provider>
}

export function useNominas() {
  const contexto = useContext(NominasContext)
  if (!contexto) throw new Error('useNominas debe usarse dentro de <NominasProvider>')
  return contexto
}
