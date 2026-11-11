/** Descendientes que espera la API a partir de «hijos a cargo» y «de ellos, menores de 3 años». */
export const descendientesDe = (hijos, hijosMenores3) => {
  const menores3 = Math.min(hijosMenores3, hijos)
  return [
    ...Array.from({ length: menores3 }, () => ({ edad: 1 })),
    ...Array.from({ length: hijos - menores3 }, () => ({ edad: 10 }))
  ]
}

/**
 * Cuerpo de POST /api/fiscal/nomina a partir del formulario de nómina (`f.edad` incluida).
 * Lo comparten la calculadora de nómina y la estimación de la pensión pública (que lee de ahí la base de cotización).
 */
export function construirEntradaNomina(f) {
  return {
    brutoAnual: f.brutoAnual,
    pagas: f.pagas,
    prorrateo: f.pagas === 14 && f.prorrateo,
    grupoCotizacion: f.grupo,
    contrato: f.contrato,
    // La situación 1 exige hijos: sin ellos se calcula como «otra»
    situacionFamiliar: f.hijos === 0 && f.situacion === 1 ? 3 : f.situacion,
    contribuyente: { edad: f.edad },
    descendientes: descendientesDe(f.hijos, f.hijosMenores3)
  }
}

const dos = (n) => String(n).padStart(2, '0')
const mesTexto = (indice) => `${Math.floor(indice / 12)}-${dos((indice % 12) + 1)}`

/**
 * Tramos de historial de cotización que espera POST /api/pension/jubilacion, a partir de lo que
 * escribe el usuario. `hoy` = { anio, mes } (mes 1-12). El historial acaba siempre el mes anterior.
 *  - modo 'media': `aniosCotizados` años hacia atrás con una base media.
 *  - modo 'anual': una fila { anio, base } por año; el año en curso llega hasta el mes anterior.
 */
export function construirTramos(p, hoy) {
  const ultimo = hoy.anio * 12 + hoy.mes - 2 // índice del mes anterior al actual
  if (p.modo === 'media') {
    const meses = Math.round(Number(p.aniosCotizados) * 12)
    const base = Number(p.baseMedia)
    if (!(meses > 0) || !(base > 0)) return []
    return [{ desde: mesTexto(ultimo - meses + 1), hasta: mesTexto(ultimo), baseMensual: base }]
  }
  return p.filas
    .filter((f) => Number.isInteger(Number(f.anio)) && Number(f.base) > 0 && Number(f.anio) <= hoy.anio)
    .map((f) => {
      const anio = Number(f.anio)
      return {
        desde: `${anio}-01`,
        hasta: anio === hoy.anio ? mesTexto(ultimo) : `${anio}-12`,
        baseMensual: Number(f.base)
      }
    })
    .filter((t) => t.hasta >= t.desde)
}
