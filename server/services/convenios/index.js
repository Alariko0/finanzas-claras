'use strict'

const { ErrorEntrada } = require('../errores')
const { aCentimos, aEuros } = require('../centimos')
const hosteleriaMadrid = require('./hosteleriaMadrid')

/*
 * Convenios colectivos disponibles. Cada uno es un fichero de datos con su fuente (regla 5 del
 * proyecto: nunca cifras de memoria). Para añadir otro, crear su fichero con la misma forma que
 * hosteleriaMadrid.js y registrarlo aquí.
 */

const CONVENIOS = { [hosteleriaMadrid.convenio.id]: hosteleriaMadrid.convenio }

/** Resumen para elegir un convenio (sin las tablas). */
function listar() {
  return Object.values(CONVENIOS).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    ambito: c.ambito,
    vigencia: c.vigencia,
    ultimoAnioConTablas: Math.max(...Object.keys(c.anios).map(Number)),
    pagas: c.pagas.numero
  }))
}

function obtener(id) {
  const c = CONVENIOS[id]
  if (!c) throw new ErrorEntrada('Convenio no encontrado')
  return c
}

const anios = (c) => Object.keys(c.anios).map(Number).sort((a, b) => a - b)

/**
 * Retribución mensual que fija el convenio para una categoría: salario base de las tablas del año
 * y los pluses que el convenio fija con importe. Si el convenio no publica tablas de ese año (o
 * está vencido) se usa la última publicada y se avisa. Es un punto de partida que la persona edita:
 * el recibo real manda.
 *
 * @param {string} id convenio
 * @param {{ anio: number, clase: 'A'|'B'|'C'|'D', nivel: string, manutencionEnMetalico?: boolean }} e
 */
function sugerirRetribucion(id, e = {}) {
  const c = obtener(id)
  const disponibles = anios(c)
  const primero = disponibles[0]
  const ultimo = disponibles[disponibles.length - 1]

  if (!Number.isInteger(e.anio) || e.anio < primero) {
    throw new ErrorEntrada(`El convenio publica tablas desde ${primero}`)
  }
  if (!Object.keys(c.clases).includes(e.clase)) throw new ErrorEntrada(`clase debe ser ${Object.keys(c.clases).join(', ')}`)

  // En catering el nivel III de la lista de categorías es el III-A de las tablas
  const catering = e.clase === 'D'
  const nivelTabla = catering && e.nivel === 'III' ? 'III-A' : e.nivel
  const tabla = c.anios[Math.min(e.anio, ultimo)]
  const porNivel = tabla.salarioBaseMensual[e.clase]
  if (typeof e.nivel !== 'string' || !(nivelTabla in porNivel)) {
    throw new ErrorEntrada(`El nivel ${e.nivel} no existe para la clase ${e.clase}`)
  }

  const anioTabla = Math.min(e.anio, ultimo)
  const salarioBase = porNivel[nivelTabla]
  const avisos = []
  if (e.anio > ultimo) {
    avisos.push(
      `El convenio no publica tablas de ${e.anio}: se usan las de ${ultimo}. Su vigencia acabó el ${c.vigencia.hasta.split('-').reverse().join('/')} ` +
      'y se prorroga salvo denuncia; comprueba si hay una revisión posterior.'
    )
  }

  const lineas = [
    { tipo: 'salarioBase', concepto: 'Salario base (convenio)', importe: salarioBase },
    {
      tipo: 'complemento',
      concepto: 'Plus convenio',
      importe: tabla.plusConvenio,
      nota: `Se abona ${c.pluses.plusConvenio.mesesAlAnio} meses al año. ${c.pluses.plusConvenio.nota}`
    }
  ]
  if (e.manutencionEnMetalico) {
    lineas.push({
      tipo: 'complemento',
      concepto: 'Manutención (en metálico)',
      importe: tabla.manutencionMetalico,
      nota: c.pluses.manutencion.nota
    })
  }

  return {
    convenio: c.nombre,
    anioSolicitado: e.anio,
    anioTabla,
    clase: e.clase,
    nivel: nivelTabla,
    pagas: c.pagas.numero,
    salarioBaseAnual: aEuros(aCentimos(salarioBase) * c.pagas.numero),
    lineas,
    avisos,
    fuente: c.fuente.boletin
  }
}

module.exports = { listar, obtener, sugerirRetribucion }
