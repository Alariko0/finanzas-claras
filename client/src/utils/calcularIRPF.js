/**
 * calcularIRPF.js - Cálculo de IRPF 2025
 * Tramos IRPF estatales exactos 2025
 */

// Tramos IRPF estatal 2025 EXACTOS
const TRAMOS_ESTATALES_2025 = [
  { min: 0, max: 12450, porc: 9.5, reduccion: 0 },
  { min: 12450, max: 20200, porc: 12, reduccion: 0 },
  { min: 20200, max: 35200, porc: 15, reduccion: 0 },
  { min: 35200, max: 60000, porc: 18.5, reduccion: 0 },
  { min: 60000, max: 300000, porc: 22.5, reduccion: 0 },
  { min: 300000, max: Infinity, porc: 24.5, reduccion: 0 }
]

// Tramos autonómicos 2025
const TRAMOS_AUTONOMICOS_2025 = {
  'Andalucía': {
    min: 0, max: 12609, porc: 47, reduccion: 1087.5,
    max1: 18594, porc1: 37, reduccion1: 0,
    max2: 34124, porc2: 31, reduccion2: 0,
    max3: 199528, porc3: 26, reduccion3: 0,
    max4: Infinity, porc4: 23, reduccion4: 0
  },
  'Comunidad de Madrid': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Cataluña': {
    min: 0, max: 12450, porc: 11, reduccion: 0,
    max1: 20200, porc1: 15.5, reduccion1: 0,
    max2: 27700, porc2: 17, reduccion2: 0,
    max3: 48620, porc3: 21, reduccion3: 0,
    max4: 65200, porc4: 26, reduccion4: 0,
    max5: 140820, porc5: 31, reduccion5: 0,
    max6: Infinity, porc6: 33, reduccion6: 0
  },
  'País Vasco': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Valencia': {
    min: 0, max: 12450, porc: 11.5, reduccion: 0,
    max1: 19955, porc1: 16.5, reduccion1: 0,
    max2: 34000, porc2: 21, reduccion2: 0,
    max3: 42400, porc3: 26, reduccion3: 0,
    max4: 68655, porc4: 29, reduccion4: 0,
    max5: 134220, porc5: 33, reduccion5: 0,
    max6: Infinity, porc6: 36, reduccion6: 0
  },
  'Asturias': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Galicia': {
    min: 0, max: 11955, porc: 19, reduccion: 0,
    max1: 18922, porc1: 27, reduccion1: 0,
    max2: 30093, porc2: 31, reduccion2: 0,
    max3: 35000, porc3: 33, reduccion3: 0,
    max4: 48490, porc4: 35, reduccion4: 0,
    max5: 79681, porc5: 42, reduccion5: 0,
    max6: 136500, porc6: 44, reduccion6: 0,
    max7: Infinity, porc7: 47, reduccion7: 0
  },
  'Otras (media nacional)': {
    min: 0, max: 12450, porc: 11.5, reduccion: 0,
    max1: 19955, porc1: 16.5, reduccion1: 0,
    max2: 34000, porc2: 21, reduccion2: 0,
    max3: 42400, porc3: 26, reduccion3: 0,
    max4: 68655, porc4: 29, reduccion4: 0,
    max5: 134220, porc5: 33, reduccion5: 0,
    max6: Infinity, porc6: 36, reduccion6: 0
  }
}

// Seguridad Social 2025
const SS_2025 = {
  contingencias: 4.70,  // Contingencias comunes
  desempleo: 1.55,     // Desempleo
  formacion: 0.10,     // Formación
  total: 6.35          // Total base cotizaciones
}

// Mínimos personales y por hijos 2025
const REDUCCIONES = {
  basePersonal: 5550,           // Mínimo personal
  primerHijo: 2400,             // Primer hijo
  segundoHijo: 2400,            // Segundo hijo
  reductionRendimientoTrabajo: 5565 // Reducción por rendimientos del trabajo
}

/**
 * Función principal de cálculo de IRPF
 * @param {Object} params - Parámetros de cálculo
 * @param {number} params.salarioBruto - Salario bruto anual
 * @param {string} params.comunidad - Comunidad autónoma
 * @param {number} params.hijos - Número de hijos
 * @param {boolean} params.conyugeDependiente - Si hay conyuge dependiente
 * @returns {Object} Resultado del cálculo
 */
export const calcularIRPF = ({ salarioBruto, comunidad = 'Otras', hijos = 0, conyugeDependiente = false }) => {
  if (salarioBruto < 0) {
    throw new Error('El salario no puede ser negativo')
  }

  const reduccionesTotales = REDUCCIONES.basePersonal + (hijos * REDUCCIONES.primerHijo)
  const reduccionExtra = conyugeDependiente ? REDUCCIONES.basePersonal : 0

  // Calcular base liquidable después de reducciones
  const baseLiquidable = Math.max(0, salarioBruto - reduccionesTotales - reduccionExtra)

  // Calcular tramos autonómicos (si existen)
  let impuestoAutonomico = 0
  let tramosAutonomicos = []

  const tramosAuto = TRAMOS_AUTONOMICOS_2025[comunidad]
  if (tramosAuto) {
    const calcularTramoAuto = (base, tramo, idx) => {
      const limite = tramo.max || Infinity
      if (base > tramo.min) {
        const baseTramo = Math.min(base, limite) - tramo.min
        const impuesto = baseTramo * (tramo.porc / 100) - tramo.reduccion
        return {
          rango: `${tramo.min.toLocaleString('es-ES')} - ${tramo.max ? tramo.max.toLocaleString('es-ES') : '∞'}`,
          base: Math.round(baseTramo),
          porc: tramo.porc,
          impuesto: Math.max(0, Math.round(impuesto))
        }
      }
    }

    const tramosArray = Object.keys(tramosAuto).map((minStr) => {
      const tramo = tramosAuto[minStr]
      const idx = parseInt(minStr)
      return calcularTramoAuto(baseLiquidable, tramo, idx)
    }).filter(Boolean)

    tramosAutonomicos = tramosArray
    impuestoAutonomico = tramosArray.reduce((sum, t) => sum + t.impuesto, 0)
  }

  // Calcular tramos estatales
  const tramosCalculados = TRAMOS_ESTATALES_2025.map((tramo) => {
    if (baseLiquidable > tramo.min) {
      const limite = tramo.max || Infinity
      const baseTramo = Math.min(baseLiquidable, limite) - tramo.min
      const impuesto = baseTramo * (tramo.porc / 100)
      return {
        rango: `${tramo.min.toLocaleString('es-ES')} - ${tramo.max ? tramo.max.toLocaleString('es-ES') : '∞'}`,
        base: Math.round(baseTramo),
        porc: tramo.porc,
        impuesto: Math.max(0, Math.round(impuesto))
      }
    }
    return null
  }).filter(Boolean)

  // Calcular impuesto estatal
  const impuestoEstatal = tramosCalculados.reduce((sum, t) => sum + t.impuesto, 0)

  // Cuota total de Seguridad Social
  const cuotasSS = {
    contingencias: baseLiquidable * (SS_2025.contingencias / 100),
    desempleo: baseLiquidable * (SS_2025.desempleo / 100),
    formacion: baseLiquidable * (SS_2025.formacion / 100),
    total: baseLiquidable * (SS_2025.total / 100)
  }

  // Impuesto total
  const impuestoTotal = Math.max(0, impuestoEstatal + impuestoAutonomico)

  // Cuota líquida
  const cuotaLiquida = Math.max(0, impuestoTotal - reduccionesTotales - reduccionExtra)

  // Neto mensual (14 pagas o 12)
  const netoMensual = cuotaLiquida / 14

  // Neto 14 pagas
  const netoCatorce = Math.round(cuotaLiquida - Math.min(cuotaLiquida, 10000)) // Aproximación

  // Porcentaje de retención (aproximado según tramo)
  const retencionPct = Math.round((impuestoTotal / salarioBruto) * 100)

  return {
    salarioBruto,
    baseLiquidable: Math.round(baseLiquidable),
    seguridadSocial: cuotasSS,
    reducciones: reduccionesTotales + reduccionExtra,
    impuestoEstatal: Math.round(impuestoEstatal),
    impuestoAutonomico: Math.round(impuestoAutonomico),
    impuestoTotal: Math.round(impuestoTotal),
    cuotaLiquida: Math.round(cuotaLiquida),
    netoMensual: Math.round(netoMensual * 100) / 100,
    netoCatorce: Math.round(cuotaLiquida - Math.min(cuotaLiquida, 10000)),
    retencionPct: retencionPct,
    ssPct: SS_2025.total,
    tramosCalculados,
    comunidad
  }
}

export default calcularIRPF
