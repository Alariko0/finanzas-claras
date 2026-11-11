/**
 * fuentes.js - Catálogo de fuentes consultadas para el proyecto.
 *
 * Fuente de verdad de la página «Fuentes» y del pie de letra pequeña de cada calculadora.
 * REGLA: cada vez que se consulte una norma o documento para informarse o para crear lógica,
 * se añade aquí (enlace o PDF + qué regula) y se asocia a las páginas que la usan en PAGINAS.
 *
 * Solo enlaces comprobados. Si una fuente se leyó pero no hay enlace verificado, va sin `url`
 * y con `nota` (la página muestra «enlace pendiente»).
 */

const boe = (id) => `https://www.boe.es/buscar/act.php?id=${id}`
const boePdf = (id) => `https://www.boe.es/buscar/pdf/${id.split('-')[2]}/${id}-consolidado.pdf`

const HACIENDA_AUTONOMICA_2026 =
  'https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-i-tributacion-autonomica-2026.pdf'

/** Temas en los que se agrupa la página «Fuentes» (orden de aparición). */
export const TEMAS = [
  { clave: 'irpf', titulo: 'IRPF' },
  { clave: 'nomina', titulo: 'Nómina, retenciones y Seguridad Social' },
  { clave: 'convenios', titulo: 'Convenios colectivos' },
  { clave: 'pension', titulo: 'Pensión pública de jubilación' },
  { clave: 'hipotecas', titulo: 'Hipotecas y préstamos' },
  { clave: 'datos', titulo: 'Datos estadísticos' }
]

export const FUENTES = {
  lirpf: {
    tema: 'irpf',
    titulo: 'Ley 35/2006, del Impuesto sobre la Renta de las Personas Físicas (LIRPF)',
    referencia: 'BOE-A-2006-20764, texto consolidado',
    url: boe('BOE-A-2006-20764'),
    pdf: boePdf('BOE-A-2006-20764'),
    regula:
      'La ley del IRPF. De aquí salen la escala estatal de la base general (art. 63), la escala del ahorro (arts. 66 y 76), ' +
      'los gastos deducibles del trabajo (art. 19), la reducción por rendimientos del trabajo (art. 20), los mínimos personales y ' +
      'familiares (arts. 56 a 61), las reducciones por aportaciones a planes de pensiones (arts. 51 y 52) y la tributación de ' +
      'las prestaciones de los planes (art. 17).'
  },
  rirpf: {
    tema: 'nomina',
    titulo: 'Real Decreto 439/2007, Reglamento del IRPF (RIRPF)',
    referencia: 'BOE-A-2007-6820, texto consolidado',
    url: boe('BOE-A-2007-6820'),
    pdf: boePdf('BOE-A-2007-6820'),
    regula:
      'Desarrolla la ley del IRPF. Regula las retenciones sobre el trabajo: cuándo no se retiene (art. 81), la escala de ' +
      'retención (art. 85) y su límite del 43 % del exceso sobre el límite excluyente (art. 85.3).'
  },
  rd142_2024: {
    tema: 'nomina',
    titulo: 'Real Decreto 142/2024, de modificación del Reglamento del IRPF en materia de retenciones',
    referencia: 'BOE-A-2024-2249',
    url: boe('BOE-A-2024-2249'),
    pdf: boePdf('BOE-A-2024-2249'),
    regula:
      'Reescribe el art. 81.1 del Reglamento: las cuantías de rendimientos del trabajo por debajo de las cuales no se practica ' +
      'retención, según la situación familiar y el número de hijos (ligadas al salario mínimo).'
  },
  rd1975_2008: {
    tema: 'nomina',
    titulo: 'Real Decreto 1975/2008, medidas urgentes en materia económica, fiscal, de empleo y de acceso a la vivienda',
    referencia: 'BOE-A-2008-19437',
    url: boe('BOE-A-2008-19437'),
    pdf: boePdf('BOE-A-2008-19437'),
    regula:
      'Introdujo en el Reglamento del IRPF la reducción de 2 puntos en la retención para quien paga un préstamo para la vivienda ' +
      'habitual y cobra menos de 33.007,20 euros al año.'
  },
  algoritmoAeat: {
    tema: 'nomina',
    titulo: 'AEAT, Algoritmo de cálculo del tipo de retención del IRPF (rendimientos del trabajo), ejercicio 2026',
    referencia: 'Versión aplicable a partir del 10 de septiembre de 2026',
    url: 'https://sede.agenciatributaria.gob.es/static_files/Sede/Programas_ayuda/Retenciones/2026/Algoritmo%20Retenciones-2026_10sept.pdf',
    regula:
      'El procedimiento oficial para calcular el tipo de retención que la empresa aplica en la nómina: exentos, base de ' +
      'retención, mínimo personal y familiar, escala, límite del 43 % y reducciones por préstamo de vivienda.'
  },
  ordenCotizacion2026: {
    tema: 'nomina',
    titulo: 'Orden PJC/297/2026, normas de cotización a la Seguridad Social para 2026',
    referencia: 'BOE-A-2026-7296 (BOE núm. 79, 31-03-2026)',
    url: boe('BOE-A-2026-7296'),
    regula:
      'Bases máxima y mínimas de cotización por grupo, tipos de cotización de trabajador y empresa (contingencias comunes, ' +
      'desempleo, formación profesional) y el Mecanismo de Equidad Intergeneracional.'
  },
  rdl3_2026: {
    tema: 'nomina',
    titulo: 'Real Decreto-ley 3/2026, revalorización de las pensiones públicas y otras medidas urgentes de Seguridad Social',
    referencia: 'BOE-A-2026-2548 (BOE núm. 31, 04-02-2026)',
    url: boe('BOE-A-2026-2548'),
    regula:
      'Fija en 2026 los topes de cotización, el MEI y la cuota de solidaridad que aplica la nómina, y las cifras de ' +
      'revalorización de las pensiones.'
  },
  hacienda2026: {
    tema: 'irpf',
    titulo: 'Ministerio de Hacienda, Tributación autonómica. Medidas 2026 (capítulo I, IRPF)',
    referencia: 'Actualizado a 23 de septiembre de 2026',
    url: HACIENDA_AUTONOMICA_2026,
    regula:
      'Resumen oficial de las medidas de cada comunidad en el IRPF para 2026. Indica qué comunidades han cambiado su escala ' +
      '(solo Extremadura y la Comunitat Valenciana) y cuáles regulan mínimos personales y familiares propios.'
  },
  manualRentaEscalas: {
    tema: 'irpf',
    titulo: 'AEAT, Manual práctico de Renta 2025, 8.4.3.2 Cuota íntegra autonómica',
    referencia: 'Escalas autonómicas por comunidad',
    url: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/8-cumplimentacion-irpf/8_4-cuota-integra/8_4_3-gravamen-base-liquidable-general/8_4_3_2-cuota-integra-autonomica.html',
    regula: 'Las escalas autonómicas de la base general de cada comunidad, con la cuota acumulada de cada tramo.'
  },
  manualRentaMinimos: {
    tema: 'irpf',
    titulo: 'AEAT, Manual práctico de Renta 2025: cuadro comparativo de los mínimos personales y familiares, estatal y autonómicos',
    referencia: 'Importes de 2025',
    url: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c14-adecuacion-impuesto-circunstancias-personales/minimo-autonomico-personal-familiar/cuadro-minimos-personales-familiares-estatal-autonomicos.html',
    regula:
      'Los mínimos del contribuyente, por descendientes, ascendientes y discapacidad que aplica cada comunidad. Para ' +
      'Andalucía, Galicia, Canarias y Madrid son los de 2025 y no se han podido contrastar con una fuente oficial de 2026.'
  },
  ley2_2026Extremadura: {
    tema: 'irpf',
    titulo: 'Ley 2/2026 de Presupuestos de la Comunidad Autónoma de Extremadura (disp. final 2.ª)',
    referencia: 'DOE de 4 de agosto de 2026',
    url: HACIENDA_AUTONOMICA_2026,
    nota: 'Enlace al resumen de Hacienda que la recoge; no se ha localizado un enlace verificado al texto de la ley en el DOE.',
    regula: 'Rebaja los dos primeros tramos de la escala autonómica del IRPF de Extremadura (del 8 al 7,75 % y del 10 al 9,75 %), con efectos desde el 1-1-2026.'
  },
  ley5_2026Valencia: {
    tema: 'irpf',
    titulo: 'Ley 5/2026, de medidas fiscales de la Generalitat Valenciana (art. 18), que modifica el art. 2 de la Ley 13/1997',
    referencia: 'DOGV núm. 10425, de 10 de agosto de 2026',
    url: HACIENDA_AUTONOMICA_2026,
    nota: 'Enlace al resumen de Hacienda que la recoge; el texto se leyó en el PDF del DOGV, sin enlace verificado aquí.',
    regula: 'Nueva escala autonómica del IRPF de la Comunitat Valenciana para 2026 (tipos del 8,8 % al 29,35 %), con efectos desde el 1-1-2026.'
  },
  ley11_2020: {
    tema: 'irpf',
    titulo: 'Ley 11/2020, de Presupuestos Generales del Estado para 2021',
    referencia: 'BOE-A-2020-17339',
    url: boe('BOE-A-2020-17339'),
    pdf: boePdf('BOE-A-2020-17339'),
    regula: 'Dio la redacción vigente de la escala estatal de la base general del IRPF (art. 63 LIRPF, tipo máximo del 24,5 %).'
  },
  ley31_2022: {
    tema: 'irpf',
    titulo: 'Ley 31/2022, de Presupuestos Generales del Estado para 2023',
    referencia: 'BOE-A-2022-22128',
    url: boe('BOE-A-2022-22128'),
    pdf: boePdf('BOE-A-2022-22128'),
    regula: 'Dio su redacción actual al art. 52 LIRPF: límite de las aportaciones a planes de pensiones que reducen la base imponible.'
  },
  rdl4_2024: {
    tema: 'irpf',
    titulo: 'Real Decreto-ley 4/2024, de 26 de junio, medidas urgentes en materia fiscal, energética y social',
    referencia: 'BOE-A-2024-12944',
    url: boe('BOE-A-2024-12944'),
    pdf: boePdf('BOE-A-2024-12944'),
    regula: 'Elevó a 7.302 euros la reducción por obtención de rendimientos del trabajo (art. 20 LIRPF), con efectos desde 2024.'
  },
  ley7_2024: {
    tema: 'irpf',
    titulo: 'Ley 7/2024, de 20 de diciembre (impuesto complementario y otras normas tributarias)',
    referencia: 'BOE-A-2024-26694',
    url: boe('BOE-A-2024-26694'),
    pdf: boePdf('BOE-A-2024-26694'),
    regula: 'Su disposición final séptima modificó la LIRPF: el último tramo de la escala del ahorro pasa al 30 % en total (15 % por parte), desde 2025.'
  },
  convenioHosteleriaMadrid: {
    tema: 'convenios',
    titulo: 'Convenio Colectivo del Sector de Hostelería y Actividades Turísticas de la Comunidad de Madrid',
    referencia: 'BOCM núm. 82, 6-4-2024 (BOCM-20240406-2), código 28002085011981. Vigencia 2023-2025; tablas hasta 2025',
    url: 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/04/06/BOCM-20240406-2.PDF',
    pdf: 'https://www.ccoo-servicios.es/archivos/BOCM-20240406-Conv-hosteleria.pdf',
    regula:
      'Salario base mensual por nivel y tipo de establecimiento (tablas de 2023, 2024 y 2025), 14 pagas con las extraordinarias el 20 de ' +
      'junio y el 20 de diciembre (art. 26), plus convenio (art. 29), manutención (art. 28), plus de formación (art. 31), complemento de ' +
      'permanencia (art. 30), nocturnidad (art. 27), jornada de 1.800 horas al año (art. 14) y revisión salarial del 6 %, 5 % y 4 % (art. 5). ' +
      'No incluye tablas de 2026 ni las del Anexo III (empresas con porcentaje de servicio).'
  },
  lgss: {
    tema: 'pension',
    titulo: 'Real Decreto Legislativo 8/2015, Ley General de la Seguridad Social (LGSS)',
    referencia: 'BOE-A-2015-11724, texto consolidado',
    url: boe('BOE-A-2015-11724'),
    pdf: boePdf('BOE-A-2015-11724'),
    regula:
      'Los requisitos de la pensión de jubilación (art. 205), la base reguladora (art. 209 y disp. transitoria 40.ª), el ' +
      'porcentaje según años cotizados (art. 210 y disp. transitoria 9.ª), la edad ordinaria (disp. transitoria 7.ª), ' +
      'la pensión máxima (art. 57) y la revalorización (art. 58).'
  },
  rd241_2026: {
    tema: 'pension',
    titulo: 'Real Decreto 241/2026, limitación de la pensión inicial y revalorización de las pensiones para 2026',
    referencia: 'BOE-A-2026-6977 (25-03-2026)',
    url: boe('BOE-A-2026-6977'),
    regula:
      'Pensión máxima de 2026 (3.359,60 euros al mes en 14 pagas), cuantías mínimas de jubilación (anexo I) y el límite de ' +
      'otras rentas para cobrar el complemento por mínimos (art. 9).'
  },
  ine: {
    tema: 'datos',
    titulo: 'INE, serie IPC251852: IPC nacional, índice general, base 2021',
    referencia: 'Datos mensuales desde enero de 2002 hasta diciembre de 2025',
    url: 'https://www.ine.es/consul/serie.do?s=IPC251852',
    regula: 'Sirve para actualizar con la inflación las bases de cotización antiguas al calcular la base reguladora de la pensión.'
  },
  ley5_2019: {
    tema: 'hipotecas',
    titulo: 'Ley 5/2019, reguladora de los contratos de crédito inmobiliario',
    referencia: 'BOE-A-2019-3814, texto consolidado',
    url: boe('BOE-A-2019-3814'),
    pdf: boePdf('BOE-A-2019-3814'),
    regula:
      'Topes de la comisión por amortización anticipada (art. 23: fijo 2 % a 10 años y 1,5 %, variable 0,25 % a 3 años o 0,15 % a 5, ' +
      'novación a fijo 0,05 %), prohibición de suelo y de interés negativo (art. 21) y cálculo de la TAE de préstamos variables y ' +
      'mixtos (anexo II). La exención temporal de comisiones de 2023 (RDL 8/2023) venció el 31-12-2024; está pendiente de contrastar ' +
      'con fuente oficial que no haya prórroga.'
  }
}

/** Páginas del cliente y las fuentes que usa su cálculo, en orden de importancia. */
export const PAGINAS = {
  irpf: {
    nombre: 'IRPF',
    ruta: '/irpf',
    fuentes: ['lirpf', 'ley11_2020', 'ley7_2024', 'rdl4_2024', 'manualRentaEscalas', 'manualRentaMinimos', 'hacienda2026', 'ley2_2026Extremadura', 'ley5_2026Valencia']
  },
  nomina: {
    nombre: 'Nómina',
    ruta: '/nomina',
    fuentes: ['ordenCotizacion2026', 'rdl3_2026', 'algoritmoAeat', 'rirpf', 'rd142_2024', 'rd1975_2008', 'lirpf', 'rdl4_2024', 'manualRentaEscalas', 'manualRentaMinimos', 'convenioHosteleriaMadrid']
  },
  planJubilacion: {
    nombre: 'Plan de jubilación',
    ruta: '/jubilacion',
    fuentes: ['lirpf', 'ley31_2022', 'ordenCotizacion2026']
  },
  planPensiones: {
    nombre: 'Plan de pensiones',
    ruta: '/jubilacion/pensiones',
    fuentes: ['lgss', 'rd241_2026', 'rdl3_2026', 'ine', 'lirpf']
  },
  hipotecas: {
    nombre: 'Simulador de hipotecas',
    ruta: '/hipotecas',
    fuentes: ['ley5_2019']
  },
  prestamos: {
    nombre: 'Préstamos personales',
    ruta: '/hipotecas/prestamos',
    fuentes: ['ley5_2019']
  },
  amortizacion: {
    nombre: 'Amortización anticipada',
    ruta: '/hipotecas/amortizacion',
    fuentes: ['ley5_2019']
  }
}

/** Páginas que usan una fuente (para «Usada en» en la página Fuentes). */
export const paginasDe = (idFuente) =>
  Object.values(PAGINAS).filter((p) => p.fuentes.includes(idFuente))
