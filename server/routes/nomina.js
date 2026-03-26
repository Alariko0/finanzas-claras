const express = require('express')
const router = express.Router()

/**
 * Rutas de cálculo de nómina
 * Desglose visual de retenciones y Seguridad Social 2025
 */

// Cálculo de base - sin datos en DB
const calcularCua = (salario) => {
  // Cuota SSI (seguridad social independiente)
  const base = Math.min(salario, 33255)
  const cuota = Math.floor(base * 0.0345)
  return cuota
}

const calcularCta = (salario) => {
  // Cotización a cargo trabajador (aprox)
  const base = Math.min(salario, 33255)
  const cuota = Math.floor(base * 0.047)
  return cuota
}

const calcularCea = (salario) => {
  // Cotización empresa
  const base = Math.min(salario, 33255)
  const cuota = Math.floor(base * 0.047)
  return cuota
}

// Endpoint de cálculo
router.post('/calcular', (req, res) => {
  try {
    const { salario, convenio, retencionIrf } = req.body

    // Calcular cuotas
    const cta = calcularCua(salario)
    const cea = calcularCea(salario)
    const retenIrf = retencionIrf || 0

    // Neto = Bruto - CUA - CTA - Retenciones
    const neto = salario - cta - cea - retenIrf

    res.json({
      bruto: salario,
      convenio,
      retenciones: {
        cta: cta,
        cea: cea,
        retenIrf: retenIrf,
        total: cta + cea + retenIrf
      },
      neto,
      desglose: {
        bruto: salario,
        menosRetencionesSS: cta + cea,
        menosRetencionesIrf: retenIrf,
        neto: neto
      }
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al calcular nómina',
      error: error.message
    })
  }
})

// Endpoint de configuración de convenios
router.get('/convenios', (req, res) => {
  res.json({
    convenios: [
      'General',
      'Metalurgia',
      'Comercio',
      'Osteópatas',
      'Enfermería',
      'Abogados',
      'Médicos',
      'Arquitectos',
      'Docentes',
      'Otro'
    ]
  })
})

module.exports = router
