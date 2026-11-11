/** Comunidades y ciudades autónomas, con la clave que entiende el servidor (datos2026.js). */
export const COMUNIDADES = [
  ['andalucia', 'Andalucía'], ['aragon', 'Aragón'], ['asturias', 'Asturias'], ['baleares', 'Illes Balears'],
  ['canarias', 'Canarias'], ['cantabria', 'Cantabria'], ['castillaLaMancha', 'Castilla-La Mancha'],
  ['castillaYLeon', 'Castilla y León'], ['cataluna', 'Cataluña'], ['extremadura', 'Extremadura'],
  ['galicia', 'Galicia'], ['laRioja', 'La Rioja'], ['madrid', 'Comunidad de Madrid'],
  ['murcia', 'Región de Murcia'], ['valencia', 'Comunitat Valenciana'],
  ['paisVasco', 'País Vasco (régimen foral)'], ['navarra', 'Navarra (régimen foral)'],
  ['ceuta', 'Ceuta'], ['melilla', 'Melilla']
]

export const nombreComunidad = (clave) => COMUNIDADES.find(([k]) => k === clave)?.[1] ?? clave
