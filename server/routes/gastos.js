const express = require('express')
const router = express.Router()

/**
 * Rutas de gestión de gastos compartidos
 */

// Cálculo de gastos compartidos
router.post('/calcular-compartidos', (req, res) => {
  try {
    const { montoTotal, participantes, gastosIndividuales = {} } = req.body

    // Calcular cuota por participante
    const montoCompartido = montoTotal - Object.values(gastosIndividuales).reduce((a, b) => a + b, 0)
    const cuota = Math.round(montoCompartido / participantes)

    const resultado = {
      montoTotal,
      participantes,
      gastosIndividuales,
      cuota,
      totalGastosIndividuales: Object.values(gastosIndividuales).reduce((a, b) => a + b, 0),
      totalAContribuir: montoTotal - Object.values(gastosIndividuales).reduce((a, b) => a + b, 0)
    }

    res.json(resultado)
  } catch (error) {
    res.status(500).json({
      message: 'Error al calcular gastos compartidos',
      error: error.message
    })
  }
})

module.exports = router
