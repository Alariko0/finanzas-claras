const express = require('express')
const router = express.Router()
const Calculo = require('../models/Calculo')

// Obtener lista de cálculos
router.get('/', async (req, res) => {
  try {
    const calculos = await Calculo.find().sort({ createdAt: -1 })
    res.json({
      calculos
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener cálculos',
      error: error.message
    })
  }
})

// Obtener un cálculo específico
router.get('/:id', async (req, res) => {
  try {
    const calculo = await Calculo.findById(req.params.id)

    if (!calculo) {
      return res.status(404).json({
        message: 'Cálculo no encontrado'
      })
    }

    res.json({
      calculo
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener cálculo',
      error: error.message
    })
  }
})

// Crear un cálculo
router.post('/', async (req, res) => {
  try {
    const {
      tipo,
      titulo,
      datosEntrada,
      resultado,
      enlaceCompartido = '',
      visibilidad = 'privado'
    } = req.body

    const calculo = new Calculo({
      usuario: req.usuario.id,
      tipo,
      titulo,
      datosEntrada,
      resultado,
      enlaceCompartido,
      visibilidad
    })

    await calculo.save()

    res.status(201).json({
      calculo
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear cálculo',
      error: error.message
    })
  }
})

// Actualizar un cálculo
router.put('/:id', async (req, res) => {
  try {
    const calculo = await Calculo.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )

    if (!calculo) {
      return res.status(404).json({
        message: 'Cálculo no encontrado'
      })
    }

    res.json({
      calculo
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar cálculo',
      error: error.message
    })
  }
})

// Eliminar un cálculo
router.delete('/:id', async (req, res) => {
  try {
    const calculo = await Calculo.findByIdAndDelete(req.params.id)

    if (!calculo) {
      return res.status(404).json({
        message: 'Cálculo no encontrado'
      })
    }

    res.json({
      message: 'Cálculo eliminado correctamente'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar cálculo',
      error: error.message
    })
  }
})

module.exports = router
