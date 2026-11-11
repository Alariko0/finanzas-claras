'use strict'

/*
 * Datos legales de préstamos hipotecarios. Cada dato lleva su fuente.
 * Leídos el 2026-11-11 en el texto consolidado de la Ley 5/2019 (BOE-A-2019-3814).
 */

const FECHA_DATOS = '2026-11-11'

// Ley 5/2019, art. 23.5, 23.6 y 23.7: topes de la compensación o comisión por reembolso anticipado,
// como % del capital reembolsado. Además nunca pueden exceder la pérdida financiera real del
// prestamista (art. 23.8), que depende del mercado y aquí no se calcula: son TOPES, no importes.
const TOPES_COMISION = {
  // Art. 23.7: tipo fijo o tramo fijo. 10 primeros años (o desde que aplica el tipo fijo) y resto.
  fijo: { hastaMeses: 120, pctHasta: 2, pctDespues: 1.5 },
  // Art. 23.5: tipo variable o tramo variable. Dos supuestos EXCLUYENTES, a elegir en el contrato:
  // a) 5 primeros años, 0,15 %; b) 3 primeros años, 0,25 %.
  variable: { opcionA: { hastaMeses: 60, pct: 0.15 }, opcionB: { hastaMeses: 36, pct: 0.25 } },
  // Art. 23.6: novación o subrogación de variable a fijo (o con primer periodo fijo ≥ 3 años):
  // 0,05 % en los 3 primeros años; pasados, ninguna.
  novacionAFijo: { hastaMeses: 36, pct: 0.05 }
}

// Ley 5/2019, art. 21.3 y 21.4: en tipo variable no se puede fijar un límite a la baja (suelo)
// y el interés remuneratorio no puede ser negativo.
const INTERES_MINIMO = 0

/*
 * ESTADO: la exención temporal de estas comisiones en préstamos variables (RDL 8/2023) venció el
 * 31-12-2024. POR CONTRASTAR: no se ha localizado en fuente oficial una prórroga para 2025 o 2026
 * (solo fuentes secundarias indican que no la hay). Si hubiera una medida temporal vigente, los
 * topes de aquí serían superiores a lo que realmente puede cobrarse.
 */

const FUENTES = {
  comisiones: 'Ley 5/2019, art. 23 (BOE-A-2019-3814, consolidada)',
  tae: 'Ley 5/2019, Anexo II, apartado II.e)',
  suelo: 'Ley 5/2019, art. 21.3 y 21.4'
}

module.exports = { FECHA_DATOS, TOPES_COMISION, INTERES_MINIMO, FUENTES }
