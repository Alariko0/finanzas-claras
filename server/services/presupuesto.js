'use strict'

const { ErrorEntrada } = require('./errores')
const { aCentimos, aEuros, validarNumero, repartirCentimos } = require('./centimos')

/*
 * Presupuesto mensual con dos modos:
 *  - 50-30-20: tres bloques (necesidades, deseos, ahorro) con 50/30/20 por defecto. Los
 *    porcentajes se pueden cambiar y deben sumar exactamente 100. Es una regla orientativa, no una
 *    cifra legal ni una recomendación personalizada.
 *  - libre: partidas propias (hasta 20) con su porcentaje; la suma puede ser menor que 100 y lo que
 *    falta queda «sin asignar». Cada partida puede marcarse como ahorro.
 *
 * Los porcentajes admiten hasta dos decimales y se trabajan en centésimas enteras. El reparto del
 * ingreso se hace en céntimos por el método del mayor resto, así que las partidas suman
 * exactamente lo asignado. Opcionalmente se puede indicar lo gastado (o ahorrado) de cada partida
 * para ver la desviación, y un objetivo de ahorro para estimar los meses que faltan (sin intereses).
 *
 * Funciones puras. Entradas y salidas en euros; dentro, céntimos enteros. ESTIMACIÓN orientativa.
 */

const MODOS = ['50-30-20', 'libre']
const MAX_PARTIDAS = 20
const MAX_IMPORTE = 10_000_000

const BLOQUES = [
  { clave: 'necesidades', nombre: 'Necesidades', porcentaje: 50, ahorro: false },
  { clave: 'deseos', nombre: 'Deseos', porcentaje: 30, ahorro: false },
  { clave: 'ahorro', nombre: 'Ahorro', porcentaje: 20, ahorro: true }
]

const aCentesimas = (pct, nombre) => {
  const c = Math.round(pct * 100)
  if (Math.abs(pct * 100 - c) > 1e-6) throw new ErrorEntrada(`${nombre}: el porcentaje admite como máximo dos decimales`)
  return c
}

const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 10000) / 100 : null)

function partidasDe(entrada, modo) {
  if (modo === '50-30-20') {
    const porcentajes = entrada.porcentajes ?? {}
    const gastado = entrada.gastado ?? {}
    return BLOQUES.map((b) => ({
      ...b,
      porcentaje: validarNumero(porcentajes[b.clave] ?? b.porcentaje, `Porcentaje de ${b.nombre}`, { max: 100 }),
      gastado: gastado[b.clave]
    }))
  }
  const { partidas } = entrada
  if (!Array.isArray(partidas) || partidas.length < 1 || partidas.length > MAX_PARTIDAS) {
    throw new ErrorEntrada(`partidas debe ser una lista de 1 a ${MAX_PARTIDAS} partidas`)
  }
  return partidas.map((p, i) => {
    const nombre = typeof p?.nombre === 'string' && p.nombre.trim() ? p.nombre.trim() : `Partida ${i + 1}`
    return {
      clave: `partida${i + 1}`,
      nombre,
      porcentaje: validarNumero(p?.porcentaje, `Porcentaje de ${nombre}`, { min: 0.01, max: 100 }),
      ahorro: p?.ahorro === true,
      gastado: p?.gastado
    }
  })
}

function calcularPresupuesto(entrada = {}) {
  const modo = entrada.modo ?? '50-30-20'
  if (!MODOS.includes(modo)) throw new ErrorEntrada(`modo debe ser ${MODOS.join(' o ')}`)

  const ingresoMensual = validarNumero(entrada.ingresoMensual, 'ingresoMensual', { min: 0.01, max: MAX_IMPORTE })
  const ingreso = aCentimos(ingresoMensual)
  const partidas = partidasDe(entrada, modo)

  const centesimas = partidas.map((p) => aCentesimas(p.porcentaje, p.nombre))
  const suma = centesimas.reduce((a, c) => a + c, 0)
  if (modo === '50-30-20' && suma !== 10000) {
    throw new ErrorEntrada(`Los porcentajes deben sumar 100 (ahora suman ${suma / 100})`)
  }
  if (suma > 10000) throw new ErrorEntrada(`Los porcentajes no pueden superar 100 (ahora suman ${suma / 100})`)

  const asignado = Math.round((ingreso * suma) / 10000)
  const importes = repartirCentimos(asignado, centesimas)

  const detalle = partidas.map((p, i) => {
    let gastado = null
    let diferencia = null
    let estado = null
    if (p.gastado !== undefined && p.gastado !== null) {
      const real = aCentimos(validarNumero(p.gastado, `Importe real de ${p.nombre}`, { max: MAX_IMPORTE }))
      gastado = aEuros(real)
      diferencia = aEuros(importes[i] - real)
      // En una partida de ahorro, lo real es lo ahorrado: llegar al importe es lo bueno
      estado = p.ahorro ? (real >= importes[i] ? 'cumplido' : 'pordebajo') : (real <= importes[i] ? 'dentro' : 'excedido')
    }
    return {
      clave: p.clave,
      nombre: p.nombre,
      porcentaje: centesimas[i] / 100,
      importe: aEuros(importes[i]),
      ahorro: p.ahorro,
      gastado,
      diferencia,
      estado
    }
  })

  const ahorroMensual = partidas.reduce((s, p, i) => s + (p.ahorro ? importes[i] : 0), 0)

  let meta = null
  if (entrada.objetivoAhorro !== undefined) {
    const objetivo = aCentimos(validarNumero(entrada.objetivoAhorro, 'objetivoAhorro', { min: 0.01, max: 1_000_000_000 }))
    const actual = aCentimos(validarNumero(entrada.ahorroActual ?? 0, 'ahorroActual', { max: 1_000_000_000 }))
    const restante = Math.max(0, objetivo - actual)
    let meses = null
    if (restante === 0) meses = 0
    else if (ahorroMensual > 0) meses = Math.ceil(restante / ahorroMensual)
    meta = {
      objetivo: aEuros(objetivo),
      ahorroActual: aEuros(actual),
      restante: aEuros(restante),
      progreso: Math.min(100, Math.round((actual / objetivo) * 10000) / 100),
      mesesParaObjetivo: meses
    }
  }

  const avisos = [
    modo === '50-30-20'
      ? 'El 50/30/20 es una regla orientativa y puede no ajustarse a tu situación.'
      : 'Estimación orientativa a partir de los porcentajes que has indicado.'
  ]
  if (meta && meta.mesesParaObjetivo === null) {
    avisos.push('Con este presupuesto no ahorras nada al mes, así que el objetivo no se alcanza.')
  }
  if (meta) avisos.push('Los meses hasta el objetivo se calculan sin intereses ni inflación.')
  if (modo === 'libre' && !partidas.some((p) => p.ahorro)) {
    avisos.push('Ninguna partida está marcada como ahorro.')
  }

  return {
    modo,
    ingresoMensual,
    partidas: detalle,
    totalAsignado: aEuros(asignado),
    sinAsignar: aEuros(ingreso - asignado),
    porcentajeSinAsignar: (10000 - suma) / 100,
    ahorroMensual: aEuros(ahorroMensual),
    ahorroAnual: aEuros(ahorroMensual * 12),
    tasaAhorro: porcentaje(ahorroMensual, ingreso),
    meta,
    avisos
  }
}

module.exports = { calcularPresupuesto, MAX_PARTIDAS }
