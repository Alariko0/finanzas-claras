'use strict'

const datos = require('./datos2026')
const { aCentimos } = require('./escalas')
const { ErrorEntrada, importe } = require('./liquidacionIRPF')
const { estimarRetencionNomina } = require('./retencionNomina')

/*
 * Nómina completa — ejercicio 2026: bruto → Seguridad Social (trabajador y empresa) → retención
 * de IRPF (algoritmo AEAT, ver retencionNomina.js) → neto.
 *
 * Reglas (Orden PJC/297/2026 y RDL 3/2026, ver datos2026.js):
 *  - Base de cotización mensual = bruto anual / 12 (incluye siempre la prorrata de las pagas
 *    extra, se cobren prorrateadas o no), limitada entre la base mínima del grupo y la máxima.
 *  - Cada concepto se redondea una sola vez por mes, como en una nómina; el año son 12 meses.
 *  - Solidaridad (art. 17): sobre el exceso de la retribución mensual sobre la base máxima,
 *    por tramos; se suma en unidades exactas y se redondea una vez.
 *  - Accidentes de trabajo y enfermedades profesionales: solo empresa y variable por actividad;
 *    solo se incluye si se indica `tasaAccidentes` (%).
 *  - Con 14 pagas sin prorrateo, la SS se descuenta en las 12 nóminas mensuales (paga ordinaria)
 *    y la paga extra solo lleva IRPF. El IRPF de cada paga es bruto de la paga × tipo.
 *
 * Función pura, euros en la entrada y la salida, céntimos enteros dentro. ESTIMACIÓN.
 */

const SS = datos.SEGURIDAD_SOCIAL

// Número de pagas al año que admite la calculadora. El Estatuto de los Trabajadores (art. 31) solo
// garantiza dos extraordinarias: 15, 16 o 18 dependen del convenio. Las extras de más de 14 pagas
// se tratan igual que las de 14 (mismo importe que una ordinaria, solo llevan IRPF).
const PAGAS_ADMITIDAS = [12, 14, 15, 16, 18]
const UNIDADES = 10000 // céntimos × centésimas de punto

const centesimas = (pct) => Math.round(pct * 100)
// base (céntimos) × porcentaje, redondeado al céntimo (0,5 hacia arriba)
const porcentaje = (baseCentimos, pct) => Math.floor((baseCentimos * centesimas(pct) + UNIDADES / 2) / UNIDADES)
const euros = (c) => c / 100

function baseMinimaMensual(grupo) {
  if (grupo >= 8) return aCentimos(SS.baseMinimaDiariaGrupos8a11 * 30)
  return aCentimos(SS.basesMinimasMensuales[grupo])
}

// Solidaridad (art. 17) sobre la retribución mensual, céntimos → { trabajador, empresa }
function solidaridad(retribucionMensual) {
  const baseMax = aCentimos(SS.baseMaximaMensual)
  let trabajador = 0
  let empresa = 0
  let desde = baseMax
  for (const t of SS.solidaridad) {
    const hasta = t.hasta === null ? Infinity : aCentimos(t.hasta)
    const ancho = Math.max(0, Math.min(retribucionMensual, hasta) - desde)
    trabajador += ancho * centesimas(t.trabajador)
    empresa += ancho * centesimas(t.empresa)
    desde = hasta
  }
  const redondear = (u) => Math.floor((u + UNIDADES / 2) / UNIDADES)
  return { trabajador: redondear(trabajador), empresa: redondear(empresa) }
}

function cotizacionMensual({ brutoAnualCentimos, grupo, contrato, tasaAccidentes }) {
  const retribucionMensual = Math.round(brutoAnualCentimos / 12)
  const baseMax = aCentimos(SS.baseMaximaMensual)
  const base = Math.min(baseMax, Math.max(baseMinimaMensual(grupo), retribucionMensual))
  const desempleo = contrato === 'temporal' ? SS.desempleoTemporal : SS.desempleoIndefinido

  const trab = {
    contingenciasComunes: porcentaje(base, SS.contingenciasComunes.trabajador),
    mei: porcentaje(base, SS.mei.trabajador),
    desempleo: porcentaje(base, desempleo.trabajador),
    formacionProfesional: porcentaje(base, SS.formacionProfesional.trabajador)
  }
  const emp = {
    contingenciasComunes: porcentaje(base, SS.contingenciasComunes.empresa),
    mei: porcentaje(base, SS.mei.empresa),
    desempleo: porcentaje(base, desempleo.empresa),
    fogasa: porcentaje(base, SS.fogasa.empresa),
    formacionProfesional: porcentaje(base, SS.formacionProfesional.empresa)
  }
  if (tasaAccidentes > 0) emp.accidentesTrabajo = porcentaje(base, tasaAccidentes)

  const sol = solidaridad(retribucionMensual)
  if (sol.trabajador > 0 || sol.empresa > 0) {
    trab.solidaridad = sol.trabajador
    emp.solidaridad = sol.empresa
  }
  const suma = (o) => Object.values(o).reduce((a, b) => a + b, 0)
  return { base, trabajador: trab, empresa: emp, totalTrabajador: suma(trab), totalEmpresa: suma(emp) }
}

function mapear(o, factor = 1) {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, euros(v * factor)]))
}

function calcularNomina(entrada = {}) {
  const brutoAnual = aCentimos(importe(entrada.brutoAnual, 'brutoAnual', { minimo: 0.01 }))
  const pagas = entrada.pagas ?? 14
  if (!PAGAS_ADMITIDAS.includes(pagas)) throw new ErrorEntrada(`pagas debe ser ${PAGAS_ADMITIDAS.join(', ')}`)
  const prorrateo = pagas > 12 ? !!entrada.prorrateo : true
  const grupo = entrada.grupoCotizacion ?? 1
  if (!Number.isInteger(grupo) || grupo < 1 || grupo > 11) throw new ErrorEntrada('grupoCotizacion debe ser un entero de 1 a 11')
  const contrato = entrada.contrato ?? 'indefinido'
  if (contrato !== 'indefinido' && contrato !== 'temporal') throw new ErrorEntrada('contrato debe ser indefinido o temporal')
  const tasaAccidentes = importe(entrada.tasaAccidentes ?? 0, 'tasaAccidentes')

  const ss = cotizacionMensual({ brutoAnualCentimos: brutoAnual, grupo, contrato, tasaAccidentes })
  const ssAnualTrabajador = ss.totalTrabajador * 12
  const ssAnualEmpresa = ss.totalEmpresa * 12

  const retencion = estimarRetencionNomina({
    retribucionAnual: euros(brutoAnual),
    cotizacionesSS: euros(ssAnualTrabajador),
    situacionFamiliar: entrada.situacionFamiliar,
    contribuyente: entrada.contribuyente,
    descendientes: entrada.descendientes,
    ascendientes: entrada.ascendientes,
    contrato: entrada.contratoRetencion,
    movilidadGeografica: entrada.movilidadGeografica,
    prestamoVivienda: entrada.prestamoVivienda
  })

  const tipoCentesimas = Math.round(retencion.tipo * 100)
  const irpfSobre = (brutoCentimos) => Math.floor((brutoCentimos * tipoCentesimas + 5000) / 10000)
  const irpfAnual = aCentimos(retencion.importeAnual)

  // Pagos: 12 mensuales (o 12 ordinarios + las pagas extra, todas del mismo importe, sin prorrateo)
  let pagos
  if (pagas === 12 || prorrateo) {
    const bruto = Math.round(brutoAnual / 12)
    const irpf = irpfSobre(bruto)
    pagos = { cantidad: 12, extras: 0, ordinaria: { bruto, ss: ss.totalTrabajador, irpf, neto: bruto - ss.totalTrabajador - irpf } }
  } else {
    const bruto = Math.round(brutoAnual / pagas)
    const irpf = irpfSobre(bruto)
    pagos = {
      cantidad: pagas,
      extras: pagas - 12,
      ordinaria: { bruto, ss: ss.totalTrabajador, irpf, neto: bruto - ss.totalTrabajador - irpf },
      extra: { bruto, ss: 0, irpf, neto: bruto - irpf }
    }
  }
  const salida = (p) => (p ? { bruto: euros(p.bruto), ss: euros(p.ss), irpf: euros(p.irpf), neto: euros(p.neto) } : undefined)

  const avisos = [...retencion.avisos]
  avisos.push('Estimación. Las cifras de la nómina real pueden variar según convenio, complementos y tarifa de accidentes.')
  if (tasaAccidentes === 0) avisos.push('No se ha incluido la cotización por accidentes de trabajo (depende de la actividad).')
  if (ss.trabajador.solidaridad) avisos.push('Incluye la cotización adicional de solidaridad sobre el exceso de la base máxima.')

  return {
    ejercicio: datos.EJERCICIO,
    fechaDatos: datos.FECHA_DATOS,
    brutoAnual: euros(brutoAnual),
    pagas,
    prorrateo,
    seguridadSocial: {
      baseCotizacionMensual: euros(ss.base),
      trabajadorMensual: mapear(ss.trabajador),
      trabajadorAnual: mapear(ss.trabajador, 12),
      totalTrabajadorAnual: euros(ssAnualTrabajador),
      empresaMensual: mapear(ss.empresa),
      totalEmpresaAnual: euros(ssAnualEmpresa)
    },
    irpf: {
      exento: retencion.exento,
      tipo: retencion.tipo,
      importeAnual: euros(irpfAnual),
      baseRetencion: retencion.baseRetencion,
      minimoPersonalFamiliar: retencion.minimoPersonalFamiliar
    },
    netoAnual: euros(brutoAnual - ssAnualTrabajador - irpfAnual),
    costeEmpresaAnual: euros(brutoAnual + ssAnualEmpresa),
    paga: { cantidad: pagos.cantidad, extras: pagos.extras, ordinaria: salida(pagos.ordinaria), extra: salida(pagos.extra) },
    avisos
  }
}

module.exports = { calcularNomina, cotizacionMensual, porcentaje, baseMinimaMensual, PAGAS_ADMITIDAS }
