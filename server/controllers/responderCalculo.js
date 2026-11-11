/*
 * Manejador común de las calculadoras públicas: envuelve una función pura de cálculo.
 * Un ErrorEntrada del servicio (dato incoherente) es un 400 con su mensaje; cualquier otro
 * error es interno: se registra y se responde un mensaje genérico.
 */

const copiar = (origen, campos) =>
  Object.fromEntries(campos.filter((c) => origen[c] !== undefined).map((c) => [c, origen[c]]))

const responderCalculo = (calcular) => (req, res) => {
  try {
    res.json({ success: true, data: { resultado: calcular(req.body) } })
  } catch (error) {
    if (error.name === 'ErrorEntrada') {
      return res.status(400).json({ success: false, message: error.message })
    }
    console.error('Error en cálculo:', error)
    res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

module.exports = { copiar, responderCalculo }
