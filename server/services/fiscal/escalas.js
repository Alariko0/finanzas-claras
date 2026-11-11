'use strict'

/*
 * Aplicación de escalas progresivas en céntimos enteros, sin redondeos intermedios.
 *
 * Cada tramo aporta (céntimos del tramo) × (tipo en centésimas de punto). Todo son enteros y
 * se suman exactos ("unidades" = céntimos × centésimas de punto). El único redondeo es el final,
 * al pasar de unidades a céntimos.
 */

const UNIDADES_POR_CENTIMO = 10000

function aCentimos(euros) {
  return Math.round(euros * 100)
}

// Normaliza una escala de datos2026 ({ desde, tipo }) a enteros.
function prepararEscala(tramos) {
  return tramos.map((t) => ({ desde: aCentimos(t.desde), tipo: Math.round(t.tipo * 100) }))
}

// Cuota de una base (céntimos) en unidades exactas.
function cuotaEnUnidades(baseCentimos, escala) {
  let unidades = 0
  for (let i = 0; i < escala.length; i++) {
    const desde = escala[i].desde
    if (baseCentimos <= desde) break
    const hasta = i + 1 < escala.length ? escala[i + 1].desde : Infinity
    unidades += (Math.min(baseCentimos, hasta) - desde) * escala[i].tipo
  }
  return unidades
}

// Unidades → céntimos, redondeo al céntimo más próximo (0,5 hacia arriba).
function unidadesACentimos(unidades) {
  return Math.floor((unidades + UNIDADES_POR_CENTIMO / 2) / UNIDADES_POR_CENTIMO)
}

/*
 * Cuota íntegra según LIRPF art. 63/74/66/76: escala sobre la base liquidable menos la escala
 * aplicada a la parte de base que corresponde al mínimo personal y familiar. Nunca negativa.
 */
function cuotaConMinimo(baseCentimos, minimoCentimos, escala) {
  const base = Math.max(0, baseCentimos)
  const unidades = cuotaEnUnidades(base, escala) - cuotaEnUnidades(Math.min(base, minimoCentimos), escala)
  return unidadesACentimos(Math.max(0, unidades))
}

module.exports = {
  aCentimos,
  prepararEscala,
  cuotaEnUnidades,
  unidadesACentimos,
  cuotaConMinimo
}
