/**
 * API client para FinanzasClaras
 * Funciones fetch hacia el servidor backend
 *
 * Arquitectura:
 * - auth/: Registro, Login, Perfil
 * - calculos/: CRUD de cálculos (IRPF, Nómina, etc.)
 * - gastos/: Gestión de gastos viaje
 * - hipotecas/: Simulador de hipotecas
 *
 * @see ../pages/* - Componentes que usan esta API
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const STORAGE_KEY = 'fc_token'

/**
 * Función de fetch con manejo de errores
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = obtenerToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Añadir token si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  // Manejo de errores
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})
    const errorMessages = {
      400: 'Solicitud incorrecta',
      401: 'No autorizado. Por favor, inicia sesión nuevamente.',
      403: 'Acceso denegado',
      404: 'Recurso no encontrado',
      409: 'El recurso ya existe',
      500: 'Error interno del servidor'
    }

    // Limpiar error para no mostrar a producción
    const safeError = errorData.error || errorMessages[response.status] || 'Error desconocido'

    // Log de error (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.error(`API Error ${response.status}:`, {
        endpoint,
        error: safeError,
        status: response.status
      })
    }

    throw new Error(safeError)
  }

  return response.json()
}

/**
 * Registro de usuario nuevo
 * @param {Object} datos - { nombre, email, password, rol }
 * @returns {Promise<Object>} Response del servidor
 */
export const auth = {
  /**
   * Registrar nuevo usuario
   * @param {Object} datos - Datos de registro
   * @returns {Promise<Object>} Resultado del registro
   */
  registro: async (datos) => {
    try {
      const response = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datos.nombre,
          email: datos.email,
          password: datos.password,
          rol: datos.rol || 'usuario'
        })
      })

      if (response.success) {
        // Guardar token en localStorage
        guardarToken(response.token)
      }

      return response

    } catch (error) {
      console.error('Error en registro:', error)
      throw error
    }
  },

  /**
   * Login y obtener token JWT
   * @param {Object} datos - { email, password }
   * @returns {Promise<Object>} Response con token
   */
  login: async (datos) => {
    try {
      const response = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: datos.email,
          password: datos.password
        })
      })

      if (response.success) {
        // Guardar token en localStorage
        guardarToken(response.token)

        // Guardar usuario para autocompletar
        localStorage.setItem('fc_usuario', JSON.stringify(response.usuario))
      }

      return response

    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  },

  /**
   * Obtener perfil de usuario
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Perfil de usuario
   */
  perfil: async (token) => {
    try {
      const response = await fetchWithAuth('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return response

    } catch (error) {
      console.error('Error obteniendo perfil:', error)
      throw error
    }
  }
}

/**
 * CRUD de cálculos
 */
export const calculos = {
  /**
   * Listar todos los cálculos del usuario
   * @param {string} token - Token JWT
   * @returns {Promise<Array>} Array de cálculos
   */
  listar: async (token) => {
    try {
      const response = await fetchWithAuth('/calculos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return response.calculos || []

    } catch (error) {
      console.error('Error listando cálculos:', error)
      throw error
    }
  },

  /**
   * Obtener un cálculo específico
   * @param {string} id - ID del cálculo
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Datos del cálculo
   */
  obtener: async (id, token) => {
    try {
      const response = await fetchWithAuth(`/calculos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return response.calculo

    } catch (error) {
      console.error('Error obteniendo cálculo:', error)
      throw error
    }
  },

  /**
   * Guardar nuevo cálculo
   * @param {Object} datos - { tipo, titulo, datosEntrada, resultado }
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Cálculo guardado
   */
  guardar: async (datos, token) => {
    try {
      const response = await fetchWithAuth('/calculos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      })

      return response.calculo

    } catch (error) {
      console.error('Error guardando cálculo:', error)
      throw error
    }
  },

  /**
   * Actualizar cálculo
   * @param {string} id - ID del cálculo
   * @param {Object} datos - Datos actualizados
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Cálculo actualizado
   */
  actualizar: async (id, datos, token) => {
    try {
      const response = await fetchWithAuth(`/calculos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      })

      return response.calculo

    } catch (error) {
      console.error('Error actualizando cálculo:', error)
      throw error
    }
  },

  /**
   * Eliminar cálculo
   * @param {string} id - ID del cálculo
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Mensaje de eliminación
   */
  eliminar: async (id, token) => {
    try {
      const response = await fetchWithAuth(`/calculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return response

    } catch (error) {
      console.error('Error eliminando cálculo:', error)
      throw error
    }
  }
}

/**
 * Gestión de notificaciones
 */
export const notificaciones = {
  /**
   * Obtener notificaciones
   * @param {string} token - Token JWT
   * @returns {Promise<Array>} Array de notificaciones
   */
  listar: async (token) => {
    try {
      const response = await fetchWithAuth('/notificaciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return response.alertas || []

    } catch (error) {
      console.error('Error obteniendo notificaciones:', error)
      throw error
    }
  },

  /**
   * Marcar notificación como leída
   * @param {string} id - ID de notificación
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Notificación actualizada
   */
  marcarLeida: async (id, token) => {
    try {
      const response = await fetchWithAuth(`/notificaciones/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      return response.alerta

    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
      throw error
    }
  }
}

/**
 * Guardar token JWT en localStorage
 * @param {string} token - Token JWT
 */
export const guardarToken = (token) => {
  if (token && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, token)
    } catch (error) {
      console.error('Error guardando token:', error)
    }
  }
}

/**
 * Obtener token del localStorage
 * @returns {string|null} Token JWT o null
 */
export const obtenerToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || null
  } catch (error) {
    console.error('Error obteniendo token:', error)
    return null
  }
}

/**
 * Eliminar token del localStorage (logout)
 */
export const eliminarToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error eliminando token:', error)
  }
}

/**
 * Obtener datos del usuario
 * @returns {Object|null} Datos del usuario o null
 */
export const obtenerUsuario = () => {
  try {
    const data = localStorage.getItem('fc_usuario')
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error)
    return null
  }
}

/**
 * Guardar datos del usuario
 * @param {Object} datos - Datos del usuario
 */
export const guardarUsuario = (datos) => {
  try {
    localStorage.setItem('fc_usuario', JSON.stringify(datos))
  } catch (error) {
    console.error('Error guardando datos del usuario:', error)
  }
}