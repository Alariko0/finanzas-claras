'use strict'

const datos = require('./datos2026')
const { liquidacionIRPF } = require('./liquidacionIRPF')
const { cotizacionMensual } = require('./nomina')
const { proyectarJubilacion } = require('../jubilacion')
const { ErrorEntrada } = require('../errores')
const { aCentimos, aEuros, validarNumero } = require('../centimos')

/*
 * Plan de pensiones PRIVADO de un trabajador por cuenta ajena (la pensión pública está en services/pension/): ahorro fiscal de hoy, proyección del plan y
 * coste fiscal del rescate. Parte de los datos de la nómina (bruto, cotizaciones, comunidad,
 * familia) y de los supuestos de jubilación (edades, rentabilidad, inflación, tasa de retiro).
 *
 *  - Hoy: el ahorro fiscal es la diferencia de cuota íntegra (liquidacionIRPF) entre no aportar y
 *    aportar, con el límite de reducción del art. 52 LIRPF (datos2026.js, PREVISION_SOCIAL). La
 *    contribución de la empresa se imputa como rendimiento del trabajo (art. 17.1.e) y se reduce
 *    también, así que solo cuenta contra el límite.
 *  - Al jubilarte: las prestaciones tributan como rendimiento del trabajo, íntegras y sin las
 *    reducciones del art. 18 si se cobran en renta (art. 17.2.a.3.ª). Se calcula en euros de hoy con
 *    la escala 2026, sumando la pensión pública que indique el usuario.
 *
 * No modela: plan de autónomos, plan del cónyuge, discapacidad, arrastre de excesos de ejercicios
 * anteriores, la reducción del 40 % de aportaciones anteriores a 2007 ni el rescate en capital
 * (que sumaría todo el capital a la base de un solo año). ESTIMACIÓN: POR CONTRASTAR con el
 * simulador de la AEAT (lectura de que el 30 % limita también el incremento por la empresa).
 *
 * Funciones puras. Euros en la entrada y la salida; dentro, céntimos enteros.
 */

const P = datos.PREVISION_SOCIAL
const MAX_IMPORTE = 1e9

/** Aportación del trabajador que también gana el incremento, según la contribución C de la empresa (€). */
function aportacionTrabajadorConIncremento(contribucion, rendimientosDeLaEmpresa) {
  if (rendimientosDeLaEmpresa > P.umbralMultiplicadorUno) return contribucion
  const tramo = P.cuadroAportacionTrabajador.find((t) => t.hasta === null || contribucion <= t.hasta)
  return tramo.base + tramo.multiplicador * (contribucion - tramo.desde)
}

/**
 * Límite conjunto de reducción (art. 52.1) y reducción aplicable a lo aportado.
 * @param {number} propia - aportación del trabajador (€)
 * @param {number} empresa - contribución de la empresa (€)
 * @param {number} rendimientoNeto - rendimientos netos del trabajo (€)
 * @param {number} rendimientosEmpresa - rendimientos íntegros del trabajo de esa empresa (€)
 */
function reduccionPrevision({ propia, empresa, rendimientoNeto, rendimientosEmpresa }) {
  const porcentaje = Math.max(0, (rendimientoNeto * P.porcentajeRendimientos) / 100)
  const emparejada = empresa > 0
    ? Math.min(propia, aportacionTrabajadorConIncremento(empresa, rendimientosEmpresa))
    : 0
  const incremento = empresa > 0 ? Math.min(P.incrementoContribucionEmpresa, empresa + emparejada) : 0
  const limite = Math.min(porcentaje, P.limiteGeneral + incremento)
  const aportado = propia + empresa
  const aplicada = Math.min(aportado, limite)
  return { limite, incremento, aportado, aplicada, exceso: aportado - aplicada }
}

/** Mayor aportación propia que aún se reduce entera (cierre algebraico de reduccionPrevision). */
function aportacionPropiaMaxima({ empresa, rendimientoNeto, rendimientosEmpresa }) {
  const porcentaje = Math.max(0, (rendimientoNeto * P.porcentajeRendimientos) / 100)
  const conjunto = P.limiteGeneral + P.incrementoContribucionEmpresa
  const m = empresa > 0 ? aportacionTrabajadorConIncremento(empresa, rendimientosEmpresa) : 0
  const sinSuperarEmparejada = Math.min(m, conjunto - empresa)
  const superandola = P.limiteGeneral + Math.min(P.incrementoContribucionEmpresa - empresa, m)
  const porLey = Math.max(sinSuperarEmparejada, empresa > 0 ? superandola : P.limiteGeneral)
  return Math.max(0, Math.min(porLey, porcentaje - empresa))
}

function normalizar(e) {
  if (!e || typeof e !== 'object') throw new ErrorEntrada('Faltan los datos del plan de pensiones')
  const opc = (clave, def, limites) => (e[clave] === undefined ? def : validarNumero(e[clave], clave, limites))
  return {
    brutoAnual: validarNumero(e.brutoAnual, 'brutoAnual', { min: 0.01, max: MAX_IMPORTE }),
    grupoCotizacion: e.grupoCotizacion ?? 1,
    contrato: e.contrato ?? 'indefinido',
    aportacionAnual: opc('aportacionAnual', 0, { min: 0, max: MAX_IMPORTE }),
    contribucionEmpresaAnual: opc('contribucionEmpresaAnual', 0, { min: 0, max: MAX_IMPORTE }),
    saldoActual: opc('saldoActual', 0, { min: 0, max: MAX_IMPORTE }),
    pensionPublicaMensual: opc('pensionPublicaMensual', 0, { min: 0, max: MAX_IMPORTE })
  }
}

function proyectarPlan(e, d, aportadoAnual) {
  return proyectarJubilacion({
    edadActual: e.edadActual,
    edadJubilacion: e.edadJubilacion,
    rentabilidad: e.rentabilidad,
    rentabilidadJubilacion: e.rentabilidadJubilacion,
    inflacion: e.inflacion,
    crecimientoAportacion: e.crecimientoAportacion,
    tasaRetiro: e.tasaRetiro,
    ahorroActual: d.saldoActual,
    aportacionMensual: aportadoAnual / 12
  })
}

function calcularPlanPensionesPrivado(entrada) {
  const d = normalizar(entrada)
  const e = entrada
  const personas = {
    contribuyente: { ...(e.contribuyente || {}), edad: e.edadActual },
    descendientes: e.descendientes,
    ascendientes: e.ascendientes
  }

  const ssAnual = aEuros((cotizacionMensual({
    brutoAnualCentimos: aCentimos(d.brutoAnual),
    grupo: d.grupoCotizacion,
    contrato: d.contrato,
    tasaAccidentes: 0
  }).totalTrabajador) * 12)
  const rendimientoIntegro = d.brutoAnual + d.contribucionEmpresaAnual

  const irpf = (reduccionesBase) => liquidacionIRPF({
    comunidad: e.comunidad,
    rendimientoIntegro,
    cotizacionesSS: ssAnual,
    movilidadGeografica: e.movilidadGeografica,
    reduccionesBase,
    ...personas
  })

  const base = irpf(0)
  if (!base.soportado) return { soportado: false, aviso: base.aviso, fechaDatos: base.fechaDatos }

  const rendimientoNeto = base.rendimientoNetoPrevio - base.otrosGastos
  const contexto = { empresa: d.contribucionEmpresaAnual, rendimientoNeto, rendimientosEmpresa: d.brutoAnual }
  const sinAportar = reduccionPrevision({ ...contexto, propia: 0 })
  const aportando = reduccionPrevision({ ...contexto, propia: d.aportacionAnual })
  const cuotaSin = irpf(sinAportar.aplicada).cuotaIntegra
  const cuotaCon = irpf(aportando.aplicada).cuotaIntegra
  const ahorroFiscal = Math.max(0, aEuros(aCentimos(cuotaSin) - aCentimos(cuotaCon)))
  const maxima = aportacionPropiaMaxima(contexto)

  const aportadoAnual = d.aportacionAnual + d.contribucionEmpresaAnual
  const proyeccion = proyectarPlan(e, d, aportadoAnual)

  // Rescate en renta, en euros de hoy: lo que añade el plan a la pensión pública
  const rentaPlanAnual = proyeccion.renta.mensualReal * 12
  const pensionPublicaAnual = d.pensionPublicaMensual * 12
  const irpfJubilado = (rendimientoIntegro) => liquidacionIRPF({
    comunidad: e.comunidad,
    rendimientoIntegro,
    contribuyente: { edad: e.edadJubilacion }
  })
  const impuestoRescate = Math.max(0, aEuros(
    aCentimos(irpfJubilado(pensionPublicaAnual + rentaPlanAnual).cuotaIntegra) -
    aCentimos(irpfJubilado(pensionPublicaAnual).cuotaIntegra)
  ))

  const redondeo = (x) => aEuros(aCentimos(x))
  const avisos = [
    ...base.avisos,
    'Estimación POR CONTRASTAR con el simulador de la AEAT: se aplica el límite del art. 52 LIRPF a la suma de aportación propia y contribución de la empresa.',
    'No incluye: plan de autónomos, plan del cónyuge, discapacidad, excesos de ejercicios anteriores, aportaciones anteriores a 2007 ni el rescate en capital.',
    'El rescate se calcula en euros de hoy con la normativa de 2026; la tributación futura puede cambiar.'
  ]
  if (aportando.exceso > 0) {
    avisos.push('Parte de lo aportado supera el límite de reducción de este año: no reduce ahora la base (puede arrastrarse cinco ejercicios si no excede del máximo legal).')
  }

  return {
    soportado: true,
    ejercicio: base.ejercicio,
    fechaDatos: base.fechaDatos,
    fiscal: {
      rendimientoNeto: redondeo(rendimientoNeto),
      cotizacionesSS: redondeo(ssAnual),
      limiteReduccion: redondeo(aportando.limite),
      incrementoEmpresa: redondeo(aportando.incremento),
      aportado: redondeo(aportando.aportado),
      reduccionAplicada: redondeo(aportando.aplicada),
      exceso: redondeo(aportando.exceso),
      aportacionPropiaMaxima: redondeo(maxima),
      cuotaSinAportar: cuotaSin,
      cuotaAportando: cuotaCon,
      ahorroFiscal: redondeo(ahorroFiscal),
      tipoAhorro: d.aportacionAnual > 0 ? Math.round((ahorroFiscal / d.aportacionAnual) * 10000) / 100 : null,
      costeNeto: redondeo(Math.max(0, d.aportacionAnual - ahorroFiscal))
    },
    proyeccion,
    rescate: {
      rentaPlanAnual: redondeo(rentaPlanAnual),
      pensionPublicaAnual: redondeo(pensionPublicaAnual),
      impuestoAnual: redondeo(impuestoRescate),
      netoMensual: redondeo((rentaPlanAnual - impuestoRescate) / 12),
      tipoMedio: rentaPlanAnual > 0 ? Math.round((impuestoRescate / rentaPlanAnual) * 10000) / 100 : null
    },
    avisos
  }
}

module.exports = { calcularPlanPensionesPrivado, reduccionPrevision, aportacionPropiaMaxima }
