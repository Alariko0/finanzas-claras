'use strict'

const datosHipotecas = require('./datosHipotecas')

/*
 * Préstamos e hipotecas: tipo fijo, variable y mixto; sistemas francés, alemán y americano.
 *
 * Sistemas de amortización:
 *  - frances: cuota constante (capital + intereses). Es el habitual en España (Banco de España).
 *  - aleman: capital amortizado constante; la cuota empieza alta y baja.
 *  - americano: solo intereses durante el plazo y todo el capital en la última cuota.
 *
 * Tipos de interés (Banco de España; Ley 5/2019):
 *  - fijo: un TIN para toda la vida.
 *  - variable: TIN inicial hasta la primera revisión; después Euríbor + diferencial, que se revisa
 *    cada `periodoRevision` meses. No hay suelo y el tipo nunca es negativo (art. 21).
 *  - mixto: tipo fijo `mesesFijos` y después variable (Euríbor + diferencial) con revisiones.
 *  El Euríbor futuro no se conoce: se usa el valor que da quien llama (constante, con tramos
 *  opcionales) y se ofrecen escenarios de subida y bajada. NO hay ningún Euríbor por defecto.
 *
 * Convenciones: interés de cada mes = saldo × TIN / 12 redondeado al céntimo (como un cuadro
 * bancario); la última cuota se ajusta para dejar el saldo a cero; en cada revisión la cuota se
 * recalcula sobre el capital pendiente y los meses que quedan; primera cuota un mes después de
 * `fechaInicio` conservando el día (se recorta a fin de mes).
 * TAE = (1 + i)^12 − 1 con i la TIR mensual. En variable y mixto, la TAE sigue el supuesto legal
 * (Ley 5/2019, Anexo II.II.e): tras el periodo inicial el tipo es el del Euríbor actual más
 * diferencial, sin bajar del tipo fijado.
 *
 * Funciones puras. Entradas y salidas en euros; dentro, céntimos enteros. ESTIMACIÓN: no sustituye
 * al cuadro del contrato ni a la FEIN.
 */

class ErrorEntrada extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'ErrorEntrada'
  }
}

const MAX_MESES = 600
const MAX_CAPITAL = 100_000_000
const MAX_TIN = 50
const SISTEMAS = ['frances', 'aleman', 'americano']
const TIPOS = ['fijo', 'variable', 'mixto']
const ESCENARIOS_POR_DEFECTO = [-1, 1, 2]

const aCentimos = (euros) => Math.round(euros * 100)
const euros = (centimos) => centimos / 100

function numero(valor, nombre, { min = 0, max = Infinity, exclusivoMin = false } = {}) {
  const valido = typeof valor === 'number' && Number.isFinite(valor) &&
    (exclusivoMin ? valor > min : valor >= min) && valor <= max
  if (!valido) {
    throw new ErrorEntrada(`${nombre} debe ser un número ${exclusivoMin ? '>' : '≥'} ${min} y ≤ ${max}`)
  }
  return valor
}

function entero(valor, nombre, { min, max }) {
  if (!Number.isInteger(valor) || valor < min || valor > max) {
    throw new ErrorEntrada(`${nombre} debe ser un entero entre ${min} y ${max}`)
  }
  return valor
}

/* ───────────────────────────── fechas ───────────────────────────── */

function analizarFecha(texto, nombre = 'fechaInicio') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '')
  if (!m) throw new ErrorEntrada(`${nombre} debe tener el formato AAAA-MM-DD`)
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const comprobada = new Date(Date.UTC(anio, mes - 1, dia))
  if (comprobada.getUTCFullYear() !== anio || comprobada.getUTCMonth() !== mes - 1 || comprobada.getUTCDate() !== dia) {
    throw new ErrorEntrada(`${nombre} no es una fecha válida`)
  }
  return { anio, mes, dia }
}

// Fecha de la cuota k (k = 1 → un mes después), conservando el día de inicio
function fechaCuota({ anio, mes, dia }, k) {
  const indice = anio * 12 + (mes - 1) + k
  const a = Math.floor(indice / 12)
  const m = indice % 12
  const ultimoDia = new Date(Date.UTC(a, m + 1, 0)).getUTCDate()
  const d = Math.min(dia, ultimoDia)
  return `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/* ───────────────────────── configuración del tipo ───────────────────────── */

function validarTipo(entrada, meses) {
  const tipoInteres = entrada.tipoInteres ?? 'fijo'
  if (!TIPOS.includes(tipoInteres)) throw new ErrorEntrada('tipoInteres debe ser fijo, variable o mixto')
  const cfg = { tipoInteres }

  if (entrada.tin !== undefined) cfg.tin = numero(entrada.tin, 'tin', { max: MAX_TIN })
  if (tipoInteres === 'fijo' || tipoInteres === 'mixto') {
    if (cfg.tin === undefined) throw new ErrorEntrada('tin es obligatorio en tipo fijo y mixto')
  }
  if (tipoInteres === 'fijo') return cfg

  cfg.diferencial = numero(entrada.diferencial, 'diferencial', { min: 0, max: 20 })
  cfg.euribor = numero(entrada.euribor, 'euribor', { min: -5, max: 30 })
  cfg.periodoRevision = entero(entrada.periodoRevision ?? 12, 'periodoRevision', { min: 1, max: 60 })
  if (tipoInteres === 'mixto') {
    cfg.mesesFijos = entero(entrada.mesesFijos, 'mesesFijos', { min: 1, max: meses - 1 })
  } else {
    cfg.primeraRevision = entero(entrada.primeraRevision ?? cfg.periodoRevision, 'primeraRevision', { min: 1, max: meses })
  }

  const futuro = entrada.euriborFuturo ?? []
  if (!Array.isArray(futuro) || futuro.length > 50) throw new ErrorEntrada('euriborFuturo debe ser una lista de hasta 50 puntos')
  cfg.euriborFuturo = futuro
    .map((p) => ({
      mes: entero(p?.mes, 'euriborFuturo.mes', { min: 1, max: MAX_MESES }),
      valor: numero(p?.valor, 'euriborFuturo.valor', { min: -5, max: 30 })
    }))
    .sort((a, b) => a.mes - b.mes)
  return cfg
}

/*
 * Devuelve las funciones que dicen, para la cuota k (1-based), qué TIN se aplica y si se revisa.
 * @param {Object} opciones
 * @param {number} [opciones.delta=0] - puntos que se suman al Euríbor en todas las revisiones
 * @param {boolean} [opciones.regulatorio=false] - supuesto legal de la TAE (Euríbor actual, no inferior al fijado)
 */
function crearTipo(cfg, { delta = 0, regulatorio = false } = {}) {
  if (cfg.tipoInteres === 'fijo') {
    return { tinEn: () => cfg.tin, revisaEn: () => false, periodoInicial: Infinity }
  }
  const periodoInicial = cfg.tipoInteres === 'mixto' ? cfg.mesesFijos : cfg.primeraRevision
  const R = cfg.periodoRevision
  const tinInicial = cfg.tin ?? Math.max(datosHipotecas.INTERES_MINIMO, cfg.euribor + cfg.diferencial)

  const euriborEn = (mes) => {
    let valor = cfg.euribor
    for (const p of cfg.euriborFuturo) if (p.mes <= mes) valor = p.valor
    return valor
  }
  const mesRevision = (k) => periodoInicial + 1 + Math.floor((k - periodoInicial - 1) / R) * R

  return {
    periodoInicial,
    revisaEn: (k) => k > periodoInicial && (k - periodoInicial - 1) % R === 0,
    tinEn: (k) => {
      if (k <= periodoInicial) return tinInicial
      if (regulatorio) {
        return Math.max(tinInicial, Math.max(datosHipotecas.INTERES_MINIMO, cfg.euribor + cfg.diferencial))
      }
      // Art. 21: sin suelo, pero el interés remuneratorio no puede ser negativo
      return Math.max(datosHipotecas.INTERES_MINIMO, euriborEn(mesRevision(k)) + delta + cfg.diferencial)
    }
  }
}

/* ───────────────────────────── motor de cuotas ───────────────────────────── */

// Cuota constante exacta (float) para `saldo` céntimos, tipo mensual `i` y `n` meses
function cuotaExacta(saldo, i, n) {
  if (i === 0) return saldo / n
  return (saldo * i) / (1 - Math.pow(1 + i, -n))
}

/*
 * Genera las cuotas desde la k0 + 1 hasta saldo 0.
 * - frances: cuota constante, recalculada en cada revisión sobre el saldo y los meses restantes.
 * - aleman: capital constante (saldo / meses restantes), recalculado en cada revisión.
 * - americano: solo intereses; el capital entero en la última cuota.
 * `baseForzada` (céntimos) fija la cuota (francés) o el capital (alemán) de la primera fila, para
 * «reducir plazo»: se mantiene lo que ya se pagaba.
 */
function generarCuadro({ saldo, k0 = 0, mesesTotales, sistema, tinEn, revisaEn, baseForzada }) {
  const filas = []
  let restante = saldo
  let base = 0

  for (let k = k0 + 1; restante > 0; k++) {
    if (k > mesesTotales + 1) throw new ErrorEntrada('El préstamo no se amortiza dentro del plazo previsto')
    const tin = tinEn(k)
    const i = tin / 1200
    const mesesRestantes = mesesTotales - k + 1

    if (k === k0 + 1 || revisaEn(k)) {
      if (k === k0 + 1 && baseForzada !== undefined) base = baseForzada
      else if (sistema === 'frances') base = Math.round(cuotaExacta(restante, i, mesesRestantes))
      else if (sistema === 'aleman') base = Math.round(restante / mesesRestantes)
    }

    const intereses = Math.round(restante * i)
    let capital
    if (sistema === 'frances') capital = base - intereses
    else if (sistema === 'aleman') capital = base
    else capital = k === mesesTotales ? restante : 0

    if (sistema === 'frances' && capital <= 0) {
      throw new ErrorEntrada('La cuota no cubre los intereses: el préstamo no se amortizaría nunca')
    }
    if (k === mesesTotales || capital >= restante) capital = restante
    restante -= capital
    filas.push({ numero: k, cuota: capital + intereses, intereses, capital, saldo: restante, tin, cuotaBase: base })
  }
  return filas
}

// Meses que hacen falta para pagar `saldo` con una cuota fija al tipo `tin` (reducir plazo, francés)
function mesesConCuotaFija(saldo, tin, cuota) {
  const i = tin / 1200
  let restante = saldo
  let n = 0
  while (restante > 0) {
    n++
    const intereses = Math.round(restante * i)
    if (cuota <= intereses) throw new ErrorEntrada('La cuota no cubre los intereses: el préstamo no se amortizaría nunca')
    restante -= Math.min(restante, cuota - intereses)
    if (n > MAX_MESES * 2) throw new ErrorEntrada('El préstamo no se amortiza dentro del plazo previsto')
  }
  return n
}

const sumar = (filas, campo) => filas.reduce((total, f) => total + f[campo], 0)

// Valor presente neto de los flujos con tipo mensual i (euros, float)
function vpn(i, recibido, pagos) {
  let valor = recibido
  let factor = 1
  for (const p of pagos) {
    factor /= 1 + i
    valor -= p * factor
  }
  return valor
}

// TAE en % por bisección sobre el tipo mensual; null si no hay solución
function calcularTAE(recibido, pagos) {
  if (recibido <= 0 || pagos.length === 0) return null
  // El valor neto crece con el tipo: a i = 0 es recibido − pagos (≤ 0 si pagas más de lo que recibes)
  const aCero = vpn(0, recibido, pagos)
  if (Math.abs(aCero) < 1e-6) return 0
  if (aCero > 0) return null // pagas menos de lo que recibes
  let bajo = 0
  let alto = 1
  for (let it = 0; it < 200; it++) {
    const medio = (bajo + alto) / 2
    if (vpn(medio, recibido, pagos) > 0) alto = medio
    else bajo = medio
  }
  const i = (bajo + alto) / 2
  return Math.round((Math.pow(1 + i, 12) - 1) * 1e4) / 1e2 // % con 2 decimales
}

function resumenAnual(filas, fechaInicio) {
  const anios = new Map()
  filas.forEach((f) => {
    const clave = fechaInicio ? Number(f.fecha.slice(0, 4)) : Math.ceil(f.numero / 12)
    const a = anios.get(clave) || { anio: clave, cuotas: 0, intereses: 0, capital: 0, saldoFinal: 0 }
    a.cuotas += f.cuota
    a.intereses += f.intereses
    a.capital += f.capital
    a.saldoFinal = f.saldo
    anios.set(clave, a)
  })
  return [...anios.values()].map((a) => ({
    anio: a.anio,
    cuotas: euros(a.cuotas),
    intereses: euros(a.intereses),
    capital: euros(a.capital),
    saldoFinal: euros(a.saldoFinal)
  }))
}

function conFechas(filas, inicio) {
  return filas.map((f) => ({ ...f, ...(inicio ? { fecha: fechaCuota(inicio, f.numero) } : {}) }))
}

function filasEnEuros(filas, conTin) {
  return filas.map((f) => ({
    numero: f.numero,
    ...(f.fecha ? { fecha: f.fecha } : {}),
    cuota: euros(f.cuota),
    intereses: euros(f.intereses),
    capital: euros(f.capital),
    saldo: euros(f.saldo),
    ...(conTin ? { tin: f.tin } : {})
  }))
}

// Cuota máxima y mínima del cuadro, sin la última fila (que se ajusta o liquida el capital)
function extremosCuota(filas) {
  const cuotas = (filas.length > 1 ? filas.slice(0, -1) : filas).map((f) => f.cuota)
  return { maxima: Math.max(...cuotas), minima: Math.min(...cuotas) }
}

// Filas donde cambia el tipo: la primera y cada revisión
function listarRevisiones(filas, revisaEn) {
  return filas
    .filter((f) => f.numero === filas[0].numero || revisaEn(f.numero))
    .map((f) => ({ numero: f.numero, ...(f.fecha ? { fecha: f.fecha } : {}), tin: f.tin, cuota: euros(f.cuota) }))
}

function validarPrestamo(entrada) {
  const meses = entero(entrada.meses, 'meses', { min: 1, max: MAX_MESES })
  const sistema = entrada.sistema ?? 'frances'
  if (!SISTEMAS.includes(sistema)) throw new ErrorEntrada('sistema debe ser frances, aleman o americano')
  return {
    capital: aCentimos(numero(entrada.capital, 'capital', { min: 0, max: MAX_CAPITAL, exclusivoMin: true })),
    meses,
    sistema,
    cfg: validarTipo(entrada, meses)
  }
}

/* ─────────────────────── comisión por amortizar: topes legales ─────────────────────── */

/**
 * Tope legal (% del capital reembolsado) de la comisión por amortizar tras `mes` cuotas pagadas.
 * Ley 5/2019, art. 23.5-23.7 (ver datosHipotecas.js). Es un TOPE: la ley también la limita a la
 * pérdida financiera real, que aquí no se calcula.
 */
function comisionMaximaLegal(cfg, mes, { novacionAFijo = false } = {}) {
  const t = datosHipotecas.TOPES_COMISION
  if (novacionAFijo && cfg.tipoInteres !== 'fijo') {
    return mes <= t.novacionAFijo.hastaMeses
      ? { pct: t.novacionAFijo.pct, nota: 'Novación de variable a fijo (art. 23.6): máximo 0,05 % en los 3 primeros años.' }
      : { pct: 0, nota: 'Novación de variable a fijo pasados 3 años (art. 23.6): no puede cobrarse comisión.' }
  }
  const tramoFijo = cfg.tipoInteres === 'fijo' || (cfg.tipoInteres === 'mixto' && mes < cfg.mesesFijos)
  if (tramoFijo) {
    return mes <= t.fijo.hastaMeses
      ? { pct: t.fijo.pctHasta, nota: 'Tramo fijo (art. 23.7): máximo 2 % en los 10 primeros años.' }
      : { pct: t.fijo.pctDespues, nota: 'Tramo fijo (art. 23.7): máximo 1,5 % pasados 10 años.' }
  }
  const { opcionA, opcionB } = t.variable
  if (mes <= opcionB.hastaMeses) {
    return { pct: opcionB.pct, nota: 'Tramo variable (art. 23.5): 0,25 % si el contrato pactó el supuesto de 3 años, o 0,15 % si pactó el de 5 años.' }
  }
  if (mes <= opcionA.hastaMeses) {
    return { pct: opcionA.pct, nota: 'Tramo variable (art. 23.5): 0,15 % solo si el contrato pactó el supuesto de 5 años; si no, ninguna.' }
  }
  return { pct: 0, nota: 'Tramo variable pasados 5 años (art. 23.5): no puede cobrarse comisión.' }
}

/* ───────────────────────────── API pública ───────────────────────────── */

/** Cuota mensual constante (euros), sistema francés a tipo fijo. */
function cuotaFrancesa(capital, tin, meses) {
  const p = validarPrestamo({ capital, tin, meses })
  return euros(Math.round(cuotaExacta(p.capital, p.cfg.tin / 1200, p.meses)))
}

/**
 * Cuadro de amortización completo con TAE.
 * @param {Object} entrada
 * @param {number} entrada.capital - €
 * @param {number} entrada.meses
 * @param {'frances'|'aleman'|'americano'} [entrada.sistema='frances']
 * @param {'fijo'|'variable'|'mixto'} [entrada.tipoInteres='fijo']
 * @param {number} [entrada.tin] - % anual: fijo y mixto (tramo fijo); en variable, tipo hasta la primera revisión
 * @param {number} [entrada.mesesFijos] - mixto: cuotas a tipo fijo
 * @param {number} [entrada.diferencial] - variable y mixto, puntos porcentuales sobre el Euríbor
 * @param {number} [entrada.euribor] - variable y mixto: valor supuesto del índice (%)
 * @param {number} [entrada.periodoRevision=12] - meses entre revisiones
 * @param {number} [entrada.primeraRevision] - variable: cuotas hasta la primera revisión (def. = periodoRevision)
 * @param {{mes:number, valor:number}[]} [entrada.euriborFuturo] - cambios supuestos del índice desde el mes indicado
 * @param {number[]} [entrada.escenariosEuribor] - puntos a sumar al Euríbor (def. -1, 1, 2)
 * @param {string} [entrada.fechaInicio] - AAAA-MM-DD
 * @param {number} [entrada.comisionApertura] - % del capital
 * @param {number} [entrada.gastosIniciales] - €
 * @param {number} [entrada.gastosMensuales] - €/mes (seguros): entran en la TAE pero no en el cuadro
 */
function cuadroAmortizacion(entrada = {}) {
  const { capital, meses, sistema, cfg } = validarPrestamo(entrada)
  const inicio = entrada.fechaInicio ? analizarFecha(entrada.fechaInicio) : null
  const comisionPct = numero(entrada.comisionApertura ?? 0, 'comisionApertura', { max: 100 })
  const comision = Math.round((capital * comisionPct) / 100)
  const gastosIniciales = aCentimos(numero(entrada.gastosIniciales ?? 0, 'gastosIniciales', { max: MAX_CAPITAL }))
  const gastosMensuales = aCentimos(numero(entrada.gastosMensuales ?? 0, 'gastosMensuales', { max: MAX_CAPITAL }))
  const conTin = cfg.tipoInteres !== 'fijo'

  const generar = (opciones) => {
    const tipo = crearTipo(cfg, opciones)
    return { tipo, filas: conFechas(generarCuadro({ saldo: capital, mesesTotales: meses, sistema, ...tipo }), inicio) }
  }
  const { tipo, filas } = generar({})

  const totalIntereses = sumar(filas, 'intereses')
  const totalCuotas = sumar(filas, 'cuota')
  const costes = comision + gastosIniciales + gastosMensuales * filas.length

  // TAE: en variable y mixto, con el supuesto legal del índice constante (Anexo II.II.e)
  const filasTAE = conTin ? generar({ regulatorio: true }).filas : filas
  const tae = calcularTAE(
    euros(capital - comision - gastosIniciales),
    filasTAE.map((f) => euros(f.cuota + gastosMensuales))
  )

  const avisos = ['Estimación. El cuadro de tu contrato manda.']
  if (conTin) {
    avisos.push(`El Euríbor futuro no se conoce: se ha supuesto ${cfg.euribor} % (más los cambios que indiques). ` +
      'La TAE usa el supuesto legal del índice constante (Ley 5/2019, Anexo II) y no es el coste real.')
  }
  if (sistema === 'americano') avisos.push('Sistema americano: solo pagas intereses y el capital entero vence en la última cuota.')

  const extremos = extremosCuota(filas)
  const resultado = {
    sistema,
    tipoInteres: cfg.tipoInteres,
    capital: euros(capital),
    meses: filas.length,
    cuota: euros(filas[0].cuota),
    tinInicial: filas[0].tin,
    cuotaMaxima: euros(extremos.maxima),
    cuotaMinima: euros(extremos.minima),
    ultimaCuota: euros(filas[filas.length - 1].cuota),
    totalIntereses: euros(totalIntereses),
    totalCuotas: euros(totalCuotas),
    comisionApertura: euros(comision),
    gastosIniciales: euros(gastosIniciales),
    gastosMensuales: euros(gastosMensuales),
    costeTotal: euros(totalIntereses + costes),
    totalPagado: euros(totalCuotas + costes),
    tae,
    fechaFin: inicio ? filas[filas.length - 1].fecha : undefined,
    resumenAnual: resumenAnual(filas, inicio),
    filas: filasEnEuros(filas, conTin),
    avisos,
    aviso: avisos[0]
  }

  if (conTin) {
    resultado.revisiones = listarRevisiones(filas, tipo.revisaEn)
    const deltas = entrada.escenariosEuribor ?? ESCENARIOS_POR_DEFECTO
    if (!Array.isArray(deltas) || deltas.length > 5) throw new ErrorEntrada('escenariosEuribor debe ser una lista de hasta 5 valores')
    resultado.escenarios = deltas.map((d) => {
      const puntos = numero(d, 'escenariosEuribor', { min: -10, max: 10 })
      const f = generar({ delta: puntos }).filas
      const ext = extremosCuota(f)
      const intereses = sumar(f, 'intereses')
      return {
        puntos,
        tinFinal: f[f.length - 1].tin,
        cuotaMaxima: euros(ext.maxima),
        cuotaMinima: euros(ext.minima),
        cuotaFinal: euros(f[f.length - 1].cuota),
        totalIntereses: euros(intereses),
        diferenciaIntereses: euros(intereses - totalIntereses)
      }
    })
  }
  return resultado
}

/**
 * Amortización anticipada parcial o total tras pagar la cuota `mesAmortizacion`.
 * Admite los mismos datos de préstamo que `cuadroAmortizacion` y además:
 * @param {number} entrada.mesAmortizacion - cuotas ya pagadas (0 ... meses − 1)
 * @param {number} entrada.importe - € a amortizar
 * @param {'reducirCuota'|'reducirPlazo'} [entrada.modo='reducirPlazo']
 * @param {number} [entrada.comisionPct=0] - % de comisión sobre lo amortizado
 * @param {number} [entrada.nuevoTin] - novación a tipo fijo: TIN que aplica desde la amortización
 */
function amortizacionAnticipada(entrada = {}) {
  const { capital, meses, sistema, cfg } = validarPrestamo(entrada)
  const inicio = entrada.fechaInicio ? analizarFecha(entrada.fechaInicio) : null
  let modo = entrada.modo ?? 'reducirPlazo'
  if (modo !== 'reducirCuota' && modo !== 'reducirPlazo') throw new ErrorEntrada('modo debe ser reducirCuota o reducirPlazo')
  const m = entero(entrada.mesAmortizacion, 'mesAmortizacion', { min: 0, max: meses - 1 })
  const importe = aCentimos(numero(entrada.importe, 'importe', { min: 0, max: MAX_CAPITAL, exclusivoMin: true }))
  const comisionPct = numero(entrada.comisionPct ?? 0, 'comisionPct', { max: 100 })
  const nuevoTin = entrada.nuevoTin === undefined || entrada.nuevoTin === null
    ? undefined
    : numero(entrada.nuevoTin, 'nuevoTin', { max: MAX_TIN })

  const avisos = ['Estimación. Revisa en tu contrato la comisión y las condiciones de amortización.']
  if (sistema === 'americano' && modo === 'reducirPlazo') {
    modo = 'reducirCuota'
    avisos.push('En el sistema americano el capital vence al final: amortizar reduce los intereses, no el plazo.')
  }

  const tipoOriginal = crearTipo(cfg)
  const original = conFechas(
    generarCuadro({ saldo: capital, mesesTotales: meses, sistema, ...tipoOriginal }), inicio
  )
  const pagadas = original.slice(0, m)
  const saldoAntes = m === 0 ? capital : pagadas[m - 1].saldo
  const amortizado = Math.min(importe, saldoAntes)
  const saldoDespues = saldoAntes - amortizado
  const comision = Math.round((amortizado * comisionPct) / 100)

  // Tras amortizar: tipo original, o fijo si se novaciona
  const tipoNuevo = nuevoTin === undefined
    ? tipoOriginal
    : { tinEn: (k) => (k <= m ? tipoOriginal.tinEn(k) : nuevoTin), revisaEn: (k) => (k <= m ? tipoOriginal.revisaEn(k) : false) }

  let nuevas = []
  if (saldoDespues > 0) {
    let mesesTotales = meses
    let baseForzada
    if (modo === 'reducirPlazo') {
      const baseActual = original[m].cuotaBase
      baseForzada = baseActual
      if (sistema === 'frances') mesesTotales = m + mesesConCuotaFija(saldoDespues, tipoNuevo.tinEn(m + 1), baseActual)
      else if (sistema === 'aleman') mesesTotales = m + Math.ceil(saldoDespues / baseActual)
    }
    nuevas = conFechas(
      generarCuadro({ saldo: saldoDespues, k0: m, mesesTotales, sistema, baseForzada, ...tipoNuevo }), inicio
    )
  }

  const filasNuevo = [...pagadas, ...nuevas]
  const interesesOriginal = sumar(original, 'intereses')
  const interesesNuevo = sumar(filasNuevo, 'intereses')
  const ahorroIntereses = interesesOriginal - interesesNuevo
  const ultima = filasNuevo.length ? filasNuevo[filasNuevo.length - 1] : null

  const tope = comisionMaximaLegal(cfg, m, { novacionAFijo: nuevoTin !== undefined })
  if (comisionPct > tope.pct) {
    avisos.push(tope.pct === 0
      ? `Con estos datos la ley no permite cobrar comisión (${tope.nota}).`
      : `La comisión indicada supera el máximo legal del ${tope.pct} % (${tope.nota}).`)
  }

  const conTin = cfg.tipoInteres !== 'fijo' && nuevoTin === undefined
  return {
    sistema,
    tipoInteres: cfg.tipoInteres,
    saldoAntes: euros(saldoAntes),
    importeAmortizado: euros(amortizado),
    saldoDespues: euros(saldoDespues),
    liquidaPrestamo: saldoDespues === 0,
    modo,
    comision: euros(comision),
    comisionMaximaLegalPct: tope.pct,
    comisionMaximaLegalNota: tope.nota,
    cuotaActual: euros(original[m].cuota),
    cuotaNueva: euros(nuevas.length ? nuevas[0].cuota : 0),
    mesesActuales: original.length,
    mesesNuevos: filasNuevo.length,
    mesesAhorrados: original.length - filasNuevo.length,
    interesesActuales: euros(interesesOriginal),
    interesesNuevos: euros(interesesNuevo),
    ahorroIntereses: euros(ahorroIntereses),
    ahorroNeto: euros(ahorroIntereses - comision),
    fechaFinActual: inicio ? original[original.length - 1].fecha : undefined,
    fechaFinNueva: inicio && ultima ? ultima.fecha : undefined,
    resumenAnualNuevo: resumenAnual(filasNuevo, inicio),
    ...(conTin && nuevas.length ? { revisionesNuevas: listarRevisiones(nuevas, tipoNuevo.revisaEn) } : {}),
    avisos,
    aviso: avisos[0]
  }
}

module.exports = {
  cuotaFrancesa,
  cuadroAmortizacion,
  amortizacionAnticipada,
  comisionMaximaLegal,
  ErrorEntrada,
  fechaCuota,
  analizarFecha,
  SISTEMAS,
  TIPOS
}
