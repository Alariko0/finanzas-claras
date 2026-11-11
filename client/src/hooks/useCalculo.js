import { useEffect, useState } from 'react'

/**
 * Llama a una función de cálculo del servidor cada vez que cambia `entrada`, con debounce y
 * descartando respuestas que llegan tarde.
 *
 * @param {(entrada: Object) => Promise<Object>} calcular - p. ej. `fiscal.nomina`
 * @param {Object} entrada - Cuerpo que recibe la API
 * @param {Object} [opciones]
 * @param {string} [opciones.invalido] - Si hay texto, no se llama a la API y se muestra como error
 * @param {boolean} [opciones.omitir] - Si es true, no se calcula nada ni se muestra error (aún no hay datos)
 * @param {number} [opciones.espera=350] - Debounce en ms
 * @returns {{resultado: Object|null, error: string, cargando: boolean}}
 */
export default function useCalculo(calcular, entrada, { invalido = '', omitir = false, espera = 350 } = {}) {
  const [estado, setEstado] = useState({ resultado: null, error: '', cargando: false })
  const clave = JSON.stringify(entrada)

  useEffect(() => {
    if (omitir) {
      setEstado({ resultado: null, error: '', cargando: false })
      return undefined
    }
    if (invalido) {
      setEstado({ resultado: null, error: invalido, cargando: false })
      return undefined
    }
    let cancelado = false
    setEstado((e) => ({ ...e, cargando: true }))
    const temporizador = setTimeout(async () => {
      try {
        const resultado = await calcular(JSON.parse(clave))
        if (!cancelado) setEstado({ resultado, error: '', cargando: false })
      } catch (e) {
        if (!cancelado) {
          setEstado((anterior) => ({ ...anterior, error: e.errores?.[0]?.message || e.message, cargando: false }))
        }
      }
    }, espera)
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [calcular, clave, invalido, omitir, espera])

  return estado
}
