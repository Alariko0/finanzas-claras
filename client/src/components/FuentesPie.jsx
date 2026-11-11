import { Link } from 'react-router-dom'
import { FUENTES, PAGINAS } from '../utils/fuentes'
import './FuentesPie.css'

/**
 * FuentesPie - Letra pequeña con las fuentes usadas por el cálculo de una página.
 * Se alimenta de PAGINAS en utils/fuentes.js; el catálogo completo está en /fuentes.
 */

const FuentesPie = ({ pagina }) => {
  const config = PAGINAS[pagina]
  if (!config) return null

  return (
    <footer className="fuentes-pie" aria-label="Fuentes consultadas">
      <p className="fuentes-pie-titulo">Fuentes</p>
      <ul>
        {config.fuentes.map((id) => {
          const f = FUENTES[id]
          return (
            <li key={id}>
              {f.url ? (
                <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a>
              ) : (
                f.titulo
              )}
              {f.referencia && <span> ({f.referencia})</span>}
              {f.pdf && (
                <>
                  {' · '}
                  <a href={f.pdf} target="_blank" rel="noopener noreferrer">PDF</a>
                </>
              )}
              {' — '}
              {f.regula}
            </li>
          )
        })}
      </ul>
      <p className="fuentes-pie-nota">
        Los cálculos son estimaciones y no sustituyen el simulador oficial.{' '}
        <Link to="/fuentes">Ver todas las fuentes</Link>
      </p>
    </footer>
  )
}

export default FuentesPie
