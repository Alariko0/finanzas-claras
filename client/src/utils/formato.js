/** Formatos de presentación compartidos (es-ES). Los importes llegan ya calculados del servidor. */

export const euro = (n) =>
  `${Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export const porcentaje = (n, decimales = 2) =>
  `${Number(n).toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`

// 'AAAA-MM-DD' → '15/02/2026' sin pasar por Date (evita desfases de zona horaria)
export const fechaCorta = (iso) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export const hoyISO = () => {
  const h = new Date()
  const dos = (n) => String(n).padStart(2, '0')
  return `${h.getFullYear()}-${dos(h.getMonth() + 1)}-${dos(h.getDate())}`
}

export const plazoTexto = (meses) => {
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  const partes = []
  if (anios) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`)
  if (resto) partes.push(`${resto} ${resto === 1 ? 'mes' : 'meses'}`)
  return partes.join(' y ') || '0 meses'
}
