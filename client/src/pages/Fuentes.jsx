/**
 * Fuentes.jsx - Todas las fuentes consultadas para el proyecto
 * Catálogo en utils/fuentes.js: enlace o PDF, qué regula y en qué páginas se usa.
 */

import { Link } from 'react-router-dom'
import { FUENTES, TEMAS, paginasDe } from '../utils/fuentes'
import './Fuentes.css'

const Fuentes = () => (
  <div className="fuentes-page">
    <div className="page-header">
      <h1>Fuentes</h1>
      <p className="page-subtitle">
        Normas y documentos oficiales de los que salen las cifras y las reglas de las calculadoras.
        Las cifras se leen de la fuente, no de memoria, y los resultados son estimaciones.
      </p>
    </div>

    {TEMAS.map((tema) => {
      const ids = Object.keys(FUENTES).filter((id) => FUENTES[id].tema === tema.clave)
      if (ids.length === 0) return null
      return (
        <section key={tema.clave} className="fuentes-tema">
          <h2>{tema.titulo}</h2>
          <ul className="fuentes-lista">
            {ids.map((id) => {
              const f = FUENTES[id]
              const usos = paginasDe(id)
              return (
                <li key={id} className="fuente-item">
                  <h3>{f.titulo}</h3>
                  {f.referencia && <p className="fuente-ref">{f.referencia}</p>}
                  <p className="fuente-regula">{f.regula}</p>
                  {f.nota && <p className="fuente-nota">{f.nota}</p>}
                  <p className="fuente-enlaces">
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noopener noreferrer">Abrir fuente</a>
                    ) : (
                      <span>Enlace pendiente</span>
                    )}
                    {f.pdf && (
                      <a href={f.pdf} target="_blank" rel="noopener noreferrer">PDF consolidado</a>
                    )}
                  </p>
                  {usos.length > 0 && (
                    <p className="fuente-usos">
                      Usada en:{' '}
                      {usos.map((p, i) => (
                        <span key={p.ruta}>
                          {i > 0 && ', '}
                          <Link to={p.ruta}>{p.nombre}</Link>
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )
    })}
  </div>
)

export default Fuentes
