/**
 * AsistenteIA.jsx - Chatbot fiscal especializado
 * Base de conocimiento local con respuestas a preguntas frecuentes
 *
 * @see ../utils/fiscalidad2025.js - Base de conocimiento fiscal
 */
'use client'

import { useState, useEffect } from 'react'
import { baseConocimiento } from '../utils/fiscalidad2025'
import './AsistenteIA.css'

/**
 * AsistenteIA - Chatbot fiscal especializado
 * Base de conocimiento local con respuestas a preguntas frecuentes
 */

const AsistenteIA = () => {
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState([
    { id: 1, tipo: 'assistant', contenido: '¡Hola! Soy el asistente fiscal de FinanzasClaras. ¿En qué puedo ayudarte hoy?' }
  ])
  const [noLeidas, setNoLeidas] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  // Procesar pregunta del usuario
  const procesarPregunta = (pregunta) => {
    setIsTyping(true)

    // Normalizar la pregunta
    const preguntaNormalizada = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // Buscar coincidencia en la base de conocimiento
    const coincidencia = baseConocimiento.find((item) =>
      preguntaNormalizada.includes(item.question.toLowerCase().replace(/\?/g, ''))
    )

    // Simular tiempo de respuesta
    setTimeout(() => {
      setIsTyping(false)

      if (coincidencia) {
        setHistorial([...historial, {
          id: Date.now(),
          tipo: 'assistant',
          contenido: coincidencia.answer
        }])
      } else {
        setHistorial([...historial, {
          id: Date.now() + 1,
          tipo: 'assistant',
          contenido: 'No he encontrado información específica sobre eso en mi base de conocimiento. Te sugiero visitar sede.agenciatributaria.gob.es para información oficial. ¿Quieres intentar con otra pregunta?'
        }])
      }
    }, 500)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!mensaje.trim()) return

    // Añadir mensaje del usuario
    setHistorial([...historial, {
      id: Date.now(),
      tipo: 'user',
      contenido: mensaje
    }])
    setMensaje('')

    // Procesar respuesta
    procesarPregunta(mensaje)
  }

  const chips = baseConocimiento.map((item) => ({
    pregunta: item.question.replace(/\?/g, ''),
    respuesta: item.answer
  }))

  return (
    <div className="ia-page">
      <div className="page-header">
        <h1>Asistente Fiscal IA</h1>
        <p>Pregúntame sobre impuestos, deducciones y planificación financiera</p>
      </div>

      <section className="chat-container">
        {historial.map((item) => (
          <div
            key={item.id}
            className={`message-bubble message-${item.tipo}`}
          >
            <p>{item.contenido}</p>
            <span className="message-time">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="message-bubble message-assistant">
            <div className="typing-indicator show">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </section>

      <section className="chips-container">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            className="chip"
            onClick={() => setMensaje(chip.pregunta + '?')}
          >
            {chip.pregunta}
          </button>
        ))}
      </section>

      <form className="input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="chat-input"
          placeholder="Escribe tu pregunta..."
        />
        <button type="submit" className="send-button">
          Enviar
        </button>
      </form>

      <section className="disclaimer">
        <p>
          <strong>Aviso legal:</strong> Las respuestas son informativas y no constituyen asesoramiento fiscal.
          Para consultas oficiales, visita la Sede Electrónica de la Agencia Tributaria.
        </p>
      </section>
    </div>
  )
}

export default AsistenteIA
