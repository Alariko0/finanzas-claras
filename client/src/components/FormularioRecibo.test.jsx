import { describe, expect, test } from 'vitest'
import { renderToString } from 'react-dom/server'
import FormularioRecibo from './FormularioRecibo'
import { linea, reciboInicial } from '../utils/recibo'

// Render de humo: el formulario muestra las cinco partes del recibo y no se rompe con datos
const render = (form, extra = {}) =>
  renderToString(
    <FormularioRecibo form={form} setForm={() => {}} onGuardar={() => {}} onCancelar={() => {}} conSesion guardando={false} {...extra} />
  )

describe('FormularioRecibo', () => {
  test('muestra las partes del recibo de salarios', () => {
    const html = render(reciboInicial(2026, 3))
    for (const parte of ['Encabezado', 'Devengos', 'Deducciones', 'Líquido a percibir', 'Bases de cotización']) {
      expect(html).toContain(parte)
    }
    expect(html).toContain('Convenio colectivo')
    expect(html).toContain('Estatuto de los Trabajadores')
  })

  test('con conceptos escritos pinta sus líneas', () => {
    const f = reciboInicial(2026, 3)
    f.devengos.salarioBase = '2000'
    f.devengos.complementos = [linea('Antigüedad', '100')]
    const html = render(f)
    expect(html).toContain('Antigüedad')
  })

  test('sin sesión no se puede guardar y se avisa', () => {
    const html = render(reciboInicial(2026, 3), { conSesion: false })
    expect(html).toContain('Inicia sesión para guardar')
    expect(html).toMatch(/<button type="submit"[^>]*disabled/)
  })
})
