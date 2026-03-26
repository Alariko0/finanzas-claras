# FinanzasClaras — Contexto del proyecto

App de calculadoras financieras para España. Stack MERN.
Diseño fuente de verdad: Stitch MCP (Project ID: 4378669069646525647)

Eres el lead developer de FinanzasClaras. El proyecto ya tiene código 
parcial generado. Tu misión es: auditar, corregir y completar la app 
hasta que esté lista para entregar a un cliente.

Lee primero README.md y CLAUDE.md antes de tocar nada.

═══════════════════════════════════════════════════
FASE 0 — AUDITORÍA Y CORRECCIÓN DE BUGS CRÍTICOS
═══════════════════════════════════════════════════

Corrige estos bugs en el orden indicado. Confirma cada uno al terminar.

## BUG 1 — Fuentes no cargan (client/index.html)
Elimina los @font-face locales de global.css que apuntan a /fonts/.
Añade en client/index.html dentro de <head>:
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
Y en global.css deja solo:
body { font-family: 'Inter', system-ui, sans-serif; }
h1,h2,h3,h4,h5,h6 { font-family: 'Manrope', system-ui, sans-serif; }

## BUG 2 — Typo crítico en IRPF.jsx
Busca todas las ocurrencias de "tramosCalculated" y cámbialas por
"tramosCalculados". Son 2 ocurrencias en el JSX del return.

## BUG 3 — Variable fuera de scope en IRPF.jsx
En la función calcularIRPF, el map final usa "tramoMinimo" como
variable del loop pero también como parámetro interno. Reescribe
el map así para evitar la colisión:

  tramosCalculados: Object.keys(tramosConfig).map((minStr, idx) => {
    const tramoMin = parseFloat(minStr)
    const tramo = tramosConfig[minStr]
    const siguiente = Object.keys(tramosConfig)[idx + 1]
    const limSup = tramo.max || Infinity
    const base = Math.max(0, Math.min(rendimiento, limSup) - tramoMin)
    return {
      rango: `${tramoMin.toLocaleString('es-ES')} - ${tramo.max ? tramo.max.toLocaleString('es-ES') : '∞'}`,
      base: Math.round(base),
      porc: tramo.porc,
      impuesto: Math.max(0, Math.round(base * tramo.porc / 100) - tramo.reduccion)
    }
  })

## BUG 4 — express-rate-limit falta en package.json del server
En server/package.json añade en dependencies:
"express-rate-limit": "^7.1.5"

## BUG 5 — CSS faltantes
Crea estos dos archivos vacíos con los estilos básicos de la página
siguiendo el patrón de SimuladorHipotecas.css:
- client/src/pages/SimuladorInmobiliaria.css
- client/src/pages/SimuladorMobiliaria.css

Cada uno con al menos: .inmobiliaria-page / .mobiliaria-page con
max-width: 1200px, margin: 0 auto, padding: var(--spacing-4)
y los selectores que ya se usan en sus respectivos JSX.

## BUG 6 — Middleware JWT mal colocado en auth.js
En server/routes/auth.js el middleware de autenticación está definido
DESPUÉS de las rutas GET /perfil, pero la ruta /perfil lo necesita.
Mueve el middleware ANTES de la ruta /perfil así:

1. POST /registro    (pública)
2. POST /login       (pública)
3. middleware JWT    (protege todo lo de abajo)
4. GET /perfil       (protegida)

═══════════════════════════════════════════════════
FASE 1 — VERIFICAR QUE ARRANCA
═══════════════════════════════════════════════════

Después de los bugs, ejecuta:
  cd client && npm install && npm run dev

Si hay errores de compilación, corrígelos antes de continuar.
El objetivo es que http://localhost:3000 cargue sin pantalla blanca.

Confirma con: "✅ FASE 0+1 completada. App arranca en localhost:3000"

═══════════════════════════════════════════════════
FASE 2 — PÁGINAS FALTANTES (las que App.jsx importa pero no existen)
═══════════════════════════════════════════════════

Crea estas 10 páginas. Usa el Design System Esmeralda Clarity del README
(colores --primary #00694c, Manrope+Inter, surface layers, sin bordes).
Cada página lleva su propio .css. Hazlas de 2 en 2 y confirma cada par.

## Par A
PlanJubilacion.jsx + PlanJubilacion.css
- Inputs: edad actual, edad jubilación, ahorro actual, aportación mensual,
  rentabilidad esperada (%)
- Cálculo: proyección con interés compuesto hasta la jubilación
- Resultado: capital acumulado, renta mensual estimada, años de cobertura
- Explicación en lenguaje humano al final

PlanPensiones.jsx + PlanPensiones.css
- Inputs: tipo de plan (individual, empresa, asociado), aportación anual,
  años hasta jubilación, rentabilidad esperada
- Cálculo: deducción fiscal IRPF por aportación (límite 1.500€/año 2025),
  capital acumulado, prestación estimada
- Muestra el ahorro fiscal real que supone cada euro aportado

## Par B
DashboardPatrimonio.jsx + DashboardPatrimonio.css
- Vista consolidada: suma de activos inmobiliarios + mobiliarios + cuentas
- Desglose por categoría con porcentaje del total
- Evolución simulada con gráfico de barras CSS puro
- Indicadores: patrimonio neto, rentabilidad media, flujo de caja mensual

SimuladorViajes.jsx + SimuladorViajes.css
- Añadir participantes del viaje (mínimo 2, máximo 10)
- Añadir gastos con quién pagó
- Calcular quién debe cuánto a quién (algoritmo de liquidación mínima)
- Soporte de porcentajes desiguales (ej: niños pagan 50%)
- Pestaña resumen con transferencias mínimas

## Par C
CrearCuenta.jsx + CrearCuenta.css
- Formulario: nombre, email, contraseña, confirmar contraseña
- Validación en tiempo real (email válido, contraseña mínimo 8 chars,
  mayúscula, número)
- Botón de envío que llama a POST /api/auth/registro
- Manejo de errores (email ya registrado, etc.)
- Link a login si ya tienes cuenta

ConfiguracionPerfil.jsx + ConfiguracionPerfil.css
- Secciones: datos personales, seguridad, módulos activos
- Formulario editable: nombre, email
- Cambio de contraseña con verificación de la actual
- Toggle para activar/desactivar módulos (hipotecas, inversión, viajes, jubilación)
- Guardado con feedback visual de éxito/error

## Par D
HistorialCalculos.jsx + HistorialCalculos.css
- Lista de cálculos guardados (mock data si no hay backend aún)
- Filtros por tipo: irpf, nómina, hipoteca, inversión, gastos
- Cada item muestra: tipo, fecha, resultado principal, botón "ver detalle"
- Estado vacío elegante cuando no hay cálculos
- Preparado para conectar con GET /api/calculos

PersonalizarModulos.jsx + PersonalizarModulos.css
- Grid de módulos disponibles con toggle on/off
- Cada módulo muestra: icono, nombre, descripción corta, estado
- Drag para reordenar (sin librerías, solo CSS order)
- Botón guardar que persiste en localStorage (Fase 2: API)

## Par E
Notificaciones.jsx + Notificaciones.css
- Lista de alertas fiscales y financieras
- Tipos: info (azul), advertencia (amber), urgente (rojo)
- Alertas de ejemplo: "Plazo declaración renta: 30 jun 2025",
  "Cambio tramos IRPF 2025", "Tu hipoteca variable sube 0.3%"
- Marcar como leída, eliminar
- Badge en Navbar con número de no leídas

AsistenteIA.jsx + AsistenteIA.css
- Interfaz de chat con burbujas (usuario derecha, asistente izquierda)
- Chips de preguntas frecuentes clicables:
  "¿Cuándo es la declaración de la renta?"
  "¿Qué puedo deducirme como autónomo?"
  "¿Cómo tributan las criptomonedas en España?"
  "¿Qué es el modelo 720?"
  "¿Me puedo deducir el alquiler?"
  "¿Qué es el IRPF?"
- Base de conocimiento local en utils/fiscalidad2025.js con respuestas
  a esas 6 preguntas mínimo (ampliar a 20)
- Input de texto para preguntas libres (busca en la base local,
  si no encuentra sugiere buscar en sede.agenciatributaria.gob.es)

═══════════════════════════════════════════════════
FASE 3 — PÁGINA DE INICIO (Dashboard)
═══════════════════════════════════════════════════

Reemplaza el placeholder de la ruta "/" en App.jsx con un componente
Inicio.jsx + Inicio.css que tenga:

- Hero con tagline: "Finanzas para personas reales en España"
- Grid de módulos disponibles con icono, nombre, descripción corta
  y estado (disponible / próximamente)
- Los disponibles son clicables y navegan a su ruta
- Sección "¿Qué puedo calcular hoy?" con accesos directos a las
  calculadoras más usadas

═══════════════════════════════════════════════════
FASE 4 — NAVBAR CON MENÚS DESPLEGABLES
═══════════════════════════════════════════════════

Reescribe Navbar.jsx con menús desplegables por categoría.
Sin librerías, solo CSS hover + estado React.

Categorías y sus rutas:
- Fiscal → /irpf, /nomina
- Gastos → /gastos, /gastos/presupuestos
- Hipotecas → /hipotecas, /hipotecas/prestamos, /hipotecas/amortizacion
- Inversión → /inversion, /inversion/inmobiliaria, /inversion/mobiliaria
- Jubilación → /jubilacion, /jubilacion/pensiones, /jubilacion/dashboard
- Viajes → /viajes
- Asistente → /ia
- Cuenta → /account, /account/perfil, /account/historial,
            /account/notificaciones, /account/modulos

Badge rojo en "Cuenta" cuando hay notificaciones no leídas.
Logo FinanzasClaras con punto verde a la izquierda.

═══════════════════════════════════════════════════
FASE 5 — REVISIÓN FISCAL: CORREGIR IRPF Y NÓMINA
═══════════════════════════════════════════════════

El IRPF.jsx actual tiene errores en los tramos (mezcla tipos estatales
y autonómicos incorrectamente) y la Nómina.jsx usa porcentajes
aproximados. Reescribe la lógica correctamente.

Crea client/src/utils/calcularIRPF.js con:
- Tramos IRPF estatal 2025 EXACTOS:
  0-12.450€: 9,5% | 12.450-20.200€: 12% | 20.200-35.200€: 15%
  35.200-60.000€: 18,5% | 60.000-300.000€: 22,5% | >300.000€: 24,5%
- Tramos autonómicos para: Madrid, Cataluña, Andalucía, Valencia,
  País Vasco, Galicia, otras (media nacional)
- Seguridad Social 2025: 4,70% contingencias + 1,55% desempleo + 0,10% formación
- Reducción por rendimientos del trabajo (hasta 5.565€ si renta < 16.825€)
- Mínimo personal: 5.550€ | por hijo: 2.400€ primer y segundo
- Función: calcularIRPF({ salarioBruto, comunidad, hijos, conyugeDependiente })
  → { salarioNeto, cuotaLiquida, seguridadSocial, netoMensual, netoCatorce,
      retencionPct, ssPct, baseLiquidable, desglosePorTramos }

Crea client/src/utils/calcularNomina.js con:
- Bases cotización SS 2025 por grupo profesional
- IRPF mensual correcto según tabla de retenciones oficiales
- Horas extra ordinarias (+75% sobre hora ordinaria) y festivas (+100%)
- Función: calcularNomina({ salarioBruto, categoria, horas, horasExtra })

Actualiza IRPF.jsx y Nomina.jsx para usar estas nuevas utils.

═══════════════════════════════════════════════════
FASE 6 — TESTS BÁSICOS
═══════════════════════════════════════════════════

Crea client/src/utils/calcularIRPF.test.js con estos casos reales:
- SMI 2025 (15.876€) Madrid soltero → neto esperado ~13.800€
- 30.000€ Cataluña soltero → neto esperado ~22.500€
- 60.000€ Madrid con 2 hijos → neto esperado ~41.000€
- 100.000€ País Vasco → neto esperado ~63.000€

Crea client/src/utils/calcularDeudas.test.js:
- 3 personas gastos iguales → transferencias mínimas correctas
- Porcentajes desiguales (50/30/20) → liquidación correcta
- Caso de 0 gastos → 0 transferencias

═══════════════════════════════════════════════════
FASE 7 — CONECTAR FRONTEND CON BACKEND
═══════════════════════════════════════════════════

Crea client/src/utils/api.js con funciones fetch hacia el servidor:

  const BASE = '/api'  // Vite proxy → localhost:3001

  export const auth = {
    registro: (datos) => fetch(`${BASE}/auth/registro`, ...),
    login: (datos) => fetch(`${BASE}/auth/login`, ...),
    perfil: (token) => fetch(`${BASE}/auth/perfil`, headers con Bearer)
  }

  export const calculos = {
    guardar: (datos, token) => ...,
    listar: (token) => ...,
    obtener: (id) => ...
  }

Conecta CrearCuenta.jsx y ConfiguracionPerfil.jsx con auth.registro
y auth.perfil. Guarda el JWT en localStorage con clave "fc_token".

═══════════════════════════════════════════════════
FASE 8 — PULIDO FINAL
═══════════════════════════════════════════════════

1. Responsive: comprueba que todas las páginas funcionan en 375px
   (móvil). Añade media queries donde falten.

2. Estados vacíos: todas las listas deben tener un mensaje elegante
   cuando no hay datos, nunca una lista vacía sin feedback.

3. Loading states: añade un indicador visual simple (spinner CSS puro)
   en los botones de calcular mientras se procesa.

4. Errores de validación: todos los inputs numéricos deben validar
   que el valor sea positivo y mostrar mensaje rojo si no lo es.

5. Actualiza README.md con:
   - Cómo instalar y arrancar (client + server por separado)
   - Lista de todas las rutas disponibles
   - Variables de entorno necesarias
   - Estado actual de cada módulo (✅ completo / 🔄 en progreso)

═══════════════════════════════════════════════════
REGLAS ABSOLUTAS — NO NEGOCIABLES
═══════════════════════════════════════════════════

- Colores SIEMPRE de las variables CSS de global.css, nunca hex directos
- Tipografía: Manrope para números y títulos, Inter para texto
- Sin Tailwind, Bootstrap ni ninguna librería de UI
- Sin bordes de 1px sólidos (usar tonal shifts o gaps)
- Sombras con rgba(25,28,29,0.06), nunca #000000
- Lógica de cálculo SIEMPRE en utils/, nunca inline en JSX
- Componentes funcionales con hooks, nunca clases React
- Comentarios en español
- Al terminar cada fase escribe exactamente:
  "✅ FASE N completada. Archivos: [lista]. ¿Continúo con Fase N+1?"

═══════════════════════════════════════════════════
LOG DE CORRECCIONES AUTOMÁTICO
═══════════════════════════════════════════════════

- Cada vez que se corrija un bug o fallo, añade un registro en auditoria/correcciones.txt con:

- Fecha y hora
- Nombre del archivo afectado
- Descripción breve del bug/fallo corregido
- Fase en la que se corrigió

- Ejemplo de línea:

2026-03-26 19:30 | IRPF.jsx | Corregido typo tramosCalculated → tramosCalculados | Fase 0

Claude debe usar este log para consultar qué bugs ya fueron corregidos y evitar repetir correcciones.

═══════════════════════════════════════════════════
BLOQUE SUGERIDO: GESTIÓN DE GIT / SINCRONIZACIÓN
═══════════════════════════════════════════════════

- GIT AUTOMÁTICO

- Cada vez que se complete un bug, una fase, o se creen/modifiquen archivos importantes:

- Añade los archivos modificados al stage:
- git add <archivos-modificados>
- Haz commit con un mensaje claro, usando el formato:
- [Fase X] Bug/Feature: breve descripción

Ejemplo:

[Fase 0] Bug: Corregido typo tramosCalculated → tramosCalculados en IRPF.jsx
Mantén una rama principal main sincronizada con origin/main. Cada vez que completes una fase, haz:
git push origin main
Si hay conflictos al hacer push o pull, resuélvelos antes de continuar.
Claude debe usar este flujo automáticamente, de forma que siempre haya un historial claro de commits y los cambios estén reflejados en GitHub.

Opcional: Para commits menores (como creación de CSS vacíos o tests), puede agruparlos en un commit de tipo “[Fase N] Setup archivos iniciales”.
