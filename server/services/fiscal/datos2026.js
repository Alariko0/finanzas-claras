'use strict'

/*
 * Datos fiscales y de Seguridad Social — ejercicio 2026.
 *
 * REGLAS DE ESTE FICHERO
 * - Cada dato lleva su fuente (BOE / AEAT / Hacienda) en el comentario.
 * - Nada de memoria: si una cifra no se pudo contrastar, está marcada "POR CONTRASTAR".
 * - Importes en euros tal como los publica la fuente. Los servicios los convierten a
 *   céntimos enteros antes de sumar (sin redondeos intermedios).
 * - Las escalas se guardan como tramos { desde, tipo } (tipo en %). La cuota acumulada
 *   de cada tramo se calcula en código. `cuotaPublicada` es la cifra oficial del tramo y
 *   solo sirve para que un test compruebe que no hay erratas de transcripción.
 * - Datos recogidos el 2026-11-11.
 */

const EJERCICIO = 2026
const FECHA_DATOS = '2026-11-11'

/* ───────────────────────── 1. IRPF estatal ───────────────────────── */

// Ley 35/2006 (LIRPF), art. 63.1 — escala general estatal.
// BOE consolidado BOE-A-2006-20764. Vigente desde 2021 (Ley 11/2020, art. 58).
const ESCALA_ESTATAL_GENERAL = [
  { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
  { desde: 12450, tipo: 12, cuotaPublicada: 1182.75 },
  { desde: 20200, tipo: 15, cuotaPublicada: 2112.75 },
  { desde: 35200, tipo: 18.5, cuotaPublicada: 4362.75 },
  { desde: 60000, tipo: 22.5, cuotaPublicada: 8950.75 },
  { desde: 300000, tipo: 24.5, cuotaPublicada: 62950.75 }
]

// LIRPF art. 66.1 (tramo estatal) y art. 76 (tramo autonómico): misma escala en ambos.
// Texto vigente tras la Ley 7/2024, de 20 de diciembre, disp. final 7.2 (efectos 1-1-2025):
// el último tramo sube a 15 % por parte, es decir 30 % en total.
// Tipo total = estatal + autonómico = 19 / 21 / 23 / 27 / 30.
const ESCALA_AHORRO_POR_PARTE = [
  { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
  { desde: 6000, tipo: 10.5, cuotaPublicada: 570 },
  { desde: 50000, tipo: 11.5, cuotaPublicada: 5190 },
  { desde: 200000, tipo: 13.5, cuotaPublicada: 22440 },
  { desde: 300000, tipo: 15, cuotaPublicada: 35940 }
]

// LIRPF art. 20 (redacción RDL 4/2024, de 26 de junio, efectos 1-1-2024).
// Confirmado por el algoritmo de retenciones AEAT 2026 (versión 10-09-2026), pág. 22.
const REDUCCION_TRABAJO = {
  hastaRendimiento: 14852, // reducción máxima
  maxima: 7302,
  tramo2Hasta: 17673.52, // 7.302 − 1,75 × (RNT − 14.852)
  coeficienteTramo2: 1.75,
  baseTramo3: 2364.34, // 2.364,34 − 1,14 × (RNT − 17.673,52)
  coeficienteTramo3: 1.14,
  tramo3Hasta: 19747.5, // por encima: 0
  // Requisito del art. 20: otras rentas (no del trabajo) no superiores a 6.500 €.
  limiteOtrasRentas: 6500
}

// LIRPF art. 19.2 — gastos deducibles del trabajo.
const GASTOS_TRABAJO = {
  otrosGastos: 2000, // art. 19.2.f)
  incrementoMovilidadGeografica: 2000, // art. 19.2.f), 2.º párrafo
  incrementoDiscapacidad33: 3500, // art. 19.2.f), 3.er párrafo
  incrementoDiscapacidad65OMovilidad: 7750, // idem
  defensaJuridicaMax: 300 // art. 19.2.e)
}

// LIRPF art. 57 a 60 — mínimos personal y familiar ESTATALES.
// (art. 57: 5.550 / +1.150 / +1.400; art. 58: 2.400/2.700/4.000/4.500 y +2.800 menor de 3;
//  ascendientes y discapacidad confirmados con el algoritmo AEAT 2026, pág. 24-28.)
const MINIMOS_ESTATALES = {
  contribuyente: 5550,
  contribuyenteMayor65: 1150, // se suma si edad > 65
  contribuyenteMayor75: 1400, // se suma además si edad > 75
  descendientes: [2400, 2700, 4000, 4500], // 1.º, 2.º, 3.º, 4.º y siguientes
  descendienteMenor3: 2800, // se suma
  ascendiente: 1150, // > 65 años o discapacidad, a repartir por convivencia
  ascendienteMayor75: 1400,
  discapacidad33: 3000, // grado ≥ 33 % y < 65 %
  discapacidad65: 9000, // grado ≥ 65 %
  asistencia: 3000 // ayuda de terceros / movilidad reducida / grado ≥ 65 %
}

/* ───────────────────── 2. IRPF autonómico (escalas) ─────────────────────
 * Fuente general: AEAT, Manual práctico de Renta 2025, «8.4.3.2 Cuota íntegra autonómica»
 * (página actualizada 16-03-2026) y Hacienda, «Tributación autonómica. Medidas 2026»
 * (actualizado 23-09-2026), Cap. I, apdo. 1.1:
 *   «Las únicas CC.AA. que han introducido modificaciones en la escala de 2026 respecto
 *    de la regulada para 2025 son Extremadura y la Comunitat Valenciana.»
 * Por tanto, para las demás comunidades la escala 2026 = escala 2025 de la AEAT.
 * Régimen común, 15 comunidades. Forales (País Vasco, Navarra) y Ceuta/Melilla: ver REGIMENES_NO_SOPORTADOS.
 */
const ESCALAS_AUTONOMICAS = {
  andalucia: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
      { desde: 13000, tipo: 12, cuotaPublicada: 1235 },
      { desde: 21100, tipo: 15, cuotaPublicada: 2207 },
      { desde: 35200, tipo: 18.5, cuotaPublicada: 4322 },
      { desde: 60000, tipo: 22.5, cuotaPublicada: 8910 }
    ]
  },
  aragon: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
      { desde: 13072.5, tipo: 12, cuotaPublicada: 1241.89 },
      { desde: 21210, tipo: 15, cuotaPublicada: 2218.39 },
      { desde: 36960, tipo: 18.5, cuotaPublicada: 4580.89 },
      { desde: 52500, tipo: 20.5, cuotaPublicada: 7455.79 },
      { desde: 60000, tipo: 23, cuotaPublicada: 8993.29 },
      { desde: 80000, tipo: 24, cuotaPublicada: 13593.29 },
      { desde: 90000, tipo: 25, cuotaPublicada: 15993.29 },
      { desde: 130000, tipo: 25.5, cuotaPublicada: 25993.29 }
    ]
  },
  asturias: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9, cuotaPublicada: 0 },
      { desde: 12450, tipo: 12, cuotaPublicada: 1120.5 },
      { desde: 17707.2, tipo: 14, cuotaPublicada: 1751.36 },
      { desde: 33007.2, tipo: 19.2, cuotaPublicada: 3893.36 },
      { desde: 53407.2, tipo: 21.5, cuotaPublicada: 7810.16 },
      { desde: 70000, tipo: 22.5, cuotaPublicada: 11377.62 },
      { desde: 90000, tipo: 25, cuotaPublicada: 15877.62 },
      { desde: 175000, tipo: 26, cuotaPublicada: 37127.62 }
    ]
  },
  baleares: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9, cuotaPublicada: 0 },
      { desde: 10000, tipo: 11.25, cuotaPublicada: 900 },
      { desde: 18000, tipo: 14.25, cuotaPublicada: 1800 },
      { desde: 30000, tipo: 17.5, cuotaPublicada: 3510 },
      { desde: 48000, tipo: 19, cuotaPublicada: 6660 },
      { desde: 70000, tipo: 21.75, cuotaPublicada: 10840 },
      { desde: 90000, tipo: 22.75, cuotaPublicada: 15190 },
      { desde: 120000, tipo: 23.75, cuotaPublicada: 22015 },
      { desde: 175000, tipo: 24.75, cuotaPublicada: 35077.5 }
    ]
  },
  canarias: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9, cuotaPublicada: 0 },
      { desde: 13748, tipo: 11.5, cuotaPublicada: 1237.32 },
      { desde: 19422, tipo: 14, cuotaPublicada: 1889.83 },
      { desde: 35924, tipo: 18.5, cuotaPublicada: 4200.11 },
      { desde: 57566, tipo: 23.5, cuotaPublicada: 8203.88 },
      { desde: 93268, tipo: 25, cuotaPublicada: 16593.85 },
      { desde: 123745, tipo: 26, cuotaPublicada: 24213.1 }
    ]
  },
  cantabria: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 8.5, cuotaPublicada: 0 },
      { desde: 13000, tipo: 11, cuotaPublicada: 1105 },
      { desde: 21000, tipo: 14.5, cuotaPublicada: 1985 },
      { desde: 35200, tipo: 18, cuotaPublicada: 4044 },
      // La tabla AEAT dice 8.505 en este tramo: errata. 4.044 + 24.800 × 18 % = 8.508, y el tramo
      // siguiente (15.258) solo cuadra con 8.508.
      { desde: 60000, tipo: 22.5, cuotaPublicada: 8508 },
      { desde: 90000, tipo: 24.5, cuotaPublicada: 15258 }
    ]
  },
  castillaLaMancha: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
      { desde: 12450, tipo: 12, cuotaPublicada: 1182.75 },
      { desde: 20200, tipo: 15, cuotaPublicada: 2112.75 },
      { desde: 35200, tipo: 18.5, cuotaPublicada: 4362.75 },
      { desde: 60000, tipo: 22.5, cuotaPublicada: 8950.75 }
    ]
  },
  castillaYLeon: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9, cuotaPublicada: 0 },
      { desde: 12450, tipo: 12, cuotaPublicada: 1120.5 },
      { desde: 20200, tipo: 14, cuotaPublicada: 2050.5 },
      { desde: 35200, tipo: 18.5, cuotaPublicada: 4150.5 },
      { desde: 53407.2, tipo: 21.5, cuotaPublicada: 7518.83 }
    ]
  },
  cataluna: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
      { desde: 12500, tipo: 12.5, cuotaPublicada: 1187.5 },
      { desde: 22000, tipo: 16, cuotaPublicada: 2375 },
      { desde: 33000, tipo: 19, cuotaPublicada: 4135 },
      { desde: 53000, tipo: 21.5, cuotaPublicada: 7935 },
      { desde: 90000, tipo: 23.5, cuotaPublicada: 15890 },
      { desde: 120000, tipo: 24.5, cuotaPublicada: 22940 },
      { desde: 175000, tipo: 25.5, cuotaPublicada: 36415 }
    ]
  },
  extremadura: {
    // CAMBIO 2026. Ley 2/2026, de 3 de agosto, de Presupuestos Generales de la Comunidad Autónoma
    // de Extremadura, disposición final segunda, punto uno: nueva escala para hechos imponibles
    // devengados desde 1-1-2026. Tabla publicada por la Junta de Extremadura, Portal Tributario
    // (IRPF > Tipo aplicable). Coincide con Hacienda, Medidas 2026 (tramos 1 y 2: 8 % → 7,75 %,
    // 10 % → 9,75 %). Las cuotas publicadas coinciden con las recalculadas.
    fuente: 'Ley 2/2026 Extremadura, DF 2.ª.1; Portal Tributario Junta de Extremadura; Hacienda Medidas 2026',
    tramos: [
      { desde: 0, tipo: 7.75, cuotaPublicada: 0 },
      { desde: 12450, tipo: 9.75, cuotaPublicada: 964.88 },
      { desde: 20200, tipo: 16, cuotaPublicada: 1720.5 },
      { desde: 24200, tipo: 17.5, cuotaPublicada: 2360.5 },
      { desde: 35200, tipo: 21, cuotaPublicada: 4285.5 },
      { desde: 60000, tipo: 23.5, cuotaPublicada: 9493.5 },
      { desde: 80200, tipo: 24, cuotaPublicada: 14240.5 },
      { desde: 99200, tipo: 24.5, cuotaPublicada: 18800.5 },
      { desde: 120200, tipo: 25 }
    ]
  },
  galicia: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9, cuotaPublicada: 0 },
      { desde: 12985.35, tipo: 11.65, cuotaPublicada: 1168.68 },
      { desde: 21068.6, tipo: 14.9, cuotaPublicada: 2110.38 },
      { desde: 35200, tipo: 18.4, cuotaPublicada: 4215.96 },
      { desde: 60000, tipo: 22.5, cuotaPublicada: 8779.16 }
    ]
  },
  laRioja: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 8, cuotaPublicada: 0 },
      { desde: 12450, tipo: 10.6, cuotaPublicada: 996 },
      { desde: 20200, tipo: 13.6, cuotaPublicada: 1817.5 },
      { desde: 35200, tipo: 17.8, cuotaPublicada: 3857.5 },
      { desde: 40000, tipo: 18.3, cuotaPublicada: 4711.9 },
      { desde: 50000, tipo: 19, cuotaPublicada: 6541.9 },
      { desde: 60000, tipo: 24.5, cuotaPublicada: 8441.9 },
      { desde: 120000, tipo: 27, cuotaPublicada: 23141.9 }
    ]
  },
  madrid: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 8.5, cuotaPublicada: 0 },
      { desde: 13362.22, tipo: 10.7, cuotaPublicada: 1135.79 },
      { desde: 19004.63, tipo: 12.8, cuotaPublicada: 1739.53 },
      { desde: 35425.68, tipo: 17.4, cuotaPublicada: 3841.42 },
      { desde: 57320.4, tipo: 20.5, cuotaPublicada: 7651.1 }
    ]
  },
  murcia: {
    fuente: 'AEAT Manual Renta 2025 §8.4.3.2; Hacienda Medidas 2026 (sin cambios vs 2025)',
    tramos: [
      { desde: 0, tipo: 9.5, cuotaPublicada: 0 },
      { desde: 12450, tipo: 11.2, cuotaPublicada: 1182.75 },
      { desde: 20200, tipo: 13.3, cuotaPublicada: 2050.75 },
      { desde: 34000, tipo: 17.9, cuotaPublicada: 3886.15 },
      { desde: 60000, tipo: 22.5, cuotaPublicada: 8540.15 }
    ]
  },
  valencia: {
    // CAMBIO 2026. Ley 5/2026, de 31 de julio (DOGV núm. 10425, 10-08-2026), art. 18, que da
    // nueva redacción al art. 2 de la Ley 13/1997, con efectos desde 1-1-2026. Verificado
    // contra el PDF oficial del DOGV (CVE DOGV-C-2026-26204), pág. 23.
    // (Escala 2027 distinta: 8,7 % a 29,25 %; no se usa aquí.)
    fuente: 'Ley 5/2026 Generalitat Valenciana, art. 18 (DOGV 10425, 10-08-2026)',
    tramos: [
      { desde: 0, tipo: 8.8, cuotaPublicada: 0 },
      { desde: 12000, tipo: 11.7, cuotaPublicada: 1056 },
      { desde: 22000, tipo: 14.6, cuotaPublicada: 2226 },
      { desde: 32000, tipo: 17, cuotaPublicada: 3686 },
      { desde: 42000, tipo: 19.4, cuotaPublicada: 5386 },
      { desde: 52000, tipo: 21.9, cuotaPublicada: 7326 },
      { desde: 62000, tipo: 24.4, cuotaPublicada: 9516 },
      { desde: 72000, tipo: 26.1, cuotaPublicada: 11956 },
      { desde: 100000, tipo: 27.35, cuotaPublicada: 19264 },
      { desde: 150000, tipo: 28.35, cuotaPublicada: 32939 },
      { desde: 200000, tipo: 29.35, cuotaPublicada: 47114 }
    ]
  }
}

/* ─────────────── 3. Mínimos personal y familiar AUTONÓMICOS ───────────────
 * Solo se aplican al cálculo de la cuota autonómica (LIRPF art. 56.3 y 74).
 * Fuente: AEAT Manual Renta 2025, «Cuadro comparativo de los importes de los mínimos personales
 * y familiares, estatal y autonómicos» (página actualizada 17-03-2026).
 * Hacienda Medidas 2026, apdo. 1.2, lista las mismas comunidades que regulan mínimos propios
 * (Cataluña, Galicia, Andalucía, Asturias, La Rioja, Canarias, Baleares, Madrid, Valencia, Castilla y León)
 * y el límite legal: ±10 % sobre cada cuantía estatal.
 * ESTADO DE CONTRASTE (2026-11-11):
 *  - Fijados por el tope legal (estatal × 1,10), por tanto no pueden haber cambiado mientras el estatal
 *    siga igual (Hacienda 2026 los describe «hasta el límite máximo permitido»): Asturias, Valencia, La Rioja
 *    (solo discapacidad de descendientes) y las partidas de Baleares que Hacienda cita. Cerrado.
 *  - Importes propios por debajo del tope, sin cifra oficial 2026: Andalucía, Galicia, Canarias, Madrid.
 *    POR CONTRASTAR: importes del cuadro AEAT 2025; Hacienda 2026 no publica cifras ni indica cambios.
 *  - Cataluña, Castilla y León y el resto: iguales a los estatales.
 */
const MINIMOS_AUTONOMICOS = {
  andalucia: {
    contribuyente: 5790, contribuyenteMayor65: 1200, contribuyenteMayor75: 1460,
    descendientes: [2510, 2820, 4170, 4700], descendienteMenor3: 2920,
    ascendiente: 1200, ascendienteMayor75: 1460,
    discapacidad33: 3130, discapacidad65: 9390, asistencia: 3130
  },
  asturias: {
    contribuyente: 6105, contribuyenteMayor65: 1265, contribuyenteMayor75: 1540,
    descendientes: [2640, 2970, 4400, 4950], descendienteMenor3: 3080,
    ascendiente: 1265, ascendienteMayor75: 1540,
    discapacidad33: 3300, discapacidad65: 9900, asistencia: 3300
  },
  baleares: {
    // La tabla AEAT de Baleares es ambigua en el mínimo del contribuyente mayor de 65 años.
    // Hacienda 2026 (apdo. 1.2): Baleares sube «hasta el máximo permitido» el mínimo del contribuyente
    // mayor de 65 y de 75 años, 2.º y siguientes descendientes, ascendientes y discapacidad, y no
    // toca el general (5.550). Máximo = estatal × 1,10: +1.265 / +1.540. Cerrado por el tope legal.
    contribuyente: 5550, contribuyenteMayor65: 1265, contribuyenteMayor75: 1540,
    descendientes: [2400, 2970, 4400, 4950], descendienteMenor3: 2800,
    ascendiente: 1265, ascendienteMayor75: 1540,
    discapacidad33: 3300, discapacidad65: 9900, asistencia: 3300
  },
  canarias: {
    contribuyente: 5606, contribuyenteMayor65: 1162, contribuyenteMayor75: 1414,
    descendientes: [2424, 2727, 4040, 4545], descendienteMenor3: 2828,
    ascendiente: 1162, ascendienteMayor75: 1414,
    discapacidad33: 3030, discapacidad65: 9090, asistencia: 3030
  },
  galicia: {
    contribuyente: 5789, contribuyenteMayor65: 1199, contribuyenteMayor75: 1460,
    descendientes: [2503, 2816, 4172, 4694], descendienteMenor3: 2920,
    ascendiente: 1199, ascendienteMayor75: 1460,
    discapacidad33: 3129, discapacidad65: 9387, asistencia: 3129
  },
  madrid: {
    contribuyente: 5956.65, contribuyenteMayor65: 1234.26, contribuyenteMayor75: 1502.58,
    descendientes: [2575.85, 2897.83, 4400, 4950], descendienteMenor3: 3005.16,
    ascendiente: 1234.26, ascendienteMayor75: 1502.58,
    discapacidad33: 3219.81, discapacidad65: 9659.44, asistencia: 3219.81
  },
  laRioja: {
    // Igual que el estatal salvo discapacidad de DESCENDIENTES (3.300 / 9.900). La asistencia
    // sigue en 3.000 para contribuyente, descendientes y ascendientes.
    discapacidadDescendiente33: 3300, discapacidadDescendiente65: 9900
  },
  valencia: {
    contribuyente: 6105, contribuyenteMayor65: 1265, contribuyenteMayor75: 1540,
    descendientes: [2640, 2970, 4400, 4950], descendienteMenor3: 3080,
    ascendiente: 1265, ascendienteMayor75: 1540,
    discapacidad33: 3300, discapacidad65: 9900, asistencia: 3300
  }
  // aragon, cantabria, castillaLaMancha, castillaYLeon, cataluna, extremadura, murcia: = estatales
}

/* ─────────────────── 4. Regímenes no soportados (devuelven aviso) ───────────────────
 * Regla del proyecto: nunca se devuelve un número para estos regímenes.
 */
const REGIMENES_NO_SOPORTADOS = {
  paisVasco: 'Régimen foral del País Vasco: IRPF propio de cada Diputación Foral.',
  navarra: 'Régimen foral de Navarra: IRPF propio de la Hacienda Foral.',
  ceuta: 'Ceuta: la deducción del 60 % de la cuota (LIRPF art. 68.4) aún no está implementada.',
  melilla: 'Melilla: la deducción del 60 % de la cuota (LIRPF art. 68.4) aún no está implementada.'
}

/* ───────────── 5. Retenciones (solo estimación mensual de nómina) ─────────────
 * Fuente: AEAT, «Algoritmo de cálculo del tipo de retención a cuenta del IRPF para los
 * rendimientos del trabajo personal. Ejercicio 2026 (a partir del 10 de septiembre)»,
 * fechado 10-09-2026. Cita la página del PDF.
 */
// Tabla 2 — escala de retención (art. 85 RIRPF), pág. 30. Es la escala conjunta estatal + autonómica
// media; NO depende de la comunidad.
const ESCALA_RETENCION = [
  { desde: 0, tipo: 19, cuotaPublicada: 0 },
  { desde: 12450, tipo: 24, cuotaPublicada: 2365.5 },
  { desde: 20200, tipo: 30, cuotaPublicada: 4225.5 },
  { desde: 35200, tipo: 37, cuotaPublicada: 8725.5 },
  { desde: 60000, tipo: 45, cuotaPublicada: 17901.5 },
  { desde: 300000, tipo: 47, cuotaPublicada: 125901.5 }
]

// Tabla 1 — límites excluyentes de retención (art. 81 RIRPF, RD 142/2024), pág. 29.
// Situación 1 = soltero con hijos a cargo exclusivo; 2 = casado, cónyuge sin rentas > 1.500 €;
// 3 = resto. Columnas: 0 hijos, 1 hijo, 2 o más.
const LIMITES_EXCLUYENTES_RETENCION = {
  situacion1: { 0: null, 1: 17644, 2: 18694 },
  situacion2: { 0: 17197, 1: 18130, 2: 19262 },
  situacion3: { 0: 15876, 1: 16342, 2: 16867 }
}

const RETENCION = {
  reduccionPensionista: 600, // pág. 22
  reduccionMasDeDosDescendientes: 600, // pág. 22
  reduccionDesempleado: 1200, // pág. 22
  limiteRetencionPorcentaje: 43 // art. 85.3 RIRPF, pág. 31 (aplica si retribución ≤ 35.200)
}

/* ──────────────────────── 6. Seguridad Social 2026 ────────────────────────
 * Fuente: Orden PJC/297/2026, de 30 de marzo («BOE» núm. 79, 31-03-2026, BOE-A-2026-7296),
 * apoyada en el Real Decreto-ley 3/2026, de 3 de febrero, art. 3 (topes y MEI).
 */
const SEGURIDAD_SOCIAL = {
  // Art. 2.1 y art. 3. Base máxima Régimen General: 5.101,20 €/mes (170,04 €/día).
  baseMaximaMensual: 5101.2,
  baseMaximaDiaria: 170.04,
  // Art. 3. Bases mínimas mensuales por grupo de cotización (grupos 1-7); grupos 8-11 por día: 47,48 €.
  // Verificado sobre el PDF del BOE (extracción por filas): grupos 1-7 en €/mes, grupos 8-11 en €/día.
  basesMinimasMensuales: { 1: 1989.3, 2: 1649.7, 3: 1435.2, 4: 1424.4, 5: 1424.4, 6: 1424.4, 7: 1424.4 },
  baseMinimaDiariaGrupos8a11: 47.48, // = 1.424,40 / 30
  topeMinimoAccidentes: 1424.4, // art. 2.2

  // Art. 4.a) contingencias comunes 28,30 %: empresa 23,60 / trabajador 4,70.
  contingenciasComunes: { empresa: 23.6, trabajador: 4.7 },
  // Art. 16. MEI 0,90 %: empresa 0,75 / trabajador 0,15, sobre la base de contingencias comunes.
  mei: { empresa: 0.75, trabajador: 0.15 },
  // Art. 33.2.a). Desempleo.
  desempleoIndefinido: { empresa: 5.5, trabajador: 1.55 }, // total 7,05 %
  desempleoTemporal: { empresa: 6.7, trabajador: 1.6 }, // total 8,30 %
  // Art. 33.2.b) y c).
  fogasa: { empresa: 0.2, trabajador: 0 },
  formacionProfesional: { empresa: 0.6, trabajador: 0.1 }, // total 0,70 %
  // Art. 4.b): accidentes de trabajo y enfermedades profesionales = tarifa de primas, solo empresa;
  // varía por actividad (CNAE/ocupación). No se estima por defecto.
  accidentesTrabajo: 'variable_por_actividad_solo_empresa',

  // Art. 17. Cotización adicional de solidaridad, sobre la parte de retribución mensual que excede
  // la base máxima. Tramos y reparto empresa/trabajador.
  solidaridad: [
    { desde: 5101.21, hasta: 5611.32, tipo: 1.15, empresa: 0.96, trabajador: 0.19 },
    { desde: 5611.33, hasta: 7651.8, tipo: 1.25, empresa: 1.04, trabajador: 0.21 },
    { desde: 7651.81, hasta: null, tipo: 1.46, empresa: 1.22, trabajador: 0.24 }
  ]
}

module.exports = {
  EJERCICIO,
  FECHA_DATOS,
  ESCALA_ESTATAL_GENERAL,
  ESCALA_AHORRO_POR_PARTE,
  REDUCCION_TRABAJO,
  GASTOS_TRABAJO,
  MINIMOS_ESTATALES,
  ESCALAS_AUTONOMICAS,
  MINIMOS_AUTONOMICOS,
  REGIMENES_NO_SOPORTADOS,
  ESCALA_RETENCION,
  LIMITES_EXCLUYENTES_RETENCION,
  RETENCION,
  SEGURIDAD_SOCIAL
}
