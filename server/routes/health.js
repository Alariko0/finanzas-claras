/**
 * Health checks
 *
 * @route GET /health        - Liveness: el proceso responde
 * @route GET /health/ready  - Readiness: Supabase alcanzable (para balanceadores/orquestadores)
 */

const express = require('express')
const { leerConfig } = require('../config/supabase')

const router = express.Router()
const TIMEOUT_MS = 3000

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FinanzasClaras API está funcionando',
    timestamp: new Date().toISOString()
  })
})

router.get('/health/ready', async (req, res) => {
  try {
    const { url, publishableKey } = leerConfig()

    const respuesta = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })

    if (respuesta.status >= 500) {
      throw new Error(`Supabase respondió ${respuesta.status}`)
    }

    res.json({ status: 'ok', supabase: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Readiness fallido:', error.message)
    res.status(503).json({ status: 'degraded', supabase: 'error', timestamp: new Date().toISOString() })
  }
})

module.exports = router
