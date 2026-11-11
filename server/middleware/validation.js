/**
 * validation.js - Validaciones con express-validator
 * Middleware de validación para endpoints de la API
 */

const { body, param, query, validationResult } = require('express-validator')
const { PAGAS_ADMITIDAS } = require('../services/fiscal/nomina')

const TIPOS_CALCULO = [
  'irpf', 'nomina', 'hipoteca', 'prestamo', 'amortizacion',
  'inversion_inmobiliaria', 'inversion_mobiliaria', 'jubilacion', 'pensiones',
  'gastos', 'presupuesto', 'viaje'
]

const MODULOS_PREFERENCIAS = [
  'modulo_hipotecas', 'modulo_inversion', 'modulo_viajes', 'modulo_jubilacion'
]

// Límite de tamaño de los objetos JSON guardados (bytes serializados)
const MAX_JSON_BYTES = 50 * 1024

/**
 * Middleware que maneja errores de validación
 * Debe ir después de los validadores en la cadena de middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    })
  }
  next()
}

const esObjetoPlano = (valor) =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor)

const objetoJsonAcotado = (campo) =>
  body(campo)
    .custom(esObjetoPlano)
    .withMessage(`${campo} debe ser un objeto`)
    .bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage(`${campo} es demasiado grande`)

const idValidator = [
  param('id').isUUID().withMessage('Identificador no válido'),
  handleValidationErrors
]

const paginacionValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero ≥ 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100').toInt(),
  handleValidationErrors
]

/**
 * Crear cálculo
 */
const calculoValidator = [
  body('tipo').isIn(TIPOS_CALCULO).withMessage('Tipo de cálculo no válido'),
  body('titulo')
    .isString().withMessage('El título debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  objetoJsonAcotado('datosEntrada'),
  objetoJsonAcotado('resultado'),
  handleValidationErrors
]

/**
 * Actualizar cálculo: solo titulo, datosEntrada y resultado (todos opcionales)
 */
const calculoActualizarValidator = [
  body('titulo')
    .optional()
    .isString().withMessage('El título debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),
  body('datosEntrada').optional().custom(esObjetoPlano).withMessage('datosEntrada debe ser un objeto')
    .bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage('datosEntrada es demasiado grande'),
  body('resultado').optional().custom(esObjetoPlano).withMessage('resultado debe ser un objeto')
    .bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage('resultado es demasiado grande'),
  body().custom((valor) =>
    ['titulo', 'datosEntrada', 'resultado'].some((campo) => valor && valor[campo] !== undefined)
  ).withMessage('No hay campos que actualizar'),
  handleValidationErrors
]

/**
 * Actualizar perfil: nombre y preferencias de módulos
 */
const perfilValidator = [
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('preferencias')
    .optional()
    .custom((valor) =>
      esObjetoPlano(valor) &&
      Object.entries(valor).every(
        ([clave, v]) => MODULOS_PREFERENCIAS.includes(clave) && typeof v === 'boolean'
      )
    )
    .withMessage('Preferencias no válidas'),
  body().custom((valor) =>
    ['nombre', 'preferencias'].some((campo) => valor && valor[campo] !== undefined)
  ).withMessage('No hay campos que actualizar'),
  handleValidationErrors
]

/* ───────────── Calculadoras fiscales (públicas) ───────────── */

const esNumero = (v) => typeof v === 'number' && Number.isFinite(v)
const DISCAPACIDADES = ['ninguna', '33', '65']

// Número opcional/obligatorio dentro de un rango (los strings no valen: el servicio exige number)
const numero = (campo, { min = 0, max = 1e9, obligatorio = false } = {}) => {
  const v = body(campo)
  return (obligatorio ? v.exists({ values: 'undefined' }).withMessage(`${campo} es obligatorio`).bail() : v.optional())
    .custom((valor) => esNumero(valor) && valor >= min && valor <= max)
    .withMessage(`${campo} debe ser un número entre ${min} y ${max}`)
}

const booleano = (campo) => body(campo).optional().isBoolean({ strict: true }).withMessage(`${campo} debe ser verdadero o falso`)

const personaValida = (valor, extras = []) =>
  esObjetoPlano(valor) &&
  Number.isInteger(valor.edad) && valor.edad >= 0 && valor.edad <= 120 &&
  (valor.discapacidad === undefined || DISCAPACIDADES.includes(valor.discapacidad)) &&
  (valor.movilidadReducida === undefined || typeof valor.movilidadReducida === 'boolean') &&
  extras.every(([clave, comprobar]) => valor[clave] === undefined || comprobar(valor[clave]))

const listaPersonas = (campo, extras) =>
  body(campo)
    .optional()
    .isArray({ max: 15 }).withMessage(`${campo} debe ser una lista de hasta 15 personas`)
    .bail()
    .custom((lista) => lista.every((p) => personaValida(p, extras)))
    .withMessage(`${campo} contiene datos no válidos`)

const validadoresPersonas = [
  body('contribuyente').optional().custom((v) => personaValida(v)).withMessage('contribuyente no válido'),
  listaPersonas('descendientes', [['computoPorMitad', (v) => typeof v === 'boolean']]),
  listaPersonas('ascendientes', [['compartidoCon', (v) => Number.isInteger(v) && v >= 1 && v <= 10]])
]

const comunidadValida = body('comunidad').isString().withMessage('comunidad es obligatoria').bail().isLength({ max: 30 })

const fiscalIrpfValidator = [
  comunidadValida,
  numero('rendimientoIntegro', { obligatorio: true }),
  numero('cotizacionesSS'),
  numero('otrasRentas'),
  booleano('movilidadGeografica'),
  ...validadoresPersonas,
  handleValidationErrors
]

const fiscalNominaValidator = [
  numero('brutoAnual', { min: 0.01, obligatorio: true }),
  body('pagas').optional().isIn(PAGAS_ADMITIDAS).withMessage(`pagas debe ser ${PAGAS_ADMITIDAS.join(', ')}`),
  booleano('prorrateo'),
  body('grupoCotizacion').optional().isInt({ min: 1, max: 11 }).withMessage('grupoCotizacion debe estar entre 1 y 11').toInt(),
  body('contrato').optional().isIn(['indefinido', 'temporal']).withMessage('contrato no válido'),
  body('contratoRetencion').optional().isIn(['general', 'especial', 'inferiorAnio']).withMessage('contratoRetencion no válido'),
  body('situacionFamiliar').optional().isIn([1, 2, 3]).withMessage('situacionFamiliar debe ser 1, 2 o 3'),
  numero('tasaAccidentes', { max: 100 }),
  booleano('movilidadGeografica'),
  booleano('prestamoVivienda'),
  ...validadoresPersonas,
  handleValidationErrors
]

const fiscalAhorroValidator = [
  comunidadValida,
  numero('baseLiquidableAhorro', { obligatorio: true }),
  numero('baseLiquidableGeneral'),
  ...validadoresPersonas,
  handleValidationErrors
]

/* ───────────── Calculadoras de préstamos e hipotecas (públicas) ───────────── */

const validadoresPrestamo = [
  numero('capital', { min: 0.01, max: 100000000, obligatorio: true }),
  numero('tin', { max: 50 }), // obligatorio en fijo y mixto: lo comprueba el servicio
  body('meses').isInt({ min: 1, max: 600 }).withMessage('meses debe ser un entero entre 1 y 600').bail()
    .custom((v) => typeof v === 'number').withMessage('meses debe ser un número'),
  body('sistema').optional().isIn(['frances', 'aleman', 'americano']).withMessage('sistema debe ser frances, aleman o americano'),
  body('tipoInteres').optional().isIn(['fijo', 'variable', 'mixto']).withMessage('tipoInteres debe ser fijo, variable o mixto'),
  numero('diferencial', { max: 20 }),
  numero('euribor', { min: -5, max: 30 }),
  body('periodoRevision').optional().custom((v) => Number.isInteger(v) && v >= 1 && v <= 60)
    .withMessage('periodoRevision debe ser un entero entre 1 y 60'),
  body('primeraRevision').optional().custom((v) => Number.isInteger(v) && v >= 1 && v <= 600)
    .withMessage('primeraRevision debe ser un entero entre 1 y 600'),
  body('mesesFijos').optional().custom((v) => Number.isInteger(v) && v >= 1 && v <= 599)
    .withMessage('mesesFijos debe ser un entero entre 1 y 599'),
  body('euriborFuturo').optional().isArray({ max: 50 }).withMessage('euriborFuturo debe ser una lista de hasta 50 puntos').bail()
    .custom((lista) => lista.every((p) => esObjetoPlano(p) && Number.isInteger(p.mes) && p.mes >= 1 && p.mes <= 600 &&
      esNumero(p.valor) && p.valor >= -5 && p.valor <= 30))
    .withMessage('euriborFuturo contiene puntos no válidos (mes 1-600, valor -5 a 30)'),
  body('escenariosEuribor').optional().isArray({ max: 5 }).withMessage('escenariosEuribor debe ser una lista de hasta 5 valores').bail()
    .custom((lista) => lista.every((v) => esNumero(v) && v >= -10 && v <= 10))
    .withMessage('escenariosEuribor contiene valores no válidos (-10 a 10)'),
  body('fechaInicio').optional().isISO8601({ strict: true, strictSeparator: true }).withMessage('fechaInicio debe ser AAAA-MM-DD')
    .bail().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('fechaInicio debe ser AAAA-MM-DD')
]

const prestamoCuadroValidator = [
  ...validadoresPrestamo,
  numero('comisionApertura', { max: 100 }),
  numero('gastosIniciales', { max: 100000000 }),
  numero('gastosMensuales', { max: 100000000 }),
  handleValidationErrors
]

const prestamoAmortizacionValidator = [
  ...validadoresPrestamo,
  body('mesAmortizacion').custom((v) => Number.isInteger(v) && v >= 0 && v <= 599)
    .withMessage('mesAmortizacion debe ser un entero entre 0 y 599'),
  numero('importe', { min: 0.01, max: 100000000, obligatorio: true }),
  body('modo').optional().isIn(['reducirCuota', 'reducirPlazo']).withMessage('modo debe ser reducirCuota o reducirPlazo'),
  numero('comisionPct', { max: 100 }),
  numero('nuevoTin', { max: 50 }),
  handleValidationErrors
]

/* ───────────── Calculadoras del hogar (públicas): reparto de gastos y presupuesto ───────────── */

const importeValido = (v, max = 10000000) => esNumero(v) && v >= 0 && v <= max
const textoCorto = (v) => typeof v === 'string' && v.length <= 50
const CATEGORIAS_GASTO = ['necesidades', 'deseos', 'ahorro']

const gastoValido = (g) => esObjetoPlano(g) && importeValido(g.importe) &&
  (g.concepto === undefined || (typeof g.concepto === 'string' && g.concepto.length <= 100)) &&
  (g.categoria === undefined || CATEGORIAS_GASTO.includes(g.categoria))

const personaHogarValida = (p) => esObjetoPlano(p) && importeValido(p.ingresoMensual) &&
  (p.nombre === undefined || textoCorto(p.nombre)) &&
  (p.gastosIndividuales === undefined ||
    (Array.isArray(p.gastosIndividuales) && p.gastosIndividuales.length <= 50 && p.gastosIndividuales.every(gastoValido)))

const hogarRepartoValidator = [
  body('metodo').optional().isIn(['proporcional', 'igual']).withMessage('metodo debe ser proporcional o igual'),
  body('personas').isArray({ min: 1, max: 10 }).withMessage('personas debe ser una lista de 1 a 10 personas').bail()
    .custom((lista) => lista.every(personaHogarValida))
    .withMessage('personas contiene datos no válidos (ingresoMensual numérico, nombre de hasta 50 caracteres, gastosIndividuales como lista de hasta 50 gastos con importe numérico y categoria necesidades, deseos o ahorro)'),
  body('gastosCompartidos').optional().isArray({ max: 100 }).withMessage('gastosCompartidos debe ser una lista de hasta 100 gastos').bail()
    .custom((lista) => lista.every(gastoValido))
    .withMessage('gastosCompartidos contiene datos no válidos (importe numérico y categoria necesidades, deseos o ahorro)'),
  handleValidationErrors
]

const hogarPresupuestoValidator = [
  body('modo').optional().isIn(['50-30-20', 'libre']).withMessage('modo debe ser 50-30-20 o libre'),
  numero('ingresoMensual', { min: 0.01, max: 10000000, obligatorio: true }),
  body('porcentajes').optional().custom((v) => esObjetoPlano(v) &&
    Object.entries(v).every(([k, p]) => ['necesidades', 'deseos', 'ahorro'].includes(k) && esNumero(p) && p >= 0 && p <= 100))
    .withMessage('porcentajes debe tener necesidades, deseos y ahorro entre 0 y 100'),
  body('gastado').optional().custom((v) => esObjetoPlano(v) &&
    Object.entries(v).every(([k, g]) => ['necesidades', 'deseos', 'ahorro'].includes(k) && importeValido(g)))
    .withMessage('gastado debe tener importes numéricos para necesidades, deseos y ahorro'),
  body('partidas').optional().isArray({ max: 20 }).withMessage('partidas debe ser una lista de hasta 20 partidas').bail()
    .custom((lista) => lista.every((p) => esObjetoPlano(p) && esNumero(p.porcentaje) && p.porcentaje > 0 && p.porcentaje <= 100 &&
      (p.nombre === undefined || textoCorto(p.nombre)) &&
      (p.ahorro === undefined || typeof p.ahorro === 'boolean') &&
      (p.gastado === undefined || importeValido(p.gastado))))
    .withMessage('partidas contiene datos no válidos (porcentaje entre 0 y 100, ahorro verdadero o falso, gastado numérico)'),
  numero('objetivoAhorro', { min: 0.01, max: 1000000000 }),
  numero('ahorroActual', { max: 1000000000 }),
  handleValidationErrors
]

/* ───────────── Calculadoras de jubilación (públicas) ───────────── */

const jubilacionProyeccionValidator = [
  body('edadActual').isInt({ min: 16, max: 99 }).withMessage('edadActual debe ser un entero entre 16 y 99'),
  body('edadJubilacion').isInt({ min: 17, max: 100 }).withMessage('edadJubilacion debe ser un entero entre 17 y 100')
    .bail()
    .custom((v, { req }) => !Number.isInteger(req.body.edadActual) || v > req.body.edadActual)
    .withMessage('edadJubilacion debe ser mayor que edadActual'),
  numero('rentabilidad', { min: -20, max: 30, obligatorio: true }),
  numero('rentabilidadJubilacion', { min: -20, max: 30 }),
  numero('ahorroActual', { max: 1e9 }),
  numero('aportacionMensual', { max: 1e9 }),
  numero('crecimientoAportacion', { max: 30 }),
  numero('inflacion', { min: -10, max: 30 }),
  numero('tasaRetiro', { min: 0.1, max: 15 }),
  numero('rentaDeseadaMensual', { max: 1e9 }),
  numero('pensionPublicaMensual', { max: 1e9 }),
  handleValidationErrors
]

const jubilacionPlanPrivadoValidator = [
  comunidadValida,
  numero('brutoAnual', { min: 0.01, max: 1e9, obligatorio: true }),
  body('grupoCotizacion').optional().isInt({ min: 1, max: 11 }).withMessage('grupoCotizacion debe estar entre 1 y 11').toInt(),
  body('contrato').optional().isIn(['indefinido', 'temporal']).withMessage('contrato no válido'),
  booleano('movilidadGeografica'),
  ...validadoresPersonas,
  ...jubilacionProyeccionValidator.slice(0, -1), // edades, rentabilidad, inflación, retiro, pensión pública
  numero('aportacionAnual', { max: 1e9 }),
  numero('contribucionEmpresaAnual', { max: 1e9 }),
  numero('saldoActual', { max: 1e9 }),
  handleValidationErrors
]

/* ───────────── Pensión pública de jubilación (pública) ───────────── */

const MES_AAAA_MM = /^\d{4}-(0[1-9]|1[0-2])$/
const tramoPensionValido = (t) => esObjetoPlano(t) && typeof t.desde === 'string' && MES_AAAA_MM.test(t.desde) &&
  typeof t.hasta === 'string' && MES_AAAA_MM.test(t.hasta) &&
  esNumero(t.baseMensual) && t.baseMensual >= 0 && t.baseMensual <= 20000

const pensionJubilacionValidator = [
  body('edadActual').isInt({ min: 16, max: 99 }).withMessage('edadActual debe ser un entero entre 16 y 99'),
  body('edadJubilacion').isInt({ min: 17, max: 100 }).withMessage('edadJubilacion debe ser un entero entre 17 y 100')
    .bail()
    .custom((v, { req }) => !Number.isInteger(req.body.edadActual) || v > req.body.edadActual)
    .withMessage('edadJubilacion debe ser mayor que edadActual'),
  body('fechaActual').optional().matches(MES_AAAA_MM).withMessage('fechaActual debe tener el formato AAAA-MM'),
  body('tramos').optional().isArray({ max: 200 }).withMessage('tramos debe ser una lista de hasta 200 periodos').bail()
    .custom((lista) => lista.every(tramoPensionValido))
    .withMessage('tramos contiene datos no válidos (desde y hasta como AAAA-MM, baseMensual numérica)'),
  numero('baseMensualActual', { max: 20000 }),
  numero('crecimientoBases', { min: -10, max: 30 }),
  numero('inflacion', { min: -10, max: 30 }),
  body('situacionMinimo').optional().isIn(['sinConyuge', 'conyugeACargo', 'conyugeNoACargo']).withMessage('situacionMinimo no válida'),
  body('comunidad').optional().isString().isLength({ max: 30 }),
  handleValidationErrors
]

/* ───────────── Nóminas mensuales (recibo concepto a concepto) ───────────── */

// Solo la forma general; el detalle de cada concepto lo valida services/nominaMensual.js
const objetoOpcional = (campo) =>
  body(campo).optional().custom(esObjetoPlano).withMessage(`${campo} debe ser un objeto`)

const nominaReciboValidator = [
  body().custom(esObjetoPlano).withMessage('El cuerpo debe ser un objeto').bail()
    .custom((valor) => Buffer.byteLength(JSON.stringify(valor)) <= MAX_JSON_BYTES)
    .withMessage('La nómina es demasiado grande'),
  body('anio').custom((v) => Number.isInteger(v) && v >= 2000 && v <= 2100).withMessage('anio debe ser un año entre 2000 y 2100'),
  body('mes').custom((v) => Number.isInteger(v) && v >= 1 && v <= 12).withMessage('mes debe ser un entero de 1 a 12'),
  body('tipo').optional().isIn(['ordinaria', 'extra']).withMessage('tipo debe ser ordinaria o extra'),
  body('fechaCobro').optional({ values: 'null' }).isString().withMessage('fechaCobro debe ser texto'),
  objetoOpcional('encabezado'),
  objetoOpcional('devengos'),
  objetoOpcional('deducciones'),
  objetoOpcional('bases'),
  handleValidationErrors
]

const nominaConsultaValidator = [
  query('anio').optional().isInt({ min: 2000, max: 2100 }).withMessage('anio debe ser un año entre 2000 y 2100').toInt(),
  query('pagas').optional().isIn(PAGAS_ADMITIDAS.map(String)).withMessage(`pagas debe ser ${PAGAS_ADMITIDAS.join(', ')}`).toInt(),
  handleValidationErrors
]

/* ───────────── Convenios colectivos (datos públicos) ───────────── */

const convenioIdValidator = [
  param('id').matches(/^[a-z0-9-]{1,60}$/).withMessage('Identificador de convenio no válido'),
  handleValidationErrors
]

const convenioRetribucionValidator = [
  body('anio').custom((v) => Number.isInteger(v) && v >= 2000 && v <= 2100).withMessage('anio debe ser un año entre 2000 y 2100'),
  body('clase').isIn(['A', 'B', 'C', 'D']).withMessage('clase debe ser A, B, C o D'),
  body('nivel').isString().isLength({ min: 1, max: 10 }).withMessage('nivel no válido'),
  booleano('manutencionEnMetalico'),
  handleValidationErrors
]

module.exports = {
  convenioIdValidator,
  convenioRetribucionValidator,
  nominaReciboValidator,
  nominaConsultaValidator,
  pensionJubilacionValidator,
  jubilacionProyeccionValidator,
  jubilacionPlanPrivadoValidator,
  hogarRepartoValidator,
  hogarPresupuestoValidator,
  TIPOS_CALCULO,
  MODULOS_PREFERENCIAS,
  handleValidationErrors,
  idValidator,
  paginacionValidator,
  calculoValidator,
  calculoActualizarValidator,
  perfilValidator,
  fiscalIrpfValidator,
  fiscalNominaValidator,
  fiscalAhorroValidator,
  prestamoCuadroValidator,
  prestamoAmortizacionValidator
}
