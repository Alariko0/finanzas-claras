'use strict'

const datos = require('./datos2026')
const { aCentimos, prepararEscala, cuotaEnUnidades, UNIDADES_POR_CENTIMO } = require('./escalas')
const { calcularMinimos } = require('./minimos')
const { ErrorEntrada, importe, reduccionArticulo20, otrosGastos } = require('./liquidacionIRPF')

/*
 * Tipo de retención del IRPF sobre rendimientos del trabajo — ejercicio 2026.
 * Sigue el «Algoritmo de cálculo del tipo de retención» de la AEAT (versión a partir del
 * 10-09-2026), págs. 22-33. El algoritmo no depende de la comunidad autónoma.
 *
 * Aritmética: cuotas en «unidades» exactas (céntimos × 10⁻⁴), sin redondeos intermedios, como
 * exige el algoritmo. Solo se trunca el tipo (2 decimales) y se redondea el importe final.
 *
 * NO cubre (se avisa en `avisos`): regularización, rendimientos irregulares (IRREGULAR1/2),
 * anualidades por alimentos, Ceuta/Melilla/La Palma, ni el cálculo mensual por paga.
 * ESTIMACIÓN: hay que mostrarla con `fechaDatos`.
 */

const ESCALA = prepararEscala(datos.ESCALA_RETENCION)
const R = datos.RETENCION
const LIMITES = datos.LIMITES_EXCLUYENTES_RETENCION

const SITUACIONES = { 1: 'situacion1', 2: 'situacion2', 3: 'situacion3' }
const SITUACIONES_LABORALES = ['activo', 'pensionista', 'desempleado']
const CONTRATOS = ['general', 'especial', 'inferiorAnio']

function columnaHijos(n) {
  return n >= 2 ? 2 : n
}

// Retribución (céntimos) a partir de la cual se retiene en la situación dada, o null si no es válida.
function limiteExcluyente(situacion, numDescendientes) {
  return LIMITES[SITUACIONES[situacion]][columnaHijos(numDescendientes)]
}

function estimarRetencionNomina(entrada = {}) {
  const situacion = entrada.situacionFamiliar ?? 3
  if (!SITUACIONES[situacion]) throw new ErrorEntrada('situacionFamiliar debe ser 1, 2 o 3')
  const situacionLaboral = entrada.situacionLaboral ?? 'activo'
  if (!SITUACIONES_LABORALES.includes(situacionLaboral)) throw new ErrorEntrada('situacionLaboral no válida')
  const contrato = entrada.contrato ?? 'general'
  if (!CONTRATOS.includes(contrato)) throw new ErrorEntrada('contrato no válido')

  const retrib = aCentimos(importe(entrada.retribucionAnual, 'retribucionAnual', { minimo: 0.01 }))
  const cotizaciones = aCentimos(importe(entrada.cotizacionesSS ?? 0, 'cotizacionesSS'))
  if (cotizaciones > retrib) throw new ErrorEntrada('cotizacionesSS no puede superar retribucionAnual')

  const activo = situacionLaboral === 'activo'
  const contribuyente = { ...(entrada.contribuyente || {}) }
  const descendientes = entrada.descendientes || []
  const ascendientes = entrada.ascendientes || []
  const numDes = descendientes.length
  if (situacion === 1 && numDes === 0) {
    throw new ErrorEntrada('la situación familiar 1 exige al menos un descendiente')
  }
  // Los incrementos de gastos por discapacidad solo se dan a trabajadores activos (pág. 22).
  const paraGastos = activo ? contribuyente : { ...contribuyente, discapacidad: undefined }

  const pension = situacionLaboral === 'pensionista' ? aCentimos(R.reduccionPensionista) : 0
  const desempleo = situacionLaboral === 'desempleado' ? aCentimos(R.reduccionDesempleado) : 0
  const avisos = [
    'Estimación del tipo de retención con el algoritmo de la AEAT de 2026. La retención real la fija tu pagador.'
  ]

  // 1. Exentos de retención (Tabla 1)
  const limiteSituacion = limiteExcluyente(situacion, numDes)
  const exento = limiteSituacion !== null && retrib <= aCentimos(limiteSituacion) + pension + desempleo
  const base = {
    soportado: true,
    ejercicio: datos.EJERCICIO,
    fechaDatos: datos.FECHA_DATOS,
    retribucionAnual: retrib / 100,
    avisos
  }
  if (exento) {
    return { ...base, exento: true, tipo: 0, importeAnual: 0, cuota: 0 }
  }

  // 2. Base de retención
  const rnt = retrib - cotizaciones
  const gastos = otrosGastos({
    movilidadGeografica: activo && !!entrada.movilidadGeografica,
    contribuyente: paraGastos,
    rntCentimos: rnt
  })
  const red20 = reduccionArticulo20(rnt, 0)
  const rntReducido = Math.max(0, rnt - gastos - red20)
  const reducciones = pension + desempleo + (numDes > 2 ? aCentimos(R.reduccionMasDeDosDescendientes) : 0)
  const baseRetencion = Math.max(0, rntReducido - reducciones)

  // 3. Cuota = escala(base) − escala(mínimo personal y familiar), en unidades exactas
  const minimo = calcularMinimos('estatal', { contribuyente, descendientes, ascendientes }).total
  const cuotaUnidades = Math.max(0, cuotaEnUnidades(baseRetencion, ESCALA) - cuotaEnUnidades(minimo, ESCALA))

  // 4. Límite del 43 % del exceso sobre el límite excluyente (art. 85.3 RIRPF)
  let cuotaFinal = cuotaUnidades
  let limitada = false
  if (retrib <= aCentimos(datos.ESCALA_RETENCION[3].desde) && limiteSituacion !== null) {
    const exceso = retrib - (aCentimos(limiteSituacion) + pension + desempleo)
    const limite = exceso * R.limiteRetencionPorcentaje * 100 // céntimos × 43 % en unidades
    if (cuotaFinal > limite) {
      cuotaFinal = limite
      limitada = true
    }
  }

  // 5. Reducción por préstamo de vivienda habitual (RD 1975/2008), solo retribución < 33.007,20 €
  let minoPago = 0
  if (entrada.prestamoVivienda && retrib < aCentimos(33007.2)) {
    minoPago = Math.floor((retrib * 2) / 100) // 2 % truncado al céntimo
  }
  const diferencia = Math.max(0, cuotaFinal - minoPago * UNIDADES_POR_CENTIMO)

  // 6. Tipo truncado a 2 decimales (centésimas de punto) y mínimos por contrato
  let tipoCentesimas = Math.floor(diferencia / retrib)
  if (contrato === 'especial') tipoCentesimas = Math.max(tipoCentesimas, 1500)
  else if (contrato === 'inferiorAnio') tipoCentesimas = Math.max(tipoCentesimas, 200)

  // 7. Importe anual = retribución × tipo, redondeado al céntimo
  const importeAnual = Math.floor((retrib * tipoCentesimas + 5000) / 10000)

  if (limitada) avisos.push('Tipo limitado por el tope del 43 % del exceso sobre el límite excluyente.')
  avisos.push('No incluye regularización, rendimientos irregulares ni anualidades por alimentos.')

  const euros = (c) => c / 100
  return {
    ...base,
    exento: false,
    rendimientoNetoPrevio: euros(rnt),
    otrosGastos: euros(gastos),
    reduccionTrabajo: euros(red20),
    baseRetencion: euros(baseRetencion),
    minimoPersonalFamiliar: euros(minimo),
    cuota: Math.round(cuotaFinal / UNIDADES_POR_CENTIMO) / 100,
    tipo: tipoCentesimas / 100,
    importeAnual: euros(importeAnual)
  }
}

module.exports = { estimarRetencionNomina }
