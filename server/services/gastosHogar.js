'use strict'

const { ErrorEntrada } = require('./errores')
const { aCentimos, aEuros, validarNumero, repartirCentimos } = require('./centimos')

/*
 * Gastos del hogar: reparto de los gastos compartidos entre las personas, gastos individuales y
 * saldo de cada una, todo desglosado por categoría (necesidades, deseos o ahorro: las mismas del
 * presupuesto, para poder compararlos).
 *
 * Métodos de reparto:
 *  - proporcional: cada persona paga en proporción a sus ingresos mensuales (el mismo porcentaje
 *    de su renta). Si nadie tiene ingresos no se puede repartir así.
 *  - igual: el total entre el número de personas.
 *
 * El reparto se hace en céntimos por el método del mayor resto y por categoría, así que las cuotas
 * de cada categoría suman exactamente su total (y la cuota de una persona es la suma de las suyas).
 * Saldo de cada persona = ingresos − su cuota compartida − sus gastos individuales (incluido lo que
 * aparta para ahorrar): es el dinero libre a fin de mes. «Real» por categoría = cuota + individuales.
 *
 * Funciones puras. Entradas y salidas en euros; dentro, céntimos enteros. ESTIMACIÓN orientativa.
 */

const METODOS = ['proporcional', 'igual']
const CATEGORIAS = ['necesidades', 'deseos', 'ahorro']
const MAX_PERSONAS = 10
const MAX_GASTOS = 100
const MAX_INDIVIDUALES = 50
const MAX_IMPORTE = 10_000_000

const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 10000) / 100 : null)
const vacio = () => Object.fromEntries(CATEGORIAS.map((c) => [c, 0]))
const sumar = (a, b) => Object.fromEntries(CATEGORIAS.map((c) => [c, a[c] + b[c]]))
const total = (porCategoria) => CATEGORIAS.reduce((s, c) => s + porCategoria[c], 0)
const aEurosPorCategoria = (porCategoria) => Object.fromEntries(CATEGORIAS.map((c) => [c, aEuros(porCategoria[c])]))

/** Valida una lista de gastos {concepto?, importe, categoria?} y la agrupa por categoría (céntimos). */
function agrupar(lista, nombreLista, maximo, categoriaPorDefecto) {
  if (!Array.isArray(lista) || lista.length > maximo) {
    throw new ErrorEntrada(`${nombreLista} debe ser una lista de hasta ${maximo} gastos`)
  }
  const porCategoria = vacio()
  lista.forEach((g, i) => {
    const categoria = g?.categoria ?? categoriaPorDefecto
    if (!CATEGORIAS.includes(categoria)) {
      throw new ErrorEntrada(`categoria del gasto ${i + 1} de ${nombreLista} debe ser ${CATEGORIAS.join(', ')}`)
    }
    porCategoria[categoria] += aCentimos(
      validarNumero(g?.importe, `importe del gasto ${i + 1} de ${nombreLista}`, { max: MAX_IMPORTE })
    )
  })
  return porCategoria
}

function repartoGastos(entrada = {}) {
  const { personas, gastosCompartidos = [], metodo = 'proporcional' } = entrada

  if (!METODOS.includes(metodo)) throw new ErrorEntrada(`metodo debe ser ${METODOS.join(' o ')}`)
  if (!Array.isArray(personas) || personas.length < 1 || personas.length > MAX_PERSONAS) {
    throw new ErrorEntrada(`personas debe ser una lista de 1 a ${MAX_PERSONAS} personas`)
  }

  const gente = personas.map((p, i) => {
    const nombre = typeof p?.nombre === 'string' && p.nombre.trim() ? p.nombre.trim() : `Persona ${i + 1}`
    return {
      nombre,
      ingresos: aCentimos(validarNumero(p?.ingresoMensual, `ingresoMensual de ${nombre}`, { max: MAX_IMPORTE })),
      individuales: agrupar(p?.gastosIndividuales ?? [], `gastosIndividuales de ${nombre}`, MAX_INDIVIDUALES, 'deseos')
    }
  })
  const compartidos = agrupar(gastosCompartidos, 'gastosCompartidos', MAX_GASTOS, 'necesidades')
  const totalCompartido = total(compartidos)
  const totalIngresos = gente.reduce((suma, p) => suma + p.ingresos, 0)

  const cuotas = gente.map(() => vacio())
  if (totalCompartido > 0) {
    if (metodo === 'proporcional' && totalIngresos === 0) {
      throw new ErrorEntrada('Para repartir en proporción a los ingresos, al menos una persona debe tener ingresos')
    }
    const pesos = gente.map((p) => (metodo === 'igual' ? 1 : p.ingresos))
    for (const categoria of CATEGORIAS) {
      if (compartidos[categoria] === 0) continue
      repartirCentimos(compartidos[categoria], pesos).forEach((parte, i) => { cuotas[i][categoria] = parte })
    }
  }

  let realHogar = vacio()
  const resultadoPersonas = gente.map((p, i) => {
    const cuota = total(cuotas[i])
    const individuales = total(p.individuales)
    const real = sumar(cuotas[i], p.individuales)
    realHogar = sumar(realHogar, real)
    return {
      nombre: p.nombre,
      ingresoMensual: aEuros(p.ingresos),
      cuotaCompartida: aEuros(cuota),
      cuotaPorCategoria: aEurosPorCategoria(cuotas[i]),
      porcentajeDelReparto: porcentaje(cuota, totalCompartido),
      porcentajeSobreIngresos: porcentaje(cuota, p.ingresos),
      totalIndividuales: aEuros(individuales),
      individualesPorCategoria: aEurosPorCategoria(p.individuales),
      realPorCategoria: aEurosPorCategoria(real),
      totalGastos: aEuros(cuota + individuales),
      saldo: aEuros(p.ingresos - cuota - individuales)
    }
  })

  const totalIndividuales = gente.reduce((suma, p) => suma + total(p.individuales), 0)
  const saldoHogar = totalIngresos - totalCompartido - totalIndividuales

  const avisos = ['Estimación orientativa: el reparto es un acuerdo entre las personas, no una obligación legal.']
  for (const p of resultadoPersonas) {
    if (p.saldo < 0) avisos.push(`${p.nombre} gasta más de lo que ingresa cada mes.`)
  }

  return {
    metodo,
    personas: resultadoPersonas,
    totalIngresos: aEuros(totalIngresos),
    totalCompartido: aEuros(totalCompartido),
    totalIndividuales: aEuros(totalIndividuales),
    totalGastos: aEuros(totalCompartido + totalIndividuales),
    realPorCategoria: aEurosPorCategoria(realHogar),
    saldo: aEuros(saldoHogar),
    porcentajeLibre: porcentaje(saldoHogar, totalIngresos),
    avisos
  }
}

module.exports = { repartoGastos, CATEGORIAS, MAX_PERSONAS, MAX_GASTOS, MAX_INDIVIDUALES }
