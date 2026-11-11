/**
 * calcularIRPF.js - Cálculo de IRPF 2025 (España)
 *
 * Fórmula correcta:
 * 1. SS = salarioBruto × 6.35% (sobre bruto, con tope de cotización)
 * 2. Reducción rendimientos trabajo (escalonada según renta)
 * 3. Base liquidable = salarioBruto - SS - reducción_rendimientos
 * 4. Cuota íntegra = aplicar tramos estatales + autonómicos sobre base liquidable
 * 5. Cuota sobre mínimo personal = aplicar tramos sobre mínimo personal
 * 6. Cuota líquida = cuota_íntegra - cuota_mínimo_personal
 * 7. Salario neto = salarioBruto - SS.total - cuotaLiquida
 * 8. Neto mensual 12 pagas = salarioNeto / 12
 * 9. Neto mensual 14 pagas = salarioNeto / 14
 */

// ─── Tramos IRPF estatal 2025 ───
const TRAMOS_ESTATALES_2025 = [
  { min: 0, max: 12450, porc: 9.5 },
  { min: 12450, max: 20200, porc: 12 },
  { min: 20200, max: 35200, porc: 15 },
  { min: 35200, max: 60000, porc: 18.5 },
  { min: 60000, max: 300000, porc: 22.5 },
  { min: 300000, max: Infinity, porc: 24.5 }
]

// ─── Tramos autonómicos 2025 (formato array de tramos) ───
const TRAMOS_AUTONOMICOS_2025 = {
  'Andalucía': [
    { min: 0, max: 12609, porc: 11.5 },
    { min: 12609, max: 18594, porc: 13 },
    { min: 18594, max: 34124, porc: 17.5 },
    { min: 34124, max: 199528, porc: 19.5 },
    { min: 199528, max: Infinity, porc: 23 }
  ],
  'Comunidad de Madrid': [
    { min: 0, max: 11955, porc: 19 },
    { min: 11955, max: 18922, porc: 27 },
    { min: 18922, max: 30093, porc: 31 },
    { min: 30093, max: 35000, porc: 33 },
    { min: 35000, max: 48490, porc: 35 },
    { min: 48490, max: 79681, porc: 42 },
    { min: 79681, max: 136500, porc: 44 },
    { min: 136500, max: Infinity, porc: 47 }
  ],
  'Cataluña': [
    { min: 0, max: 12450, porc: 11 },
    { min: 12450, max: 20200, porc: 15.5 },
    { min: 20200, max: 27700, porc: 17 },
    { min: 27700, max: 48620, porc: 21 },
    { min: 48620, max: 65200, porc: 26 },
    { min: 65200, max: 140820, porc: 31 },
    { min: 140820, max: Infinity, porc: 33 }
  ],
  'País Vasco': [
    { min: 0, max: 11955, porc: 19 },
    { min: 11955, max: 18922, porc: 27 },
    { min: 18922, max: 30093, porc: 31 },
    { min: 30093, max: 35000, porc: 33 },
    { min: 35000, max: 48490, porc: 35 },
    { min: 48490, max: 79681, porc: 42 },
    { min: 79681, max: 136500, porc: 44 },
    { min: 136500, max: Infinity, porc: 47 }
  ],
  'Valencia': [
    { min: 0, max: 12450, porc: 11.5 },
    { min: 12450, max: 19955, porc: 16.5 },
    { min: 19955, max: 34000, porc: 21 },
    { min: 34000, max: 42400, porc: 26 },
    { min: 42400, max: 68655, porc: 29 },
    { min: 68655, max: 134220, porc: 33 },
    { min: 134220, max: Infinity, porc: 36 }
  ],
  'Asturias': [
    { min: 0, max: 11955, porc: 19 },
    { min: 11955, max: 18922, porc: 27 },
    { min: 18922, max: 30093, porc: 31 },
    { min: 30093, max: 35000, porc: 33 },
    { min: 35000, max: 48490, porc: 35 },
    { min: 48490, max: 79681, porc: 42 },
    { min: 79681, max: 136500, porc: 44 },
    { min: 136500, max: Infinity, porc: 47 }
  ],
  'Galicia': [
    { min: 0, max: 11955, porc: 19 },
    { min: 11955, max: 18922, porc: 27 },
    { min: 18922, max: 30093, porc: 31 },
    { min: 30093, max: 35000, porc: 33 },
    { min: 35000, max: 48490, porc: 35 },
    { min: 48490, max: 79681, porc: 42 },
    { min: 79681, max: 136500, porc: 44 },
    { min: 136500, max: Infinity, porc: 47 }
  ],
  'Otras (media nacional)': [
    { min: 0, max: 12450, porc: 11.5 },
    { min: 12450, max: 19955, porc: 16.5 },
    { min: 19955, max: 34000, porc: 21 },
    { min: 34000, max: 42400, porc: 26 },
    { min: 42400, max: 68655, porc: 29 },
    { min: 68655, max: 134220, porc: 33 },
    { min: 134220, max: Infinity, porc: 36 }
  ]
}

// ─── Seguridad Social 2025 ───
const SS_2025 = {
  contingencias: 4.70,
  desempleo: 1.55,
  formacion: 0.10,
  total: 6.35
}

// ─── Topes de cotización 2025 (mensual) ───
const TOPE_COTIZACION_MENSUAL = 4731.30

// ─── Mínimos personales 2025 ───
const MINIMO_PERSONAL = 5550
const MINIMO_HIJO = 2400

// ─── Reducción por rendimientos del trabajo 2025 ───
// Escalonada según la renta íntegra del trabajo
function calcularReduccionRendimientosTrabajo(rentaTrabajo) {
  if (rentaTrabajo <= 13250) {
    return 3700
  }
  if (rentaTrabajo <= 17700) {
    return 3700 - 1.75 * (rentaTrabajo - 13250)
  }
  if (rentaTrabajo <= 25035) {
    return 2922.50
  }
  return 0
}

// ─── Aplicar tramos progresivos ───
function aplicarTramos(base, tramos) {
  let cuota = 0
  for (const tramo of tramos) {
    if (base > tramo.min) {
      const baseEnTramo = Math.min(base, tramo.max) - tramo.min
      cuota += baseEnTramo * (tramo.porc / 100)
    }
  }
  return cuota
}

// ─── Generar detalle de tramos para UI ───
function detalleTramos(base, tramos) {
  return tramos
    .map((tramo) => {
      if (base > tramo.min) {
        const baseEnTramo = Math.min(base, tramo.max) - tramo.min
        const impuesto = baseEnTramo * (tramo.porc / 100)
        return {
          rango: `${tramo.min.toLocaleString('es-ES')} - ${tramo.max === Infinity ? '∞' : tramo.max.toLocaleString('es-ES')}`,
          base: Math.round(baseEnTramo),
          porc: tramo.porc,
          impuesto: Math.max(0, Math.round(impuesto))
        }
      }
      return null
    })
    .filter(Boolean)
}

// ─── Función principal ───
export const calcularIRPF = ({ salarioBruto, comunidad = 'Otras', hijos = 0, conyugeDependiente = false }) => {
  if (salarioBruto < 0) {
    throw new Error('El salario no puede ser negativo')
  }

  // 1. Seguridad Social (sobre bruto anual, con tope mensual × 12)
  const topeAnual = TOPE_COTIZACION_MENSUAL * 12
  const baseSS = Math.min(salarioBruto, topeAnual)
  const ssTotal = baseSS * (SS_2025.total / 100)
  const ssDetalle = {
    contingencias: baseSS * (SS_2025.contingencias / 100),
    desempleo: baseSS * (SS_2025.desempleo / 100),
    formacion: baseSS * (SS_2025.formacion / 100),
    total: ssTotal
  }

  // 2. Reducción por rendimientos del trabajo
  const reduccionTrabajo = calcularReduccionRendimientosTrabajo(salarioBruto)

  // 3. Base liquidable
  const baseLiquidable = Math.max(0, salarioBruto - ssTotal - reduccionTrabajo)

  // 4. Cuota íntegra = tramos estatales + autonómicos sobre base liquidable
  const cuotaEstatal = aplicarTramos(baseLiquidable, TRAMOS_ESTATALES_2025)

  const tramosAuto = TRAMOS_AUTONOMICOS_2025[comunidad] || TRAMOS_AUTONOMICOS_2025['Otras (media nacional)']
  const cuotaAutonomica = aplicarTramos(baseLiquidable, tramosAuto)

  const cuotaIntegra = cuotaEstatal + cuotaAutonomica

  // 5. Mínimo personal y por hijos
  const minimoPersonal = MINIMO_PERSONAL + (hijos * MINIMO_HIJO)
  const minimoConyuge = conyugeDependiente ? 1500 : 0
  const minimoTotal = minimoPersonal + minimoConyuge

  // 6. Cuota sobre mínimo personal
  const cuotaMinimoEstatal = aplicarTramos(minimoTotal, TRAMOS_ESTATALES_2025)
  const cuotaMinimoAutonomica = aplicarTramos(minimoTotal, tramosAuto)
  const cuotaMinimoPersonal = cuotaMinimoEstatal + cuotaMinimoAutonomica

  // 7. Cuota líquida (lo que realmente se paga)
  const cuotaLiquida = Math.max(0, cuotaIntegra - cuotaMinimoPersonal)

  // 8. Salario neto anual
  const salarioNetoAnual = salarioBruto - ssTotal - cuotaLiquida

  // 9. Neto mensual
  const netoMensual12 = salarioNetoAnual / 12
  const netoMensual14 = salarioNetoAnual / 14

  // Porcentaje de retención efectivo
  const retencionPct = salarioBruto > 0 ? Math.round((cuotaLiquida / salarioBruto) * 10000) / 100 : 0

  // Detalle de tramos calculados (para UI)
  const tramosCalculados = detalleTramos(baseLiquidable, TRAMOS_ESTATALES_2025)

  return {
    salarioBruto,
    baseLiquidable: Math.round(baseLiquidable),
    seguridadSocial: ssDetalle,
    reduccionTrabajo: Math.round(reduccionTrabajo * 100) / 100,
    reducciones: Math.round(reduccionTrabajo * 100) / 100,
    cuotaEstatal: Math.round(cuotaEstatal),
    cuotaAutonomica: Math.round(cuotaAutonomica),
    cuotaIntegra: Math.round(cuotaIntegra),
    minimoPersonal: minimoTotal,
    cuotaMinimoPersonal: Math.round(cuotaMinimoPersonal),
    cuotaLiquida: Math.round(cuotaLiquida),
    salarioNetoAnual: Math.round(salarioNetoAnual * 100) / 100,
    netoMensual: Math.round(netoMensual14 * 100) / 100,
    netoMensual12: Math.round(netoMensual12 * 100) / 100,
    netoMensual14: Math.round(netoMensual14 * 100) / 100,
    netoCatorce: Math.round(netoMensual14 * 100) / 100,
    retencionPct: retencionPct,
    ssPct: SS_2025.total,
    tramosCalculados,
    comunidad
  }
}

export default calcularIRPF

// Exportar tramos autonómicos para uso en componentes UI
export { TRAMOS_AUTONOMICOS_2025 }

/**
 * Calcular cuota de Seguridad Social del trabajador (mensual)
 * Total: 6.35% sobre el salario bruto mensual
 */
export const calcularCuotaSeguridadSocial = (salarioMensual) => {
  const base = Math.min(salarioMensual, TOPE_COTIZACION_MENSUAL)
  return Math.round(base * (SS_2025.total / 100) * 100) / 100
}

/**
 * Calcular cuota de Seguridad Social a cargo de la empresa (mensual)
 * Total aproximado: 31.65% sobre el salario bruto mensual
 */
export const calcularCuotaEmpresa = (salarioMensual) => {
  const base = Math.min(salarioMensual, TOPE_COTIZACION_MENSUAL)
  const porcentajeEmpresa = 31.65
  return Math.round(base * (porcentajeEmpresa / 100) * 100) / 100
}
