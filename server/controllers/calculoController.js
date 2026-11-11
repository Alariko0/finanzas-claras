/**
 * calculoController.js - Controlador de cálculos guardados
 * CRUD de cálculos (IRPF, Nómina, Hipotecas, etc.)
 */

const Calculo = require('../models/Calculo')

/**
 * Listar cálculos del usuario autenticado
 * GET /api/calculos
 */
exports.listar = async (req, res) => {
  try {
    const calculos = await Calculo.find({ usuario: req.usuario.id }).sort({ createdAt: -1 })
    res.json({
      success: true,
      calculos
    })
  } catch (error) {
    console.error('Error al obtener cálculos:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener cálculos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Obtener un cálculo específico
 * GET /api/calculos/:id
 */
exports.obtener = async (req, res) => {
  try {
    const calculo = await Calculo.findOne({
      _id: req.params.id,
      usuario: req.usuario.id
    })

    if (!calculo) {
      return res.status(404).json({
        success: false,
        message: 'Cálculo no encontrado'
      })
    }

    res.json({
      success: true,
      calculo
    })
  } catch (error) {
    console.error('Error al obtener cálculo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al obtener cálculo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Crear un cálculo
 * POST /api/calculos
 */
exports.crear = async (req, res) => {
  try {
    const { tipo, titulo, datosEntrada, resultado, enlaceCompartido = '', visibilidad = 'privado' } = req.body

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
      success: true,
      calculo
    })
  } catch (error) {
    console.error('Error al crear cálculo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al crear cálculo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Actualizar un cálculo
 * PUT /api/calculos/:id
 */
exports.actualizar = async (req, res) => {
  try {
    const calculo = await Calculo.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario.id },
      req.body,
      { new: true, runValidators: true }
    )

    if (!calculo) {
      return res.status(404).json({
        success: false,
        message: 'Cálculo no encontrado'
      })
    }

    res.json({
      success: true,
      calculo
    })
  } catch (error) {
    console.error('Error al actualizar cálculo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cálculo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Eliminar un cálculo
 * DELETE /api/calculos/:id
 */
exports.eliminar = async (req, res) => {
  try {
    const calculo = await Calculo.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario.id
    })

    if (!calculo) {
      return res.status(404).json({
        success: false,
        message: 'Cálculo no encontrado'
      })
    }

    res.json({
      success: true,
      message: 'Cálculo eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar cálculo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cálculo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
