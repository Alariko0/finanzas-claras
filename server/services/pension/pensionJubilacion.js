'use strict'

const datos = require('./datosPension2026')
const ipc = require('./ipcIndice')
const ss = require('../fiscal/datos2026').SEGURIDAD_SOCIAL
const { liquidacionIRPF } = require('../fiscal/liquidacionIRPF')
const { ErrorEntrada } = require('../errores')
const { aCentimos, aEuros, validarNumero } = require('../centimos')

/*
 * Estimación de la pensión contributiva de jubilación (Régimen General) a partir del historial de
 * cotización, según la LGSS (RDL 8/2015, arts. 205, 209 y 210 y disposiciones transitorias 7.ª, 9.ª y
 * 40.ª) y el RD 241/2026. Las reglas y su fuente están en datosPension2026.js.
 *
 *  - Historial pasado: tramos { desde, hasta, baseMensual } de meses 'AAAA-MM' con su base de
 *    cotización por contingencias comunes (la de «Tu Seguridad Social» o la media de varios años).
 *  - Futuro: desde el mes actual hasta la jubilación se cotiza `baseMensualActual`, que sube cada año
 *    `crecimientoBases` % (por defecto, la inflación) sin pasar de la base máxima.
 *  - Base reguladora: se eligen las bases de mayor importe de la ventana que fija la ley para el año de
 *    la jubilación; las más antiguas se actualizan con el IPC (INE hasta dic-2025; después, la
 *    inflación que indique el usuario).
 *  - Pensión = base reguladora × porcentaje por meses cotizados (+ demora), con el tope máximo.
 *
 * No modela: jubilación anticipada, activa, flexible o parcial, complemento de brecha de género,
 * pluriempleo, otros regímenes ni el complemento por mínimos (solo avisa si se queda por debajo).
 * Funciones puras. Euros en entrada y salida. ESTIMACIÓN: no sustituye al cálculo de la Seguridad Social.
 */

const MAX_TRAMOS = 200
const MAX_ANOS_PROYECCION = 60
const SITUACIONES_MINIMO = ['sinConyuge', 'conyugeACargo', 'conyugeNoACargo']
const redondear = (x) => aEuros(aCentimos(x))

/* ───────────── Meses ───────────── */

const indiceMes = (texto, nombre) => {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(texto)
  if (!m) throw new ErrorEntrada(`${nombre} debe tener el formato AAAA-MM`)
  return Number(m[1]) * 12 + Number(m[2]) - 1
}
const mesTexto = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`

const IPC_INICIO = indiceMes(ipc.INICIO, 'INICIO')
const IPC_FIN = IPC_INICIO + ipc.VALORES.length - 1

function indiceIPC(idx, inflacion) {
  if (idx < IPC_INICIO) return ipc.VALORES[0]
  if (idx <= IPC_FIN) return ipc.VALORES[idx - IPC_INICIO]
  return ipc.VALORES[ipc.VALORES.length - 1] * Math.pow(1 + inflacion / 100, (idx - IPC_FIN) / 12)
}

/* ───────────── Reglas por año (datosPension2026.js) ───────────── */

function ventanaDe(anio) {
  if (anio < datos.EJERCICIO) throw new ErrorEntrada('Solo se calculan jubilaciones desde 2026')
  return datos.BASE_REGULADORA.transitoria[anio] ?? datos.BASE_REGULADORA.plena
}

function edadOrdinariaMeses(anio, mesesCotizados) {
  const regla = datos.EDAD_ORDINARIA.find((r) => anio >= r.desdeAnio)
  return mesesCotizados >= regla.mesesParaSesentaYCinco ? 65 * 12 : regla.edadMeses
}

function porcentajeBase(anio, mesesCotizados) {
  const regla = datos.PORCENTAJES.porAnio.find((r) => anio >= r.desdeAnio)
  if (!regla) throw new ErrorEntrada('Solo se calculan jubilaciones desde 2026')
  let pct = datos.PORCENTAJES.porcentajeBase
  let restantes = Math.max(0, mesesCotizados - datos.PORCENTAJES.mesesBase)
  for (const t of regla.tramos) {
    const n = Math.min(restantes, t.meses)
    pct += n * t.porcentaje
    restantes -= n
  }
  return Math.min(pct, datos.PORCENTAJES.tope)
}

function porcentajeDemora(mesesDemora) {
  const anios = Math.floor(mesesDemora / 12)
  const resto = mesesDemora % 12
  let pct = anios * datos.DEMORA.porAnioCompleto
  if (anios >= 2 && resto > 6) pct += datos.DEMORA.porSemestreDesdeSegundoAnio
  return pct
}

/* ───────────── Entrada ───────────── */

function normalizar(e) {
  if (!e || typeof e !== 'object') throw new ErrorEntrada('Faltan los datos de la pensión')
  const opc = (clave, def, limites) => (e[clave] === undefined ? def : validarNumero(e[clave], clave, limites))
  const hoy = new Date()
  const actual = indiceMes(e.fechaActual ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`, 'fechaActual')

  const edadActual = validarNumero(e.edadActual, 'edadActual', { min: 16, max: 99 })
  const edadJubilacion = validarNumero(e.edadJubilacion, 'edadJubilacion', { min: 17, max: 100 })
  if (!Number.isInteger(edadActual) || !Number.isInteger(edadJubilacion)) throw new ErrorEntrada('Las edades deben ser números enteros')
  if (edadJubilacion <= edadActual) throw new ErrorEntrada('La edad de jubilación debe ser mayor que la actual')
  if (edadJubilacion - edadActual > MAX_ANOS_PROYECCION) throw new ErrorEntrada('La jubilación queda demasiado lejos para estimarla')

  const inflacion = opc('inflacion', 0, { min: -10, max: 30 })
  const tramosEntrada = e.tramos ?? []
  if (!Array.isArray(tramosEntrada) || tramosEntrada.length > MAX_TRAMOS) {
    throw new ErrorEntrada(`tramos debe ser una lista de hasta ${MAX_TRAMOS} periodos`)
  }
  const tramos = tramosEntrada.map((t, i) => {
    if (!t || typeof t !== 'object') throw new ErrorEntrada(`tramos[${i}] no es válido`)
    const desde = indiceMes(t.desde, `tramos[${i}].desde`)
    const hasta = indiceMes(t.hasta, `tramos[${i}].hasta`)
    if (hasta < desde) throw new ErrorEntrada(`tramos[${i}]: hasta no puede ser anterior a desde`)
    if (hasta >= actual) throw new ErrorEntrada(`tramos[${i}]: el historial debe acabar antes del mes actual`)
    if (hasta - desde > 12 * 80) throw new ErrorEntrada(`tramos[${i}] es demasiado largo`)
    return { desde, hasta, base: validarNumero(t.baseMensual, `tramos[${i}].baseMensual`, { min: 0, max: ss.baseMaximaMensual * 3 }) }
  })

  const situacionMinimo = e.situacionMinimo ?? 'sinConyuge'
  if (!SITUACIONES_MINIMO.includes(situacionMinimo)) throw new ErrorEntrada('situacionMinimo no válida')

  return {
    actual,
    edadActual,
    edadJubilacion,
    inflacion,
    tramos,
    baseActual: opc('baseMensualActual', 0, { min: 0, max: ss.baseMaximaMensual * 3 }),
    crecimientoBases: opc('crecimientoBases', inflacion, { min: -10, max: 30 }),
    situacionMinimo,
    comunidad: e.comunidad
  }
}

/** Bases de cotización por mes (índice → euros): historial + proyección hasta el mes anterior al hecho causante. */
function construirBases(d, hechoCausante, avisos) {
  const bases = new Map()
  for (const t of d.tramos) {
    for (let m = t.desde; m <= t.hasta; m++) {
      if (bases.has(m)) throw new ErrorEntrada(`El mes ${mesTexto(m)} aparece en más de un tramo`)
      if (t.base > 0) bases.set(m, t.base)
    }
  }
  if (d.baseActual > 0) {
    for (let m = d.actual; m < hechoCausante; m++) {
      const anios = Math.floor((m - d.actual) / 12)
      const sube = d.baseActual * Math.pow(1 + d.crecimientoBases / 100, anios)
      const tope = ss.baseMaximaMensual * Math.pow(1 + d.inflacion / 100, anios)
      bases.set(m, Math.min(sube, tope))
    }
    if (d.baseActual > ss.baseMaximaMensual) {
      avisos.push('Tu base actual supera la base máxima de cotización de 2026: se limita a ella.')
    }
  }
  return bases
}

/* ───────────── Cálculo ───────────── */

function baseReguladora(d, bases, hechoCausante, avisos) {
  const regla = ventanaDe(Math.floor(hechoCausante / 12))
  const ultimoMesNominal = hechoCausante - 2 // «mes previo» al hecho causante queda fuera
  const primero = hechoCausante - 1 - regla.ventana
  const referenciaIPC = indiceIPC(hechoCausante - 26, d.inflacion) // mes inmediato anterior a los 24 nominales
  const minimaEnero2026 = ss.baseMinimaDiariaGrupos8a11 * 30
  const ipcEnero2026 = indiceIPC(indiceMes('2026-01', 'enero'), d.inflacion)
  const lag = datos.BASE_REGULADORA.lagunas

  const valores = []
  let lagunas = 0
  let antiguosSinIPC = false
  for (let m = primero; m <= ultimoMesNominal; m++) {
    let base = bases.get(m)
    if (base === undefined) {
      const minima = minimaEnero2026 * (indiceIPC(m, d.inflacion) / ipcEnero2026)
      base = lagunas < lag.mesesBaseMinima ? minima : minima * lag.fraccionResto
      lagunas++
    }
    if (m > ultimoMesNominal - datos.BASE_REGULADORA.mesesNominales) {
      valores.push(base)
    } else {
      if (m < IPC_INICIO) antiguosSinIPC = true
      valores.push(base * (referenciaIPC / indiceIPC(m, d.inflacion)))
    }
  }
  if (lagunas > 0) {
    avisos.push(`${lagunas} meses de la ventana sin cotización se rellenan como lagunas (base mínima y luego el 50 %, LGSS art. 209.1.b); si tienes bases de esos meses, añádelas al historial.`)
  }
  if (antiguosSinIPC) {
    avisos.push('Hay bases anteriores a 2002, año en que empieza la serie de IPC usada: no se actualizan y la pensión puede estar infravalorada.')
  }
  const elegidos = valores.sort((a, b) => b - a).slice(0, regla.mejores)
  return { importe: elegidos.reduce((s, v) => s + v, 0) / regla.divisor, regla, lagunas }
}

function mesesCotizados(bases, hasta) {
  let n = 0
  let recientes = 0
  for (const m of bases.keys()) {
    if (m >= hasta) continue
    n++
    if (m >= hasta - datos.CARENCIA.ventanaRecienteMeses) recientes++
  }
  return { total: n, recientes }
}

function estimarPensionJubilacion(entrada) {
  const d = normalizar(entrada)
  const avisos = []
  const mesesHastaJubilacion = (d.edadJubilacion - d.edadActual) * 12
  const hechoCausante = d.actual + mesesHastaJubilacion
  const anio = Math.floor(hechoCausante / 12)
  ventanaDe(anio) // rechaza los años que la ley transitoria no cubre
  const bases = construirBases(d, hechoCausante, avisos)
  const { total, recientes } = mesesCotizados(bases, hechoCausante)

  const ordinaria = edadOrdinariaMeses(anio, total)
  const resumenEdad = { meses: ordinaria, texto: `${Math.floor(ordinaria / 12)} años${ordinaria % 12 ? ` y ${ordinaria % 12} meses` : ''}` }

  const salida = {
    ejercicio: datos.EJERCICIO,
    fechaDatos: datos.FECHA_DATOS,
    hechoCausante: mesTexto(hechoCausante),
    anioHechoCausante: anio,
    mesesCotizados: total,
    aniosCotizados: Math.floor(total / 12),
    mesesCotizadosResto: total % 12,
    edadOrdinaria: resumenEdad,
    avisos
  }

  // Requisitos (art. 205): carencia y edad
  const motivos = []
  if (total < datos.CARENCIA.mesesMinimos) {
    motivos.push(`Te faltan ${datos.CARENCIA.mesesMinimos - total} meses para los 15 años de cotización mínima.`)
  }
  if (recientes < datos.CARENCIA.mesesRecientesMinimos) {
    motivos.push('Necesitas al menos 2 años cotizados dentro de los 15 anteriores a la jubilación.')
  }
  if (d.edadJubilacion * 12 < ordinaria) {
    motivos.push(`Con ${salida.aniosCotizados} años cotizados la edad ordinaria de jubilación es ${resumenEdad.texto}; la jubilación anticipada no está incluida en este cálculo.`)
  }
  if (motivos.length > 0) return { ...salida, cumpleRequisitos: false, motivos }

  const br = baseReguladora(d, bases, hechoCausante, avisos)
  const pctBase = porcentajeBase(anio, total)
  const pctDemora = porcentajeDemora(d.edadJubilacion * 12 - ordinaria)
  const pctTotal = pctBase + pctDemora

  const factorInflacion = Math.pow(1 + d.inflacion / 100, anio - datos.EJERCICIO)
  const maximaMensual = datos.LIMITES.maximaMensual * factorInflacion
  const sinTope = br.importe * (pctTotal / 100)
  const mensual = Math.min(sinTope, maximaMensual)
  const anual = mensual * datos.LIMITES.pagas

  const deflactor = Math.pow(1 + d.inflacion / 100, mesesHastaJubilacion / 12)
  const anualReal = anual / deflactor
  const minimaTabla = d.edadJubilacion >= 65 ? datos.MINIMAS.titular65 : datos.MINIMAS.titularMenor65
  const minimaAnual = minimaTabla[d.situacionMinimo] * factorInflacion

  let irpf = null
  if (d.comunidad !== undefined) {
    const l = liquidacionIRPF({ comunidad: d.comunidad, rendimientoIntegro: redondear(anualReal), contribuyente: { edad: d.edadJubilacion } })
    irpf = l.soportado
      ? {
          soportado: true,
          cuotaAnual: l.cuotaIntegra,
          netoAnual: redondear(anualReal - l.cuotaIntegra),
          netoMensual: redondear((anualReal - l.cuotaIntegra) / datos.LIMITES.pagas),
          tipoMedio: l.tipoMedio
        }
      : { soportado: false, aviso: l.aviso }
  }

  if (sinTope > maximaMensual) avisos.push('La pensión alcanza el límite máximo de pensión: se aplica el tope.')
  if (anual < minimaAnual) {
    avisos.push('La pensión queda por debajo de la mínima: podrías tener derecho al complemento por mínimos si tus otras rentas no pasan del límite (RD 241/2026, art. 9).')
  }
  avisos.push(
    'Estimación con la LGSS vigente y el RD 241/2026. La Seguridad Social calcula la pensión real al jubilarte, con tus bases oficiales.',
    'El tope y la mínima futuros se suponen revalorizados con la inflación indicada (POR CONTRASTAR: la ley puede subirlos más).',
    'La parte de la inflación de 2026 en adelante es una hipótesis tuya; el IPC hasta diciembre de 2025 es el del INE.'
  )

  return {
    ...salida,
    cumpleRequisitos: true,
    baseReguladora: {
      mensual: redondear(br.importe),
      mensualReal: redondear(br.importe / deflactor),
      ventanaMeses: br.regla.ventana,
      mejoresMeses: br.regla.mejores,
      divisor: br.regla.divisor,
      lagunas: br.lagunas
    },
    porcentaje: { base: Math.round(pctBase * 100) / 100, demora: pctDemora, total: Math.round(pctTotal * 100) / 100 },
    pension: {
      mensual: redondear(mensual),
      anual: redondear(anual),
      mensualReal: redondear(mensual / deflactor),
      anualReal: redondear(anualReal),
      pagas: datos.LIMITES.pagas,
      limitadaPorMaxima: sinTope > maximaMensual,
      maximaMensual: redondear(maximaMensual),
      bajoMinima: anual < minimaAnual,
      minimaAnual: redondear(minimaAnual)
    },
    tasaSustitucion: d.baseActual > 0 ? Math.round((anualReal / (d.baseActual * 12)) * 10000) / 100 : null,
    irpf
  }
}

module.exports = { estimarPensionJubilacion, porcentajeBase, porcentajeDemora, edadOrdinariaMeses, ventanaDe }
