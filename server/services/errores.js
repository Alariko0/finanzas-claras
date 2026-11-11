'use strict'

/*
 * Dato de entrada incoherente o fuera de rango. Los controladores de las calculadoras públicas
 * lo responden como un 400 con su mensaje (ver controllers/responderCalculo.js).
 */
class ErrorEntrada extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'ErrorEntrada'
  }
}

module.exports = { ErrorEntrada }
