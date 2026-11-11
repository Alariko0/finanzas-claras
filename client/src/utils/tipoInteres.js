/**
 * Formulario del tipo de interés (fijo, variable, mixto) y del sistema de amortización.
 * Convierte lo que escribe el usuario en el cuerpo de /api/prestamos/* y valida lo que falta.
 * No hay Euríbor ni diferencial por defecto: el futuro no se conoce y el diferencial es el de tu oferta.
 */

export const TIPOS_INTERES = [
  ['fijo', 'Fijo'],
  ['variable', 'Variable (Euríbor + diferencial)'],
  ['mixto', 'Mixto (fijo y luego variable)']
]

export const SISTEMAS = [
  ['frances', 'Francés: cuota constante'],
  ['aleman', 'Alemán: capital constante, cuota decreciente'],
  ['americano', 'Americano: solo intereses y todo el capital al final']
]

export const FORMULARIO_TIPO_INICIAL = {
  sistema: 'frances',
  tipoInteres: 'fijo',
  tin: 3.5,
  anosFijos: 5,
  diferencial: '',
  euribor: '',
  periodoRevision: 12,
  cambiosEuribor: [] // [{ mes: number, valor: number }]
}

const esNumero = (v) => v !== '' && v !== null && Number.isFinite(Number(v))

/** Mensaje de lo que falta o sobra, o '' si el formulario del tipo es válido. */
export function errorTipo(f, meses) {
  if (f.tipoInteres === 'fijo') return ''
  if (!esNumero(f.euribor)) return 'Indica el Euríbor que quieres suponer: el valor futuro no se conoce.'
  if (!esNumero(f.diferencial)) return 'Indica el diferencial de tu oferta (puntos sobre el Euríbor).'
  if (f.tipoInteres === 'mixto') {
    if (!(f.anosFijos >= 1) || f.anosFijos * 12 >= meses) return 'Los años a tipo fijo deben ser menos que el plazo total.'
    if (!esNumero(f.tin)) return 'Indica el TIN del tramo fijo.'
  }
  if (f.cambiosEuribor.some((c) => !esNumero(c.mes) || !(Number(c.mes) >= 1) || !esNumero(c.valor))) {
    return 'Completa o quita los cambios del Euríbor: cada uno necesita la cuota de inicio y el valor.'
  }
  return ''
}

/** Campos del tipo de interés para el cuerpo de la petición. */
export function entradaTipo(f) {
  const base = { sistema: f.sistema, tipoInteres: f.tipoInteres }
  if (f.tipoInteres === 'fijo') return { ...base, tin: Number(f.tin) }

  const variable = {
    ...base,
    diferencial: Number(f.diferencial),
    euribor: Number(f.euribor),
    periodoRevision: Number(f.periodoRevision),
    ...(f.cambiosEuribor.length
      ? { euriborFuturo: f.cambiosEuribor.map((c) => ({ mes: Number(c.mes), valor: Number(c.valor) })) }
      : {})
  }
  if (f.tipoInteres === 'mixto') {
    return { ...variable, tin: Number(f.tin), mesesFijos: Math.round(f.anosFijos * 12) }
  }
  // Variable: el TIN solo se envía si se rellena (tipo inicial hasta la primera revisión)
  return f.tin === '' ? variable : { ...variable, tin: Number(f.tin) }
}
