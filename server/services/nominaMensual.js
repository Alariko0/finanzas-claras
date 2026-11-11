'use strict'

const datosSS = require('./fiscal/datos2026')
const { porcentaje, baseMinimaMensual, PAGAS_ADMITIDAS } = require('./fiscal/nomina')
const { aCentimos, aEuros, validarNumero } = require('./centimos')
const { ErrorEntrada } = require('./errores')

/*
 * Nómina mensual REAL: el recibo de salarios concepto a concepto, tal como lo da la empresa.
 * No se estima nada: se normalizan las cifras del recibo, se calculan sus totales (devengos,
 * deducciones, líquido) y se avisa si algo no cuadra con las reglas oficiales de 2026.
 *
 *  - normalizarRecibo(entrada) → { datos, totales, avisos }  (euros; dentro, céntimos enteros)
 *  - resumenNominas(filas, { anio, pagas }) → lo acumulado en el año, la proyección hasta
 *    diciembre y las bases de cotización mes a mes, para IRPF, Gastos y Plan de pensiones.
 *
 * Funciones puras. La vigente es siempre la última nómina ordinaria registrada: sus datos no
 * cambian hasta que se registra otra más reciente.
 */

const SS = datosSS.SEGURIDAD_SOCIAL
const MAX_IMPORTE = 10_000_000
const MAX_LINEAS = 30
const TOLERANCIA = 5 // céntimos de diferencia entre lo escrito y lo esperado antes de avisar
const TIPOS = ['ordinaria', 'extra']

/* ───────────────────────── lectura de campos ───────────────────────── */

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function importe(valor, nombre) {
  if (valor === undefined || valor === null || valor === '') return 0
  return aCentimos(validarNumero(valor, nombre, { min: 0, max: MAX_IMPORTE }))
}

function texto(valor, nombre, max) {
  if (valor === undefined || valor === null) return undefined
  if (typeof valor !== 'string') throw new ErrorEntrada(`${nombre} debe ser texto`)
  const limpio = valor.trim()
  if (limpio === '') return undefined
  if (limpio.length > max) throw new ErrorEntrada(`${nombre} admite como mucho ${max} caracteres`)
  return limpio
}

function fecha(valor, nombre) {
  const t = texto(valor, nombre, 10)
  if (t === undefined) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  if (!d || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
    throw new ErrorEntrada(`${nombre} debe ser una fecha AAAA-MM-DD válida`)
  }
  return t
}

function lineas(valor, nombre) {
  if (valor === undefined || valor === null) return []
  if (!Array.isArray(valor) || valor.length > MAX_LINEAS) {
    throw new ErrorEntrada(`${nombre} debe ser una lista de hasta ${MAX_LINEAS} conceptos`)
  }
  return valor.map((l, i) => {
    if (!esObjeto(l)) throw new ErrorEntrada(`${nombre}[${i}] no es válido`)
    const concepto = texto(l.concepto, `${nombre}[${i}].concepto`, 80)
    if (concepto === undefined) throw new ErrorEntrada(`${nombre}[${i}] necesita un concepto`)
    return { concepto, importe: importe(l.importe, `${nombre}[${i}].importe`) }
  })
}

const suma = (lista) => lista.reduce((a, l) => a + l.importe, 0)
const sinVacios = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))
const aLineasEuros = (lista) => lista.map((l) => ({ concepto: l.concepto, importe: aEuros(l.importe) }))

/* ───────────────────────── recibo → totales ───────────────────────── */

/**
 * @param {object} e recibo: { anio, mes, tipo?, fechaCobro?, encabezado?, devengos?, deducciones?,
 *   bases?, aportacionEmpresaPlan?, liquidoDeclarado? }  (euros)
 * @returns {{ anio, mes, tipo, fechaCobro, datos, totales, avisos }}
 */
function normalizarRecibo(e) {
  if (!esObjeto(e)) throw new ErrorEntrada('Faltan los datos de la nómina')
  const anio = e.anio
  const mes = e.mes
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new ErrorEntrada('anio debe ser un año entre 2000 y 2100')
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new ErrorEntrada('mes debe ser un entero de 1 a 12')
  const tipo = e.tipo ?? 'ordinaria'
  if (!TIPOS.includes(tipo)) throw new ErrorEntrada('tipo debe ser ordinaria o extra')

  const enc = e.encabezado ?? {}
  if (!esObjeto(enc)) throw new ErrorEntrada('encabezado no es válido')
  const grupoCotizacion = enc.grupoCotizacion
  if (grupoCotizacion !== undefined && (!Number.isInteger(grupoCotizacion) || grupoCotizacion < 1 || grupoCotizacion > 11)) {
    throw new ErrorEntrada('grupoCotizacion debe ser un entero de 1 a 11')
  }
  if (enc.contrato !== undefined && !['indefinido', 'temporal'].includes(enc.contrato)) {
    throw new ErrorEntrada('contrato debe ser indefinido o temporal')
  }
  if (enc.diasPeriodo !== undefined && (!Number.isInteger(enc.diasPeriodo) || enc.diasPeriodo < 1 || enc.diasPeriodo > 31)) {
    throw new ErrorEntrada('diasPeriodo debe ser un entero de 1 a 31')
  }
  const encabezado = sinVacios({
    empresa: texto(enc.empresa, 'empresa', 100),
    convenio: texto(enc.convenio, 'convenio', 150),
    grupoProfesional: texto(enc.grupoProfesional, 'grupoProfesional', 80),
    categoria: texto(enc.categoria, 'categoria', 80),
    fechaAntiguedad: fecha(enc.fechaAntiguedad, 'fechaAntiguedad'),
    grupoCotizacion,
    contrato: enc.contrato,
    diasPeriodo: enc.diasPeriodo,
    // Convenio elegido de la lista (services/convenios) y la categoría que se usó para las tablas
    convenioId: texto(enc.convenioId, 'convenioId', 60),
    convenioClase: texto(enc.convenioClase, 'convenioClase', 1),
    convenioNivel: texto(enc.convenioNivel, 'convenioNivel', 10)
  })

  const dev = e.devengos ?? {}
  const ded = e.deducciones ?? {}
  if (!esObjeto(dev) || !esObjeto(ded)) throw new ErrorEntrada('devengos y deducciones deben ser objetos')
  const ss = ded.ss ?? {}
  const irpfEntrada = ded.irpf ?? {}
  const basesEntrada = e.bases ?? {}
  if (!esObjeto(ss) || !esObjeto(irpfEntrada) || !esObjeto(basesEntrada)) {
    throw new ErrorEntrada('ss, irpf y bases deben ser objetos')
  }

  const salarioBase = importe(dev.salarioBase, 'salarioBase')
  const complementos = lineas(dev.complementos, 'complementos')
  const horasExtra = importe(dev.horasExtra, 'horasExtra')
  const pagaExtraProrrateada = importe(dev.pagaExtraProrrateada, 'pagaExtraProrrateada')
  const noSalariales = lineas(dev.noSalariales, 'noSalariales')

  const cotizaciones = {
    contingenciasComunes: importe(ss.contingenciasComunes, 'contingenciasComunes'),
    desempleo: importe(ss.desempleo, 'desempleo'),
    formacionProfesional: importe(ss.formacionProfesional, 'formacionProfesional'),
    mei: importe(ss.mei, 'mei'),
    horasExtra: importe(ss.horasExtra, 'ss.horasExtra'),
    solidaridad: importe(ss.solidaridad, 'solidaridad')
  }
  const tipoIrpf = irpfEntrada.tipo === undefined || irpfEntrada.tipo === null
    ? 0
    : validarNumero(irpfEntrada.tipo, 'irpf.tipo', { min: 0, max: 100 })
  const irpf = { base: importe(irpfEntrada.base, 'irpf.base'), tipo: tipoIrpf, importe: importe(irpfEntrada.importe, 'irpf.importe') }
  const aportacionPlanEmpleo = importe(ded.aportacionPlanEmpleo, 'aportacionPlanEmpleo')
  const otras = lineas(ded.otras, 'otras')
  const bases = {
    contingenciasComunes: importe(basesEntrada.contingenciasComunes, 'bases.contingenciasComunes'),
    contingenciasProfesionales: importe(basesEntrada.contingenciasProfesionales, 'bases.contingenciasProfesionales'),
    horasExtra: importe(basesEntrada.horasExtra, 'bases.horasExtra')
  }
  const aportacionEmpresaPlan = importe(e.aportacionEmpresaPlan, 'aportacionEmpresaPlan')
  const declarado = e.liquidoDeclarado === undefined || e.liquidoDeclarado === null || e.liquidoDeclarado === ''
    ? undefined
    : importe(e.liquidoDeclarado, 'liquidoDeclarado')

  const devengosSalariales = salarioBase + suma(complementos) + horasExtra + pagaExtraProrrateada
  const devengosNoSalariales = suma(noSalariales)
  const bruto = devengosSalariales + devengosNoSalariales
  if (bruto <= 0) throw new ErrorEntrada('La nómina necesita algún devengo mayor que 0')

  const cotizacionesTrabajador = Object.values(cotizaciones).reduce((a, b) => a + b, 0)
  const otrasDeducciones = suma(otras)
  const deducciones = cotizacionesTrabajador + irpf.importe + aportacionPlanEmpleo + otrasDeducciones
  const liquido = bruto - deducciones
  if (liquido < 0) throw new ErrorEntrada('Las deducciones superan los devengos: el líquido no puede ser negativo')

  const avisos = comprobar({
    anio, tipo, contrato: enc.contrato, grupo: grupoCotizacion, bases, cotizaciones, irpf, liquido, declarado,
    devengosSalariales
  })

  const datos = {
    anio, mes, tipo,
    encabezado,
    devengos: {
      salarioBase: aEuros(salarioBase),
      complementos: aLineasEuros(complementos),
      horasExtra: aEuros(horasExtra),
      pagaExtraProrrateada: aEuros(pagaExtraProrrateada),
      noSalariales: aLineasEuros(noSalariales)
    },
    deducciones: {
      ss: Object.fromEntries(Object.entries(cotizaciones).map(([k, v]) => [k, aEuros(v)])),
      irpf: { base: aEuros(irpf.base), tipo: irpf.tipo, importe: aEuros(irpf.importe) },
      aportacionPlanEmpleo: aEuros(aportacionPlanEmpleo),
      otras: aLineasEuros(otras)
    },
    bases: Object.fromEntries(Object.entries(bases).map(([k, v]) => [k, aEuros(v)])),
    aportacionEmpresaPlan: aEuros(aportacionEmpresaPlan)
  }
  if (declarado !== undefined) datos.liquidoDeclarado = aEuros(declarado)

  const totales = {
    devengosSalariales: aEuros(devengosSalariales),
    devengosNoSalariales: aEuros(devengosNoSalariales),
    bruto: aEuros(bruto),
    cotizacionesTrabajador: aEuros(cotizacionesTrabajador),
    irpf: aEuros(irpf.importe),
    tipoIrpf: irpf.tipo,
    // Lo que tributa: la base de retención del recibo; si no se escribe, los devengos salariales
    baseIrpf: aEuros(irpf.base > 0 ? irpf.base : devengosSalariales),
    aportacionPlan: aEuros(aportacionPlanEmpleo),
    aportacionEmpresaPlan: aEuros(aportacionEmpresaPlan),
    otrasDeducciones: aEuros(otrasDeducciones),
    deducciones: aEuros(deducciones),
    liquido: aEuros(liquido),
    baseCotizacion: aEuros(bases.contingenciasComunes),
    ...(declarado !== undefined && { liquidoDeclarado: aEuros(declarado), diferenciaLiquido: aEuros(liquido - declarado) })
  }

  return { anio, mes, tipo, fechaCobro: fecha(e.fechaCobro, 'fechaCobro'), datos, totales, avisos }
}

const dinero = (c) => `${aEuros(c).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

/** Avisos (no errores): lo escrito no cuadra con el líquido declarado o con las reglas de 2026. */
function comprobar({ anio, tipo, contrato, grupo, bases, cotizaciones, irpf, liquido, declarado, devengosSalariales }) {
  const avisos = []

  if (declarado !== undefined && Math.abs(liquido - declarado) > TOLERANCIA) {
    avisos.push(`El líquido que sale de las cifras (${dinero(liquido)}) no coincide con el que escribiste (${dinero(declarado)}). Revisa los conceptos.`)
  }

  if (irpf.tipo > 0 && irpf.importe > 0) {
    const base = irpf.base > 0 ? irpf.base : devengosSalariales
    const esperado = Math.floor((base * Math.round(irpf.tipo * 100) + 5000) / 10000)
    if (Math.abs(esperado - irpf.importe) > TOLERANCIA) {
      avisos.push(`La retención de IRPF (${dinero(irpf.importe)}) no es el ${irpf.tipo.toLocaleString('es-ES')} % de la base (${dinero(esperado)}).`)
    }
  }

  const baseCC = bases.contingenciasComunes
  if (baseCC <= 0 || (tipo === 'extra' && baseCC === 0)) return avisos
  if (anio !== datosSS.EJERCICIO) {
    avisos.push(`Las cotizaciones solo se comprueban con los tipos de ${datosSS.EJERCICIO}; no se han contrastado con los de ${anio}.`)
    return avisos
  }

  if (grupo !== undefined) {
    const minima = baseMinimaMensual(grupo)
    if (baseCC < minima) avisos.push(`La base de contingencias comunes (${dinero(baseCC)}) es inferior a la base mínima del grupo ${grupo} (${dinero(minima)}).`)
  }
  const maxima = aCentimos(SS.baseMaximaMensual)
  if (baseCC > maxima) avisos.push(`La base de contingencias comunes (${dinero(baseCC)}) supera la base máxima de 2026 (${dinero(maxima)}).`)

  const desempleos = contrato === 'temporal' ? [SS.desempleoTemporal] : contrato === 'indefinido' ? [SS.desempleoIndefinido] : [SS.desempleoIndefinido, SS.desempleoTemporal]
  const esperados = [
    ['contingencias comunes', cotizaciones.contingenciasComunes, [SS.contingenciasComunes.trabajador]],
    ['MEI', cotizaciones.mei, [SS.mei.trabajador]],
    ['desempleo', cotizaciones.desempleo, desempleos.map((d) => d.trabajador)],
    ['formación profesional', cotizaciones.formacionProfesional, [SS.formacionProfesional.trabajador]]
  ]
  for (const [nombre, escrito, tipos] of esperados) {
    const posibles = tipos.map((t) => porcentaje(baseCC, t))
    if (!posibles.some((p) => Math.abs(p - escrito) <= TOLERANCIA)) {
      avisos.push(`El ${nombre} (${dinero(escrito)}) no coincide con el esperado sobre esa base (${posibles.map(dinero).join(' o ')}).`)
    }
  }
  return avisos
}

/* ───────────────────────── resumen del año ───────────────────────── */

const CAMPOS = ['bruto', 'baseIrpf', 'cotizacionesTrabajador', 'irpf', 'aportacionPlan', 'aportacionEmpresaPlan', 'liquido']
const mesTexto = (anio, mes) => `${anio}-${String(mes).padStart(2, '0')}`

const aCent = (totales) => Object.fromEntries(CAMPOS.map((c) => [c, aCentimos(totales[c] ?? 0)]))
const aEur = (cent) => Object.fromEntries(Object.entries(cent).map(([k, v]) => [k, aEuros(v)]))
const sumar = (a, b, veces = 1) => Object.fromEntries(CAMPOS.map((c) => [c, a[c] + b[c] * veces]))
const cero = () => Object.fromEntries(CAMPOS.map((c) => [c, 0]))

// Orden de más reciente a más antigua; a igual mes, la ordinaria primero
const masReciente = (a, b) => b.anio - a.anio || b.mes - a.mes || (a.tipo === b.tipo ? 0 : a.tipo === 'ordinaria' ? -1 : 1)

/**
 * @param {Array} filas nóminas guardadas: { anio, mes, tipo, datos, totales }
 * @param {{ anio: number, pagas?: number }} opciones  pagas: 12, 14, 15, 16 o 18
 */
function resumenNominas(filas, { anio, pagas = 14 } = {}) {
  if (!Array.isArray(filas)) throw new ErrorEntrada('filas debe ser una lista')
  if (!Number.isInteger(anio)) throw new ErrorEntrada('anio debe ser un entero')
  if (!PAGAS_ADMITIDAS.includes(pagas)) throw new ErrorEntrada(`pagas debe ser ${PAGAS_ADMITIDAS.join(', ')}`)

  const ordenadas = [...filas].sort(masReciente)
  const ultimaOrdinaria = ordenadas.find((f) => f.tipo === 'ordinaria') ?? null
  const bases = ordenadas
    .filter((f) => f.tipo === 'ordinaria' && f.totales.baseCotizacion > 0)
    .map((f) => ({ mes: mesTexto(f.anio, f.mes), base: f.totales.baseCotizacion }))
    .reverse()

  const delAnio = ordenadas.filter((f) => f.anio === anio)
  const ordinarias = delAnio.filter((f) => f.tipo === 'ordinaria')
  const extras = delAnio.filter((f) => f.tipo === 'extra')
  const avisos = []

  let acumulado = cero()
  for (const f of delAnio) acumulado = sumar(acumulado, aCent(f.totales))

  let proyeccion = null
  if (ordinarias.length > 0) {
    const ultima = ordinarias[0]
    const u = aCent(ultima.totales)
    const restantes = Math.max(0, 12 - ordinarias.length)
    let total = sumar(acumulado, u, restantes)

    const prorrateada = (ultima.datos.devengos.pagaExtraProrrateada ?? 0) > 0
    if (pagas > 12 && !prorrateada) {
      const pendientes = Math.max(0, pagas - 12 - extras.length)
      if (pendientes > 0) {
        let extra
        if (extras.length > 0) {
          extra = aCent(extras[0].totales)
        } else {
          // Sin ninguna paga extra registrada: salario base y complementos de la última ordinaria
          const d = ultima.datos.devengos
          const bruto = aCentimos(d.salarioBase) + d.complementos.reduce((a, l) => a + aCentimos(l.importe), 0)
          const irpf = Math.floor((bruto * Math.round((ultima.totales.tipoIrpf ?? 0) * 100) + 5000) / 10000)
          extra = { ...cero(), bruto, baseIrpf: bruto, irpf, liquido: bruto - irpf }
          avisos.push('No hay ninguna paga extra registrada: se estima con el salario base y los complementos de tu última nómina y la misma retención.')
        }
        total = sumar(total, extra, pendientes)
      }
    }
    proyeccion = { ...aEur(total), ingresoMensualMedio: aEuros(Math.round(total.liquido / 12)), mesesProyectados: restantes }
    avisos.push(`Proyección hasta diciembre: ${restantes} ${restantes === 1 ? 'mes' : 'meses'} más con los datos de tu última nómina (${mesTexto(ultima.anio, ultima.mes)}).`)
  } else if (delAnio.length === 0) {
    avisos.push(`No hay nóminas registradas en ${anio}.`)
  }

  const t = ultimaOrdinaria?.totales
  return {
    anio,
    pagas,
    nominasRegistradas: delAnio.length,
    mesesRegistrados: ordinarias.map((f) => f.mes).sort((a, b) => a - b),
    ultima: ultimaOrdinaria && {
      anio: ultimaOrdinaria.anio,
      mes: ultimaOrdinaria.mes,
      bruto: t.bruto,
      liquido: t.liquido,
      baseCotizacion: t.baseCotizacion,
      cotizacionesTrabajador: t.cotizacionesTrabajador,
      irpf: t.irpf,
      tipoIrpf: t.tipoIrpf,
      aportacionPlan: t.aportacionPlan,
      aportacionEmpresaPlan: t.aportacionEmpresaPlan,
      grupoCotizacion: ultimaOrdinaria.datos.encabezado.grupoCotizacion,
      contrato: ultimaOrdinaria.datos.encabezado.contrato
    },
    acumulado: aEur(acumulado),
    proyeccion,
    basesCotizacion: bases,
    avisos
  }
}

module.exports = { normalizarRecibo, resumenNominas, TIPOS }
