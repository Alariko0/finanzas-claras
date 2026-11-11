/**
 * API client para FinanzasClaras
 * Llama al servidor Express con el token de sesión de Supabase.
 *
 * Formato de respuesta del servidor:
 *   { success, message?, data?, errors?: [{ field, message }] }
 */

import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const MENSAJES_ESTADO = {
  400: 'Solicitud incorrecta',
  401: 'Sesión caducada. Inicia sesión de nuevo.',
  403: 'Acceso denegado',
  404: 'Recurso no encontrado',
  429: 'Demasiadas solicitudes. Espera unos minutos.',
  500: 'Error interno del servidor'
}

export class ApiError extends Error {
  constructor(mensaje, { status, errores = [] } = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.errores = errores
  }
}

const obtenerToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * fetch con token de sesión y manejo de errores unificado.
 * @param {string} endpoint - Ruta bajo /api
 * @param {Object} [options] - Opciones de fetch; body se serializa si es objeto
 * @param {Object} [config]
 * @param {boolean} [config.auth=true] - Adjuntar token si hay sesión
 */
export async function peticion(endpoint, options = {}, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  if (auth) {
    const token = await obtenerToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const body = options.body && typeof options.body === 'object'
    ? JSON.stringify(options.body)
    : options.body

  let response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers, body })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', { status: 0 })
  }

  const contenido = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && auth) {
      // Token inválido o caducado sin posibilidad de refresco: cerrar sesión
      await supabase.auth.signOut()
    }

    const mensaje = contenido.message || MENSAJES_ESTADO[response.status] || 'Error desconocido'
    throw new ApiError(mensaje, { status: response.status, errores: contenido.errors || [] })
  }

  return contenido
}

/**
 * Perfil del usuario autenticado
 */
export const perfil = {
  obtener: async () => (await peticion('/auth/profile')).data.perfil,

  /** @param {{nombre?: string, preferencias?: Object}} cambios */
  actualizar: async (cambios) =>
    (await peticion('/auth/profile', { method: 'PATCH', body: cambios })).data.perfil
}

/**
 * CRUD de cálculos guardados
 */
export const calculos = {
  /** @returns {Promise<{calculos: Array, total: number, page: number, limit: number}>} */
  listar: async ({ page = 1, limit = 20 } = {}) =>
    (await peticion(`/calculos?page=${page}&limit=${limit}`)).data,

  obtener: async (id) => (await peticion(`/calculos/${id}`)).data.calculo,

  /** @param {{tipo: string, titulo: string, datosEntrada: Object, resultado: Object}} datos */
  guardar: async (datos) =>
    (await peticion('/calculos', { method: 'POST', body: datos })).data.calculo,

  actualizar: async (id, datos) =>
    (await peticion(`/calculos/${id}`, { method: 'PUT', body: datos })).data.calculo,

  eliminar: async (id) => peticion(`/calculos/${id}`, { method: 'DELETE' })
}

/**
 * Calculadoras fiscales (públicas: no necesitan sesión). Devuelven `resultado`, que incluye
 * `fechaDatos` y `avisos`; si el régimen no está soportado trae `soportado: false` y `aviso`.
 */
const calcularFiscal = (ruta) => async (entrada, opciones = {}) =>
  (await peticion(`/fiscal/${ruta}`, { method: 'POST', body: entrada, ...opciones }, { auth: false })).data.resultado

export const fiscal = {
  irpf: calcularFiscal('irpf'),
  nomina: calcularFiscal('nomina'),
  ahorro: calcularFiscal('ahorro')
}

/**
 * Calculadoras de préstamos e hipotecas (públicas). `cuadro` devuelve cuota, TAE, filas y
 * resumen anual; `amortizacion` devuelve el efecto de amortizar por adelantado.
 */
const calcularPrestamo = (ruta) => async (entrada) =>
  (await peticion(`/prestamos/${ruta}`, { method: 'POST', body: entrada }, { auth: false })).data.resultado

export const prestamos = {
  cuadro: calcularPrestamo('cuadro'),
  amortizacion: calcularPrestamo('amortizacion')
}
