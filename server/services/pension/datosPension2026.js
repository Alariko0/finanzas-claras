'use strict'

/*
 * Pensión contributiva de jubilación (Régimen General) — datos con su fuente.
 * Texto leído en el BOE el 2026-11-12:
 *   LGSS = Real Decreto Legislativo 8/2015 (BOE-A-2015-11724), versión consolidada del 21-10-2026.
 *   RD 241/2026 (BOE-A-2026-6977) y Real Decreto-ley 3/2026 (BOE-A-2026-2548): cifras de 2026.
 * Los importes están en euros tal como los publica la fuente.
 * Para cambiar de ejercicio: copiar a datosPensionAAAA.js y revisar cada bloque contra su fuente.
 */

const EJERCICIO = 2026
const FECHA_DATOS = '2026-11-12'

// LGSS art. 205.1.b): 15 años cotizados, 2 de ellos en los 15 años anteriores al hecho causante.
const CARENCIA = {
  mesesMinimos: 180,
  mesesRecientesMinimos: 24,
  ventanaRecienteMeses: 180
}

// LGSS art. 205.1.a) y disposición transitoria 7.ª. Edad ordinaria según el año del hecho causante:
// 65 años si se acreditan `mesesParaSesentaYCinco` meses cotizados; si no, la edad `edadMeses`.
// (2027 en adelante: 67 años; 65 con 38 años y 6 meses.)
const EDAD_ORDINARIA = [
  { desdeAnio: 2027, mesesParaSesentaYCinco: 462, edadMeses: 67 * 12 },
  { desdeAnio: 2026, mesesParaSesentaYCinco: 459, edadMeses: 66 * 12 + 10 }, // 38 a 3 m / 66 a 10 m
  { desdeAnio: 2025, mesesParaSesentaYCinco: 459, edadMeses: 66 * 12 + 8 }
]

// LGSS art. 209.1 + disposición transitoria 40.ª. Base reguladora = suma de las `mejores` bases de
// mayor importe dentro de los `ventana` meses anteriores al mes previo al hecho causante, entre
// `divisor`. Desde 2037 se aplica el art. 209.1 entero: 324 de 348 meses, entre 378.
const BASE_REGULADORA = {
  plena: { ventana: 348, mejores: 324, divisor: 378 },
  transitoria: {
    2026: { ventana: 304, mejores: 302, divisor: 352.33 },
    2027: { ventana: 308, mejores: 304, divisor: 354.67 },
    2028: { ventana: 312, mejores: 306, divisor: 357 },
    2029: { ventana: 316, mejores: 308, divisor: 359.33 },
    2030: { ventana: 320, mejores: 310, divisor: 361.67 },
    2031: { ventana: 324, mejores: 312, divisor: 364 },
    2032: { ventana: 328, mejores: 314, divisor: 366.33 },
    2033: { ventana: 332, mejores: 316, divisor: 368.67 },
    2034: { ventana: 336, mejores: 318, divisor: 371 },
    2035: { ventana: 340, mejores: 320, divisor: 373.33 },
    2036: { ventana: 344, mejores: 322, divisor: 375.67 }
  },
  // Art. 209.1.c): los 24 meses más recientes de la ventana van a valor nominal; el resto se actualiza con el IPC
  mesesNominales: 24,
  // Art. 209.1.b): meses sin obligación de cotizar dentro de la ventana
  lagunas: { mesesBaseMinima: 48, fraccionResto: 0.5 }
}

// LGSS art. 210.1 + disposición transitoria 9.ª. 50 % por los primeros 180 meses (15 años); después,
// por cada mes adicional, `tramos` en orden (cada uno con su nº de meses y su %). Tope 100 %.
const PORCENTAJES = {
  mesesBase: 180,
  porcentajeBase: 50,
  porAnio: [
    { desdeAnio: 2027, tramos: [{ meses: 248, porcentaje: 0.19 }, { meses: 16, porcentaje: 0.18 }] },
    { desdeAnio: 2023, tramos: [{ meses: 49, porcentaje: 0.21 }, { meses: 209, porcentaje: 0.19 }] }
  ],
  tope: 100
}

// LGSS art. 210.2.a): jubilación demorada. +4 % por cada año completo desde la edad ordinaria; desde el
// segundo año completo, cada periodo de más de 6 meses y menos de un año suma un 2 %.
const DEMORA = { porAnioCompleto: 4, porSemestreDesdeSegundoAnio: 2 }

// RD 241/2026 art. 3 (límite) y art. 58 LGSS (revalorización con la media del IPC). 14 pagas.
const LIMITES = {
  maximaMensual: 3359.6,
  maximaAnual: 47034.4,
  pagas: 14,
  revalorizacion2026: 2.7
}

// RD 241/2026, anexo I: cuantías mínimas de las pensiones de jubilación en 2026 (euros al año).
// Se complementan solo si las otras rentas no pasan de `limiteRentas` (art. 9) — no se calcula aquí.
const MINIMAS = {
  titular65: { conyugeACargo: 17592.4, sinConyuge: 13106.8, conyugeNoACargo: 12441.8 },
  titularMenor65: { conyugeACargo: 17592.4, sinConyuge: 12262.6, conyugeNoACargo: 11590.6 },
  limiteRentas: { sinConyugeACargo: 9442, conyugeACargo: 11013 }
}

module.exports = {
  EJERCICIO,
  FECHA_DATOS,
  CARENCIA,
  EDAD_ORDINARIA,
  BASE_REGULADORA,
  PORCENTAJES,
  DEMORA,
  LIMITES,
  MINIMAS
}
