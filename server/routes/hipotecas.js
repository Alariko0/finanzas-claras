const express = require('express')
const router = express.Router()
const Prestamo = require('../models/Prestamo')

// Cálculo de cuota hipotecaria
const calcularCuotaMensual = (monto, tasa, plazo) => {
  const tasaMensual = tasa / 100 / 12
  const cuota = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo))
  return Math.round(cuota)
}

const calcularTae = (tasaNominal, tipoComision) => {
  // TAE aproximada = TAN + comisiones
  const comision = tipoComision * 100
  return (tasaNominal + comision) * 100
}

router.post('/calcular', (req, res) => {
  try {
    const { monto, tasa, plazo, tipoPlazo = 'meses' } = req.body

    // Convertir plazo a meses
    const plazoMeses = tipoPlazo === 'anios' ? plazo * 12 : plazo

    const cuota = calcularCuotaMensual(monto, tasa, plazoMeses)
    const tae = calcularTae(tasa, 0.02)

    // Cálculo de intereses totales
    const pagosTotales = cuota * plazoMeses
    const interesesTotales = pagosTotales - monto

    res.json({
      cuota,
      tae,
      plazoMeses,
      pagosTotales,
      interesesTotales,
      amortizacionInicial: {
        capital: monto,
        intereses: Math.round(monto * tasa / 100 / 12)
      }
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al calcular hipoteca',
      error: error.message
    })
  }
})

// Obtener lista de préstamos guardados
router.get('/mis-prestamos', async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ usuario: req.usuario.id })
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 })

    res.json({ prestamos })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener préstamos',
      error: error.message
    })
  }
})

// Crear nuevo préstamo
router.post('/crear', async (req, res) => {
  try {
    const prestamo = new Prestamo({
      usuario: req.usuario.id,
      tipo: 'hipoteca',
      ...req.body
    })

    await prestamo.save()

    res.status(201).json({
      prestamo
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear préstamo',
      error: error.message
    })
  }
})

module.exports = router
