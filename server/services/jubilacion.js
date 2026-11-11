'use strict'

const { ErrorEntrada } = require('./errores')
const { aCentimos, aEuros, validarNumero } = require('./centimos')

/*
 * Proyección de jubilación: capitalización mensual con aportaciones, inflación opcional, renta
 * de retiro según la «regla del 4 %» y cuántos años dura el capital.
 *
 * Modelo (todo explícito, sin cifras por defecto que no dé el usuario):
 *  - La rentabilidad es anual efectiva (neta de comisiones). Se capitaliza cada mes con el tipo
 *    mensual equivalente (1 + r)^(1/12) − 1, y las aportaciones se ingresan a final de mes.
 *  - La aportación mensual puede crecer cada año (crecimientoAportacion, % anual).
 *  - La inflación solo sirve para pasar a «euros de hoy» y para indexar la renta de retiro.
 *  - Retiro: renta inicial = capital × tasaRetiro (4 % por defecto), indexada cada año con la
 *    inflación. Si el usuario da una renta deseada (en euros de hoy), esa sustituye a la regla.
 *  - La pensión pública es un dato del usuario (bruta, euros de hoy): no se estima aquí.
 *
 * Funciones puras. La acumulación usa coma flotante (≤ 80 años × 12 sumas: error ~1e-9 €) y solo
 * se redondea a céntimos al devolver el resultado. ESTIMACIÓN orientativa, no una garantía.
 */

const EDAD_MIN = 16
const EDAD_MAX = 100
const MAX_IMPORTE = 1e9
const MAX_ANOS_COBERTURA = 50
const TOLERANCIA = 1e-6 // € al comparar el saldo con el retiro del mes
const EXTRA_REFERENCIA = 100 // € al mes para el aviso «qué pasa si aporto 100 € más»

const redondear = (x) => aEuros(aCentimos(x))

function entero(valor, nombre, min, max) {
  validarNumero(valor, nombre, { min, max })
  if (!Number.isInteger(valor)) throw new ErrorEntrada(`${nombre} debe ser un número entero`)
  return valor
}

function normalizar(entrada) {
  if (!entrada || typeof entrada !== 'object') throw new ErrorEntrada('Faltan los datos de la proyección')
  const e = entrada
  const edadActual = entero(e.edadActual, 'edadActual', EDAD_MIN, EDAD_MAX - 1)
  const edadJubilacion = entero(e.edadJubilacion, 'edadJubilacion', EDAD_MIN + 1, EDAD_MAX)
  if (edadJubilacion <= edadActual) throw new ErrorEntrada('La edad de jubilación debe ser mayor que la actual')

  const rentabilidad = validarNumero(e.rentabilidad, 'rentabilidad', { min: -20, max: 30 })
  const opcional = (clave, def, limites) =>
    e[clave] === undefined ? def : validarNumero(e[clave], clave, limites)

  return {
    edadActual,
    edadJubilacion,
    anos: edadJubilacion - edadActual,
    rentabilidad,
    ahorroActual: opcional('ahorroActual', 0, { min: 0, max: MAX_IMPORTE }),
    aportacionMensual: opcional('aportacionMensual', 0, { min: 0, max: MAX_IMPORTE }),
    crecimientoAportacion: opcional('crecimientoAportacion', 0, { min: 0, max: 30 }),
    inflacion: opcional('inflacion', 0, { min: -10, max: 30 }),
    tasaRetiro: opcional('tasaRetiro', 4, { min: 0.1, max: 15 }),
    // Rentabilidad durante la jubilación: si no se indica, la misma de la fase de ahorro
    rentabilidadJubilacion: opcional('rentabilidadJubilacion', rentabilidad, { min: -20, max: 30 }),
    rentaDeseadaMensual: e.rentaDeseadaMensual === undefined
      ? null
      : validarNumero(e.rentaDeseadaMensual, 'rentaDeseadaMensual', { min: 0, max: MAX_IMPORTE }),
    pensionPublicaMensual: opcional('pensionPublicaMensual', 0, { min: 0, max: MAX_IMPORTE })
  }
}

/** Suma, valorada a final de año, de 12 aportaciones mensuales de 1 € a final de cada mes. */
function anualidadDoce(rentabilidad) {
  const gy = 1 + rentabilidad / 100
  const gm = Math.pow(gy, 1 / 12)
  return Math.abs(gm - 1) < 1e-12 ? 12 : (gy - 1) / (gm - 1)
}

/** Serie año a año: capital y total aportado al final de cada año (índice 0 = hoy). */
function capitalizar({ ahorro, aportacionMensual, rentabilidad, crecimientoAportacion, anos }) {
  const gy = 1 + rentabilidad / 100
  const anualidad = anualidadDoce(rentabilidad)
  const serie = [{ capital: ahorro, aportado: ahorro }]
  let capital = ahorro
  let aportado = ahorro
  for (let a = 0; a < anos; a++) {
    const cuota = aportacionMensual * Math.pow(1 + crecimientoAportacion / 100, a)
    capital = capital * gy + cuota * anualidad
    aportado += cuota * 12
    serie.push({ capital, aportado })
  }
  return serie
}

/**
 * Meses que dura `capital` retirando `retiroInicial` al mes (al principio de cada mes), con el
 * retiro indexado cada año a la inflación y el saldo restante rentando `rentabilidad`.
 */
function mesesDeCobertura(capital, retiroInicial, rentabilidad, inflacion) {
  const gm = Math.pow(1 + rentabilidad / 100, 1 / 12)
  let saldo = capital
  for (let m = 0; m < MAX_ANOS_COBERTURA * 12; m++) {
    const retiro = retiroInicial * Math.pow(1 + inflacion / 100, Math.floor(m / 12))
    if (saldo + TOLERANCIA < retiro) return { meses: m, perpetua: false }
    saldo = (saldo - retiro) * gm
  }
  return { meses: MAX_ANOS_COBERTURA * 12, perpetua: true }
}

function proyectarJubilacion(entrada) {
  const d = normalizar(entrada)
  const base = {
    aportacionMensual: d.aportacionMensual,
    rentabilidad: d.rentabilidad,
    crecimientoAportacion: d.crecimientoAportacion,
    anos: d.anos
  }
  const serie = capitalizar({ ...base, ahorro: d.ahorroActual })
  const final = serie[d.anos]
  const deflactor = Math.pow(1 + d.inflacion / 100, d.anos)

  // El resultado es lineal en ahorro y aportación: 1 € al mes extra da `porEuroMensual` de capital
  const porEuroMensual = capitalizar({ ...base, ahorro: 0, aportacionMensual: 1 })[d.anos].capital

  // Renta de retiro: regla de la tasa, o la renta deseada menos la pensión pública
  const rentaRegla = (final.capital * d.tasaRetiro) / 100 / 12
  let objetivo = null
  let retiroInicial = rentaRegla
  if (d.rentaDeseadaMensual !== null) {
    const aCubrirHoy = Math.max(0, d.rentaDeseadaMensual - d.pensionPublicaMensual)
    const aCubrirNominal = aCubrirHoy * deflactor
    const capitalNecesario = (aCubrirNominal * 12 * 100) / d.tasaRetiro
    const falta = Math.max(0, capitalNecesario - final.capital)
    retiroInicial = aCubrirNominal
    objetivo = {
      rentaDeseadaMensual: d.rentaDeseadaMensual,
      pensionPublicaMensual: d.pensionPublicaMensual,
      rentaACubrirConAhorro: redondear(aCubrirHoy),
      capitalNecesario: redondear(capitalNecesario),
      capitalNecesarioReal: redondear(capitalNecesario / deflactor),
      falta: redondear(falta),
      cumplido: falta === 0,
      aportacionExtraMensual: porEuroMensual > 0 ? redondear(falta / porEuroMensual) : null
    }
  }

  let cobertura = null
  if (retiroInicial > 0) {
    const { meses, perpetua } = mesesDeCobertura(final.capital, retiroInicial, d.rentabilidadJubilacion, d.inflacion)
    cobertura = {
      retiroMensualInicial: redondear(retiroInicial),
      meses,
      anos: Math.round((meses / 12) * 100) / 100,
      perpetua,
      edadAgotamiento: perpetua ? null : d.edadJubilacion + Math.floor(meses / 12)
    }
  }

  const avisos = [
    'Estimación: las rentabilidades futuras no están garantizadas y los mercados pueden dar años negativos.',
    'El resultado es bruto: no descuenta impuestos ni comisiones. Si las conoces, réstalas de la rentabilidad.',
    `La regla del ${d.tasaRetiro} % es una referencia orientativa basada en estudios históricos; no asegura que el capital dure toda la vida.`
  ]
  if (d.pensionPublicaMensual > 0) {
    avisos.push('La pensión pública es un dato tuyo (bruta, en euros de hoy): este cálculo no la estima.')
  }

  return {
    edadJubilacion: d.edadJubilacion,
    anosHastaJubilacion: d.anos,
    capital: redondear(final.capital),
    capitalReal: redondear(final.capital / deflactor),
    totalAportado: redondear(final.aportado),
    rendimientos: redondear(final.capital - final.aportado),
    serie: serie.map((p, i) => ({
      edad: d.edadActual + i,
      capital: redondear(p.capital),
      capitalReal: redondear(p.capital / Math.pow(1 + d.inflacion / 100, i)),
      aportado: redondear(p.aportado)
    })),
    renta: {
      tasaRetiro: d.tasaRetiro,
      mensual: redondear(rentaRegla),
      mensualReal: redondear(rentaRegla / deflactor)
    },
    objetivo,
    cobertura,
    efectoAportacionExtra: {
      importeMensual: EXTRA_REFERENCIA,
      capitalExtra: redondear(porEuroMensual * EXTRA_REFERENCIA)
    },
    avisos
  }
}

module.exports = { proyectarJubilacion, MAX_ANOS_COBERTURA }
