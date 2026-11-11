'use strict'

const { ErrorEntrada } = require('./errores')

/*
 * Dinero en céntimos enteros (regla 6 del proyecto): se suma y se reparte en céntimos y solo
 * al final se pasa a euros. Sin redondeos intermedios.
 */

const aCentimos = (euros) => Math.round(euros * 100)
const aEuros = (centimos) => centimos / 100

/** Número finito dentro de [min, max]; si no, ErrorEntrada con el nombre del campo. */
function validarNumero(valor, nombre, { min = 0, max = Infinity } = {}) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < min || valor > max) {
    throw new ErrorEntrada(`${nombre} debe ser un número entre ${min} y ${max}`)
  }
  return valor
}

/**
 * Reparte `total` (céntimos enteros) en partes proporcionales a `pesos` (enteros ≥ 0) por el
 * método del mayor resto: las partes suman exactamente `total`, y a igualdad de resto el
 * céntimo sobrante va a la primera posición. Usa BigInt porque total × peso puede pasar de 2^53.
 */
function repartirCentimos(total, pesos) {
  const suma = pesos.reduce((acc, p) => acc + BigInt(p), 0n)
  if (suma === 0n) throw new ErrorEntrada('No hay con qué repartir: todos los pesos son cero')
  const t = BigInt(total)
  const partes = pesos.map((p) => (t * BigInt(p)) / suma)
  const restos = pesos.map((p, i) => ({ i, resto: (t * BigInt(p)) % suma }))
  const sobran = Number(t - partes.reduce((acc, x) => acc + x, 0n))
  restos.sort((a, b) => (b.resto > a.resto ? 1 : b.resto < a.resto ? -1 : a.i - b.i))
  for (let k = 0; k < sobran; k++) partes[restos[k].i] += 1n
  return partes.map(Number)
}

module.exports = { aCentimos, aEuros, validarNumero, repartirCentimos }
