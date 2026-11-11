/**
 * recibo.js - El formulario de una nómina real (recibo de salarios) y su paso a/desde la API.
 * Los campos del formulario son texto (pueden estar vacíos); a la API solo viaja lo escrito.
 * Los cálculos (totales, avisos, resumen) son del servidor.
 */

let contador = 0
export const nuevoIdLinea = () => `l${++contador}`

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

export const nombreMes = (mes) => MESES[mes - 1] ?? ''

export const linea = (concepto = '', importe = '') => ({ id: nuevoIdLinea(), concepto, importe })

/** Formulario vacío para el mes indicado. */
export const reciboInicial = (anio, mes) => ({
  anio: String(anio),
  mes: String(mes),
  tipo: 'ordinaria',
  fechaCobro: '',
  encabezado: {
    empresa: '', convenio: '', grupoProfesional: '', categoria: '', fechaAntiguedad: '',
    grupoCotizacion: '', contrato: '', diasPeriodo: '',
    convenioId: '', convenioClase: '', convenioNivel: ''
  },
  devengos: { salarioBase: '', complementos: [], horasExtra: '', pagaExtraProrrateada: '', noSalariales: [] },
  deducciones: {
    ss: { contingenciasComunes: '', desempleo: '', formacionProfesional: '', mei: '', horasExtra: '', solidaridad: '' },
    irpf: { base: '', tipo: '', importe: '' },
    aportacionPlanEmpleo: '',
    otras: []
  },
  bases: { contingenciasComunes: '', contingenciasProfesionales: '', horasExtra: '' },
  aportacionEmpresaPlan: '',
  liquidoDeclarado: ''
})

const numero = (s) => (s === '' || s === undefined || s === null ? undefined : Number(s))
const texto = (s) => (typeof s === 'string' && s.trim() !== '' ? s.trim() : undefined)
const sinVacios = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))
const numeros = (o) => sinVacios(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, numero(v)])))
const lineasApi = (lista) =>
  lista.filter((l) => l.concepto.trim() !== '' || l.importe !== '').map((l) => ({ concepto: l.concepto.trim(), importe: numero(l.importe) ?? 0 }))

/** Cuerpo de POST /api/fiscal/recibo y /api/nominas a partir del formulario. */
export function aEntradaRecibo(f) {
  const enc = f.encabezado
  return sinVacios({
    anio: Number(f.anio),
    mes: Number(f.mes),
    tipo: f.tipo,
    fechaCobro: texto(f.fechaCobro),
    encabezado: sinVacios({
      empresa: texto(enc.empresa),
      convenio: texto(enc.convenio),
      grupoProfesional: texto(enc.grupoProfesional),
      categoria: texto(enc.categoria),
      fechaAntiguedad: texto(enc.fechaAntiguedad),
      grupoCotizacion: numero(enc.grupoCotizacion),
      contrato: texto(enc.contrato),
      diasPeriodo: numero(enc.diasPeriodo),
      convenioId: texto(enc.convenioId),
      convenioClase: texto(enc.convenioClase),
      convenioNivel: texto(enc.convenioNivel)
    }),
    devengos: sinVacios({
      salarioBase: numero(f.devengos.salarioBase),
      complementos: lineasApi(f.devengos.complementos),
      horasExtra: numero(f.devengos.horasExtra),
      pagaExtraProrrateada: numero(f.devengos.pagaExtraProrrateada),
      noSalariales: lineasApi(f.devengos.noSalariales)
    }),
    deducciones: sinVacios({
      ss: numeros(f.deducciones.ss),
      irpf: numeros(f.deducciones.irpf),
      aportacionPlanEmpleo: numero(f.deducciones.aportacionPlanEmpleo),
      otras: lineasApi(f.deducciones.otras)
    }),
    bases: numeros(f.bases),
    aportacionEmpresaPlan: numero(f.aportacionEmpresaPlan),
    liquidoDeclarado: numero(f.liquidoDeclarado)
  })
}

/** ¿Hay algún devengo escrito? Antes de eso no se llama a la API. */
export function hayDevengos(f) {
  const d = f.devengos
  return [d.salarioBase, d.horasExtra, d.pagaExtraProrrateada].some((v) => Number(v) > 0) ||
    [...d.complementos, ...d.noSalariales].some((l) => Number(l.importe) > 0)
}

const aTexto = (n) => (n === undefined || n === null || n === 0 ? '' : String(n))
const camposTexto = (o, claves) => Object.fromEntries(claves.map((k) => [k, aTexto(o?.[k])]))
const lineasForm = (lista = []) => lista.map((l) => linea(l.concepto, aTexto(l.importe)))

/** Formulario a partir de una nómina guardada (`datos` que devuelve la API). */
export function aFormulario(nomina) {
  const d = nomina.datos
  const base = reciboInicial(nomina.anio, nomina.mes)
  return {
    ...base,
    tipo: nomina.tipo,
    fechaCobro: nomina.fechaCobro ?? '',
    encabezado: {
      ...base.encabezado,
      ...Object.fromEntries(Object.entries(d.encabezado ?? {}).map(([k, v]) => [k, String(v)]))
    },
    devengos: {
      salarioBase: aTexto(d.devengos?.salarioBase),
      complementos: lineasForm(d.devengos?.complementos),
      horasExtra: aTexto(d.devengos?.horasExtra),
      pagaExtraProrrateada: aTexto(d.devengos?.pagaExtraProrrateada),
      noSalariales: lineasForm(d.devengos?.noSalariales)
    },
    deducciones: {
      ss: camposTexto(d.deducciones?.ss, Object.keys(base.deducciones.ss)),
      irpf: camposTexto(d.deducciones?.irpf, ['base', 'tipo', 'importe']),
      aportacionPlanEmpleo: aTexto(d.deducciones?.aportacionPlanEmpleo),
      otras: lineasForm(d.deducciones?.otras)
    },
    bases: camposTexto(d.bases, Object.keys(base.bases)),
    aportacionEmpresaPlan: aTexto(d.aportacionEmpresaPlan),
    liquidoDeclarado: aTexto(d.liquidoDeclarado)
  }
}

/** Tramos de historial de cotización (uno por mes) a partir de las bases del resumen. */
export const tramosDeNominas = (basesCotizacion) =>
  basesCotizacion.map(({ mes, base }) => ({ desde: mes, hasta: mes, baseMensual: base }))

const CONCEPTOS_CONVENIO = ['Plus convenio', 'Manutención (en metálico)']

/** Categorías de un convenio que existen en una clase de establecimiento (II-C y III-B son solo de catering). */
export const categoriasDisponibles = (convenio, clase) =>
  convenio.categorias.filter((c) => clase === 'D' || !['II-C', 'III-B'].includes(c.nivel))

/**
 * Pone en el formulario lo que fija el convenio (resultado de la API de convenios): el salario base y
 * sus pluses. Sustituye los pluses del convenio de una aplicación anterior y deja los demás complementos.
 */
export function aplicarRetribucionConvenio(f, r) {
  const base = r.lineas.find((l) => l.tipo === 'salarioBase')
  const propios = f.devengos.complementos.filter((l) => !CONCEPTOS_CONVENIO.includes(l.concepto))
  const delConvenio = r.lineas.filter((l) => l.tipo === 'complemento').map((l) => linea(l.concepto, String(l.importe)))
  return {
    ...f,
    devengos: { ...f.devengos, salarioBase: String(base.importe), complementos: [...propios, ...delConvenio] }
  }
}
