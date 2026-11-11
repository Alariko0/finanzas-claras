'use strict'

/*
 * Convenio Colectivo del Sector de Hostelería y Actividades Turísticas de la Comunidad de Madrid.
 *
 * Fuente: Resolución de 15 de marzo de 2024 de la Dirección General de Trabajo (Consejería de
 * Economía, Hacienda y Empleo) sobre registro, depósito y publicación del convenio, firmado el
 * 2-2-2024 por Hostelería Madrid, Noche Madrid y AMER con UGT y CCOO. Código 28002085011981.
 * «BOCM» núm. 82, 6-4-2024 (BOCM-20240406-2). Texto leído el 2026-11-11 en el PDF que facilita
 * CCOO Servicios; las tablas se extrajeron con `pdftotext -table` y se comprobaron: cada año sale
 * del anterior con la revisión del art. 5 (+5 % en 2024, +4 % en 2025), ver convenios.test.js.
 *
 * LÍMITES (importan para fiarse de estos datos)
 *  - Vigencia: 1-1-2023 a 31-12-2025 (art. 5); se prorroga automáticamente por plazos iguales salvo
 *    denuncia. Este texto NO trae tablas de 2026: la última es la de 2025.
 *  - No se recogen las tablas del Anexo III (solo para empresas que mantienen el porcentaje de servicio),
 *    ni los complementos ad personam (porcentaje de servicio y antigüedad consolidada, disp. trans. 1.ª y 2.ª).
 *  - Importes en euros tal como los publica la fuente. Los salarios son BASE MENSUALES; el convenio
 *    paga 14 mensualidades de salario base (las dos extras, art. 26; la fórmula de la disp. trans. 1.ª
 *    multiplica el salario base por catorce).
 */

const FECHA_DATOS = '2026-11-11'

const BOCM = 'BOCM núm. 82, 6-4-2024 (BOCM-20240406-2)'

/**
 * Niveles retributivos del Anexo I.A con las categorías que incluye. Los nombres siguen el texto;
 * solo se han quitado los sinónimos repetidos y los saltos de línea del PDF.
 */
const CATEGORIAS = [
  // NIVEL I
  { nivel: 'I', nombre: 'Jefe/a de Administración (o Contable General, Jefe/a de Contabilidad)' },
  { nivel: 'I', nombre: 'Jefe/a Comercial' },
  { nivel: 'I', nombre: 'Jefe/a de Primera de Casinos' },
  { nivel: 'I', nombre: 'Jefe/a de Cocina' },
  { nivel: 'I', nombre: 'Jefe/a de Catering' },
  { nivel: 'I', nombre: 'Jefe/a de Restaurante o Sala (o Jefe/a de Sala, Jefe/a de Comedor, Primer/a Maitre, Maestresala)' },
  { nivel: 'I', nombre: 'Jefe/a de Operaciones Catering (Jefe/a de Operaciones)' },
  { nivel: 'I', nombre: 'Jefe/a de Servicios de Catering' },
  { nivel: 'I', nombre: 'Jefe/a de Servicios Técnicos' },
  // NIVEL II-A
  { nivel: 'II-A', nombre: 'Jefe/a de Segunda de Casinos' },
  { nivel: 'II-A', nombre: 'Segundo/a Jefe/a de Cocina' },
  { nivel: 'II-A', nombre: 'Segundo/a Jefe/a de Restaurante o Sala (o Segundo/a Jefe/a de Comedor, Primer/a Encargado/a de Mostrador en Cafeterías, Bares y Salas de Fiestas y Discotecas, Segundo/a Jefe/a de Sala)' },
  // NIVEL II-B
  { nivel: 'II-B', nombre: 'Jefe/a de Partida' },
  { nivel: 'II-B', nombre: 'Repostero/a de Catering' },
  { nivel: 'II-B', nombre: 'Jefe/a de Sala de Catering (o Jefe/a de Sala)' },
  { nivel: 'II-B', nombre: 'Supervisor/a de Catering (o Supervisor/a)' },
  { nivel: 'II-B', nombre: 'Jefe/a de Sector' },
  { nivel: 'II-B', nombre: 'Segundo/a Encargado/a de Mostrador (Cafeterías, Bares y Salas de Fiestas y Discotecas)' },
  { nivel: 'II-B', nombre: 'Sumiller' },
  { nivel: 'II-B', nombre: 'Barman/Barwoman' },
  // NIVEL II-C (solo sector catering)
  { nivel: 'II-C', nombre: 'Oficial/a de Repostero/a de Catering' },
  { nivel: 'II-C', nombre: 'Cocinero/a de Catering' },
  { nivel: 'II-C', nombre: 'Jefe/a de Equipo de Catering (o Jefe/a de Equipo)' },
  // NIVEL III (III-A en el sector catering)
  { nivel: 'III', nombre: 'Recepcionista, Administrativo/a (o Tenedor/a de cuentas de clientes, Interventor/a, Contable, Oficial de 1ª, Facturista, Cajero/a)' },
  { nivel: 'III', nombre: 'Relaciones Públicas' },
  { nivel: 'III', nombre: 'Comercial' },
  { nivel: 'III', nombre: 'Oficial/a de Primera de Casinos' },
  { nivel: 'III', nombre: 'Cocinero/a' },
  { nivel: 'III', nombre: 'Repostero/a' },
  { nivel: 'III', nombre: 'Encargado/a de Economato (o Encargado/a de Economato y Bodega, Bodeguero/a, Encargado/a de Almacén)' },
  { nivel: 'III', nombre: 'Camarero/a (o Dependiente de Cafetería, Dependiente de Primera de Salas de Fiestas y Discotecas, Dependiente de 1ª en bares, Planchista, Cafetero/a, Cajero/a de Comedor, Segundo/a barman/barwoman)' },
  { nivel: 'III', nombre: 'Conductor/a de Equipo de Catering (o Conductor/a)' },
  { nivel: 'III', nombre: 'Ayudante de Supervisor/a' },
  { nivel: 'III', nombre: 'Encargado/a de Sección o Turno (o Encargado/a de sala, Encargado/a de Lencería, Encargado/a de fregadores)' },
  { nivel: 'III', nombre: 'Lencero/a, Planchador/a, Lavandero/a' },
  { nivel: 'III', nombre: 'Especialista de Mantenimiento y Servicios (Mecánico/a o Calefactor/a, Ebanista, Carpintero/a, Electricista, Albañil, Pintor/a, Conductor/a, Fontanero/a, Jardinero/a)' },
  // NIVEL III-B (solo sector catering)
  { nivel: 'III-B', nombre: 'Ayudante de Equipo de Catering (o Ayudante de Equipo)' },
  { nivel: 'III-B', nombre: 'Especialista de Mantenimiento y Servicios Técnicos de Catering: de flota y de instalaciones y edificios' },
  // NIVEL IV
  { nivel: 'IV', nombre: 'Ayudante de Recepción (o Intérprete, Conserje de Casino, Ayudante de Conserje, Ordenanza de Salón, Cobrador/a de Casinos)' },
  { nivel: 'IV', nombre: 'Ayudante Administrativo (o Oficial de Contabilidad, Oficial de 2ª, Auxiliar de Oficina y Contabilidad, Auxiliar de Caja)' },
  { nivel: 'IV', nombre: 'Telefonista (de 1ª y 2ª)' },
  { nivel: 'IV', nombre: 'Oficial/a de Segunda de Casinos' },
  { nivel: 'IV', nombre: 'Ayudante de Economato (o Ayudante de Economato y Bodega)' },
  { nivel: 'IV', nombre: 'Ayudante de Cocina (o Ayudante de Repostero/a, Oficial/a de Repostero/a)' },
  { nivel: 'IV', nombre: 'Preparador/a o Montador/a de Catering (o Preparador/a)' },
  { nivel: 'IV', nombre: 'Ayudante de Camarero/a (o Ayudante en Cafeterías, Dependiente de Segunda de Salas de Fiestas y Discotecas, Dependiente de Segunda en bares, Ayudante de Planchista, de Barman/Barwoman, de Cafetero/a)' },
  { nivel: 'IV', nombre: 'Ayudante de equipo de Catering' },
  { nivel: 'IV', nombre: 'Repartidor' },
  // NIVEL V
  { nivel: 'V', nombre: 'Portero/a, Aparcacoches, Portero/a de Coches, Recibidor/a de accesos y de servicios, Vigilante, Botones, Cobrador/a, Taquillero/a, Guardarropa, Auxiliar de Oficina, Auxiliar de Recepción, Auxiliar de Casinos, Aspirante de Casinos' },
  { nivel: 'V', nombre: 'Auxiliar de Cocina y Economato (o Marmitón, Pinche, Fregador/a, Mozo de Almacén, Personal de Platería)' },
  { nivel: 'V', nombre: 'Auxiliar de Preparación / Montaje de Catering' },
  { nivel: 'V', nombre: 'Auxiliar de Limpieza (o Personal de Limpieza, Fregador/a, Limpiador/a, Mozo de Lavandería)' },
  { nivel: 'V', nombre: 'Auxiliar de Mantenimiento y Servicios (o Ayudante de Mecánico/a o Calefactor/a, de Ebanista, de Carpintero/a, de Electricista, de Albañil y de Pintor/a, Lavacoches, Mozo de Billar o Salón de Recreo, Guarda Exterior)' }
]

/** Clasificación de establecimientos a efectos retributivos (Anexo I.B), resumida. */
const CLASES = {
  A: 'Clase A: restaurantes de cinco y cuatro tenedores, salones de banquetes, cafeterías de tres tazas, discotecas, salas de baile y de fiesta, casinos de 1ª y 2ª categoría',
  B: 'Clase B: restaurantes de tres tenedores, autoservicio, cafeterías de dos tazas, pubs y bares de copas, salones de juegos y recreativos, casinos de 3ª y 4ª categoría',
  C: 'Clase C: restaurantes de dos y un tenedor, cafeterías de una taza, chocolaterías, heladerías, cafés-bares, bares, tabernas, bodegas',
  D: 'Clase D: catering'
}

/*
 * Anexo I.C — Salarios base mensuales (euros). Clases A, B y C por nivel I, II-A, II-B, III, IV, V.
 * Catering (clase D) por nivel I, II-A, II-B, II-C, III-A, III-B, IV, V.
 */
const NIVELES_GENERAL = ['I', 'II-A', 'II-B', 'III', 'IV', 'V']
const NIVELES_CATERING = ['I', 'II-A', 'II-B', 'II-C', 'III-A', 'III-B', 'IV', 'V']

const tablaDe = (A, B, C, D) => ({
  A: Object.fromEntries(NIVELES_GENERAL.map((n, i) => [n, A[i]])),
  B: Object.fromEntries(NIVELES_GENERAL.map((n, i) => [n, B[i]])),
  C: Object.fromEntries(NIVELES_GENERAL.map((n, i) => [n, C[i]])),
  D: Object.fromEntries(NIVELES_CATERING.map((n, i) => [n, D[i]]))
})

const ANIOS = {
  // Anexo I.C.a). Efectos económicos desde el 1-7-2023 (art. 5): sin atrasos de enero a junio.
  2023: {
    salarioBaseMensual: tablaDe(
      [1296.22, 1205.79, 1190.73, 1175.67, 1115.37, 1055.09],
      [1251.02, 1183.2, 1160.56, 1145.52, 1085.21, 1024.92],
      [1145.52, 1115.37, 1100.29, 1062.61, 1032.44, 994.79],
      [1336.95, 1290.49, 1242.47, 1197.32, 1169.74, 1122.14, 1095.91, 1076.61]
    ),
    plusConvenio: 175.11, // art. 29
    manutencionMetalico: 52.95, // art. 28
    quebrantoMoneda: 51.51 // disp. trans. 3.ª
  },
  // Anexo I.C.b). Revisión del 5 % sobre 2023 desde el 1-1-2024 (art. 5).
  2024: {
    salarioBaseMensual: tablaDe(
      [1361.03, 1266.08, 1250.27, 1234.45, 1171.14, 1107.84],
      [1313.57, 1242.36, 1218.59, 1202.8, 1139.47, 1076.17],
      [1202.8, 1171.14, 1155.3, 1115.74, 1084.06, 1044.53],
      [1403.8, 1355.01, 1304.59, 1257.19, 1228.23, 1178.25, 1150.71, 1130.44]
    ),
    plusConvenio: 183.87,
    manutencionMetalico: 55.6,
    quebrantoMoneda: 54.09
  },
  // Anexo I.C.c). Revisión del 4 % sobre 2024 desde el 1-1-2025 (art. 5).
  2025: {
    salarioBaseMensual: tablaDe(
      [1415.47, 1316.72, 1300.28, 1283.83, 1217.99, 1152.15],
      [1366.11, 1292.05, 1267.33, 1250.91, 1185.05, 1119.22],
      [1250.91, 1217.99, 1201.51, 1160.37, 1127.42, 1086.31],
      [1459.95, 1409.21, 1356.77, 1307.48, 1277.36, 1225.38, 1196.74, 1175.66]
    ),
    plusConvenio: 191.22,
    manutencionMetalico: 57.82,
    quebrantoMoneda: 56.25
  }
}

const convenio = {
  id: 'hosteleria-madrid',
  nombre: 'Convenio Colectivo del Sector de Hostelería y Actividades Turísticas de la Comunidad de Madrid',
  codigo: '28002085011981',
  ambito: 'Comunidad de Madrid (art. 3). Restaurantes, bares, cafeterías, catering, discotecas y salas de fiesta, casinos y salones recreativos (art. 2).',
  fuente: {
    boletin: BOCM,
    url: 'https://www.ccoo-servicios.es/archivos/BOCM-20240406-Conv-hosteleria.pdf',
    urlBoletin: 'https://www.bocm.es/boletin/CM_Orden_BOCM/2024/04/06/BOCM-20240406-2.PDF',
    leidoEl: FECHA_DATOS
  },
  vigencia: { desde: '2023-01-01', hasta: '2025-12-31', prorrogaAutomatica: true }, // art. 5
  revisionSalarial: { 2023: 6, 2024: 5, 2025: 4 }, // % sobre el año anterior (art. 5)
  pagas: {
    numero: 14, // 12 mensualidades + 2 gratificaciones extraordinarias; el salario base se multiplica por 14 en la disp. trans. 1.ª
    extraordinarias: 'Se abonan el 20 de junio y el 20 de diciembre y se devengan por anualidades (art. 26)'
  },
  jornada: { horasAnuales: 1800, horasSemanales: 40, horasDiarias: 8 }, // art. 14.1
  pluses: {
    plusConvenio: {
      mesesAlAnio: 11, // nota de las tablas del Anexo I.C
      nota: 'Sustituye al extinto plus transporte (art. 29). Para quien empezó después del 15-6-2019 se devenga en proporción a la jornada y no se abona en vacaciones ni en las extraordinarias. El convenio no dice si es salarial o extrasalarial: comprueba cómo aparece en tu recibo.'
    },
    manutencion: {
      nota: 'Complemento salarial en especie (art. 28); a elección de la persona trabajadora se sustituye por la cantidad en metálico, salvo en establecimientos sin obligación de dar manutención (los que no elaboran comidas o no tienen servicio de restaurante).'
    },
    plusFormacion: {
      importeMensual: 20, // art. 31: solo si la empresa no acredita formación; no revisable
      nota: 'Plus compensatorio de formación (art. 31): 20 € al mes, de naturaleza salarial, solo si la empresa no acredita acciones de formación en el año anterior.'
    },
    permanencia: {
      nota: 'Complemento de permanencia (art. 30): una mensualidad (salario base más antigüedad consolidada) cada marzo para quien tenga 58 años o más y 10 de antigüedad en la empresa.'
    },
    quebrantoMoneda: {
      nota: 'Solo cajero/a y auxiliares de caja si deben suplir faltas de caja (disp. trans. 3.ª).'
    }
  },
  nocturnidad: {
    nota: 'Art. 27: de 22:00 a 0:00, el 1 % del salario base; de 0:00 a 8:00, el 25 %; con 5 o más horas entre las 22:00 y las 8:00 toda la jornada se paga como nocturna al 25 %. Valor por hora = salario base × porcentaje ÷ (4 × 40).'
  },
  clases: CLASES,
  niveles: { general: NIVELES_GENERAL, catering: NIVELES_CATERING },
  categorias: CATEGORIAS,
  anios: ANIOS
}

module.exports = { convenio, FECHA_DATOS }
