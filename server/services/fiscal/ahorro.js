'use strict'

const datos = require('./datos2026')
const { aCentimos, prepararEscala, cuotaEnUnidades, unidadesACentimos } = require('./escalas')
const { calcularMinimos } = require('./minimos')
const { ErrorEntrada, importe, COMUNIDADES_SOPORTADAS, COMUNIDADES_NO_SOPORTADAS } = require('./liquidacionIRPF')

/*
 * Cuota íntegra de la base liquidable del ahorro (LIRPF arts. 66 y 76) — ejercicio 2026.
 * Escala por parte (estatal y autonómica iguales; total 19/21/23/27/30 %).
 *
 * El mínimo personal y familiar se aplica primero a la base liquidable general
 * (liquidacionIRPF). La parte del mínimo que la base general no absorbe reduce la base del ahorro
 * (arts. 63.1.2.ª y 66.1.2.ª): cuota = escala(BLA) − escala(mínimo no absorbido), en cada ámbito.
 *
 * La base del ahorro (intereses, dividendos, ganancias patrimoniales de ahorro, ya compensadas)
 * la aporta quien llama. Función pura, euros en la entrada y la salida. ESTIMACIÓN.
 */

const ESCALA = prepararEscala(datos.ESCALA_AHORRO_POR_PARTE)

function cuotaParte(baseAhorro, minimo, baseGeneral) {
  const remanente = Math.max(0, minimo - baseGeneral)
  const unidades = cuotaEnUnidades(baseAhorro, ESCALA) - cuotaEnUnidades(Math.min(baseAhorro, remanente), ESCALA)
  return unidadesACentimos(Math.max(0, unidades))
}

function liquidacionAhorro(entrada = {}) {
  const comunidad = entrada.comunidad
  if (COMUNIDADES_NO_SOPORTADAS.includes(comunidad)) {
    return {
      soportado: false,
      aviso: datos.REGIMENES_NO_SOPORTADOS[comunidad],
      ejercicio: datos.EJERCICIO,
      fechaDatos: datos.FECHA_DATOS
    }
  }
  if (!COMUNIDADES_SOPORTADAS.includes(comunidad)) throw new ErrorEntrada('comunidad no reconocida')

  const bla = aCentimos(importe(entrada.baseLiquidableAhorro, 'baseLiquidableAhorro'))
  const blg = aCentimos(importe(entrada.baseLiquidableGeneral ?? 0, 'baseLiquidableGeneral'))
  const personas = {
    contribuyente: entrada.contribuyente || {},
    descendientes: entrada.descendientes || [],
    ascendientes: entrada.ascendientes || []
  }
  const minEstatal = calcularMinimos('estatal', personas).total
  const minAutonomico = calcularMinimos(comunidad, personas).total

  const cuotaEstatal = cuotaParte(bla, minEstatal, blg)
  const cuotaAutonomica = cuotaParte(bla, minAutonomico, blg)
  const cuotaIntegra = cuotaEstatal + cuotaAutonomica

  const euros = (c) => c / 100
  return {
    soportado: true,
    ejercicio: datos.EJERCICIO,
    fechaDatos: datos.FECHA_DATOS,
    comunidad,
    baseLiquidableAhorro: euros(bla),
    cuotaEstatal: euros(cuotaEstatal),
    cuotaAutonomica: euros(cuotaAutonomica),
    cuotaIntegra: euros(cuotaIntegra),
    tipoMedio: bla > 0 ? Math.round((cuotaIntegra / bla) * 10000) / 100 : 0,
    avisos: ['Estimación con la normativa de 2026. No incluye deducciones ni retenciones practicadas.']
  }
}

module.exports = { liquidacionAhorro }
