const express = require('express')
const router = express.Router()

// TEMPORAL: este cálculo se sustituye en la fase 4 por server/services/prestamos.js
// (el TAE y el redondeo actuales no son correctos).

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
    console.error('Error al calcular hipoteca:', error.message)
    res.status(500).json({
      success: false,
      message: 'Error al calcular hipoteca'
    })
  }
})

module.exports = router
