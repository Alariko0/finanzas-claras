const express = require('express')
const router = express.Router()
const IrpfConfig = require('../models/IrpfConfig')

// Obtener configuración IRPF por comunidad autónoma
router.get('/configuracion/:comunidad', async (req, res) => {
  try {
    const comunidad = req.params.comunidad.toUpperCase()

    // Configuración por defecto para la mayoría de las comunidades (Castilla y León, País Vasco, Madrid, Murcia, Asturias)
    const tramosIrcf = [
      { minimo: 0, maximo: 11955, porcentaje: 19, reducción: 0 },
      { minimo: 11955.01, maximo: 18922, porcentaje: 27, reducción: 0 },
      { minimo: 18922.01, maximo: 30093, porcentaje: 31, reducción: 0 },
      { minimo: 30093.01, maximo: 35000, porcentaje: 33, reducción: 0 },
      { minimo: 35000.01, maximo: 48490, porcentaje: 35, reducción: 0 },
      { minimo: 48490.01, maximo: 79681, porcentaje: 42, reducción: 0 },
      { minimo: 79681.01, maximo: 136500, porcentaje: 44, reducción: 0 },
      { minimo: 136500.01, maximo: 150000, porcentaje: 45, reducción: 0 },
      { minimo: 150000.01, maximo: 15000000, porcentaje: 47, reducción: 0 }
    ]

    const efectivoSolidario = {
      minimo: 11955,
      maximo: 30093,
      porcentaje: 2.5
    }

    // Crear o actualizar la configuración
    let config = await IrpfConfig.findOne({ comunidad })
    if (!config) {
      config = new IrpfConfig({
        comunidad,
        tramos: tramosIrcf,
        deduccionExemptas: 0,
        efectivoSolidario
      })
      await config.save()
    }

    res.json({
      config: {
        comunidad,
        tramos: config.tramos,
        deduccionExemptas: config.deduccionExemptas,
        efectivoSolidario: config.efectivoSolidario
      }
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener configuración IRPF',
      error: error.message
    })
  }
})

// Obtener todas las comunidades
router.get('/comunidades', async (req, res) => {
  try {
    const comunidades = [
      'Andalucía',
      'Aragón',
      'Asturias',
      'Baleares',
      'Canarias',
      'Cantabria',
      'Castilla y León',
      'Castilla-La Mancha',
      'Cataluña',
      'Ceuta',
      'Comunidad Valenciana',
      'Comunidad de Madrid',
      'Extremadura',
      'Galicia',
      'Illes Balears',
      'La Rioja',
      'Melilla',
      'Murcia',
      'Navarra',
      'País Vasco'
    ]

    res.json({ comunidades })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener comunidades',
      error: error.message
    })
  }
})

module.exports = router
