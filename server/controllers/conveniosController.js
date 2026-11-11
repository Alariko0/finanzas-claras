const convenios = require('../services/convenios')
const { copiar } = require('./responderCalculo')

/*
 * Convenios colectivos (datos públicos, solo lectura). Lista blanca de campos en la entrada.
 * Un convenio que no existe o un dato incoherente (ErrorEntrada) es 404 o 400; lo demás, un 500
 * genérico.
 */

const manejar = (estadoError, accion) => (req, res) => {
  try {
    res.json({ success: true, data: accion(req) })
  } catch (error) {
    if (error.name === 'ErrorEntrada') return res.status(estadoError(error)).json({ success: false, message: error.message })
    console.error('Error en convenios:', error)
    res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

const noEncontrado = (error) => (error.message === 'Convenio no encontrado' ? 404 : 400)

const listar = manejar(() => 400, () => ({ convenios: convenios.listar() }))

const obtener = manejar(noEncontrado, (req) => ({ convenio: convenios.obtener(req.params.id) }))

const retribucion = manejar(noEncontrado, (req) => ({
  resultado: convenios.sugerirRetribucion(req.params.id, copiar(req.body, ['anio', 'clase', 'nivel', 'manutencionEnMetalico']))
}))

module.exports = { listar, obtener, retribucion }
