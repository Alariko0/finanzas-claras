# WORKFLOW DE DESARROLLO — FinanzasClaras
**Versión:** 1.0  
**Aplicable a:** Cualquier modelo o desarrollador que trabaje en este proyecto

---

## 1. Antes de tocar cualquier cosa

**Paso obligatorio — sin excepciones:**

1. Leer `CLAUDE.md` completo
2. Leer la tarea específica en `auditoria/ROADMAP.md`
3. Abrir y leer el archivo que se va a modificar (nunca asumir su contenido)
4. Verificar en `CLAUDE.md → Tareas Completadas` que la tarea no está ya hecha

Si hay conflicto entre lo que dice un archivo de código y lo que dice `CLAUDE.md`, `CLAUDE.md` tiene prioridad como fuente de verdad del estado del proyecto.

---

## 2. Ciclo de Trabajo (por tarea)

```
1. LEER    → Identificar la tarea en ROADMAP.md
2. ANALIZAR → Abrir y leer el archivo a modificar
3. PLANEAR  → Entender el cambio antes de escribir código
4. APLICAR  → Hacer el cambio mínimo necesario
5. VERIFICAR → Confirmar que compila y funciona
6. COMMIT   → Commit con formato correcto
7. ACTUALIZAR → Marcar tarea en ROADMAP.md y actualizar CLAUDE.md
```

### Regla de oro: cambios quirúrgicos

No reescribir lo que funciona. Si un componente tiene un bug en 3 líneas, corregir esas 3 líneas — no reescribir el componente completo.

Si la corrección requiere reescritura total (justificado), documentarlo en el commit y en `CLAUDE.md`.

---

## 3. Verificación Antes de Commit

**Frontend:**
```bash
cd client && npm run dev
```
- Sin errores de compilación en la consola
- La ruta que se modificó carga correctamente en el navegador
- Las rutas adyacentes no se han roto

**Backend:**
```bash
cd server && npm run dev
```
- El servidor arranca sin errores
- `GET http://localhost:3001/health` → 200

**Si alguna verificación falla, NO hacer commit. Corregir primero.**

---

## 4. Formato de Commits

### Tipos válidos

| Tipo | Cuándo usarlo |
|------|---------------|
| `[Fix]` | Corrección de un bug |
| `[Feature]` | Nueva funcionalidad |
| `[Refactor]` | Reestructuración sin cambio de funcionalidad |
| `[Docs]` | Solo cambios en documentación |
| `[Security]` | Correcciones de seguridad |
| `[Test]` | Añadir o corregir tests |
| `[Chore]` | Limpieza, dependencias, configuración |

### Formato

```
[Tipo] Descripción concisa en español (máx 72 caracteres)

Descripción opcional más larga si el cambio es complejo.
- Qué se cambió
- Por qué
- Qué se verificó
```

### Ejemplos correctos

```
[Fix] Corrige hooks useState fuera del componente en Inicio.jsx

[Fix] Añade import de Calculo en auth.js para evitar crash en /clean-calculations

[Security] Configura CORS con origen específico desde variable de entorno

[Feature] Navbar con menús desplegables por categoría

[Refactor] Extrae lógica de auth a controllers/authController.js
```

### Ejemplos incorrectos

```
fix bugs                          ← Sin tipo, demasiado vago
[Fix] Fixed the thing in the file ← En inglés, sin contexto
[Feature][Fix] Varias cosas       ← Un commit = una cosa
update                            ← Inútil como mensaje
```

### Commits por fase

Al completar una fase completa del ROADMAP:
```
[Fase 1] Completados todos los bugs críticos de compilación y arranque
```

---

## 5. Normas de Código

### Variables y nombres

- **Español** para variables, funciones, comentarios de negocio
- **Inglés** solo para nombres de archivos de configuración estándar (`.env`, `package.json`, etc.)
- No mezclar idiomas en el mismo archivo: si el archivo ya tiene todo en un idioma, mantenerlo

```javascript
// ✅ Correcto
const salarioBruto = 30000
const calcularCuotaLiquida = (base) => {...}
// Calcula el IRPF según los tramos de 2025

// ❌ Incorrecto
const grossSalary = 30000
const calculateNetQuota = (base) => {...}
```

### Lógica de cálculo

- **SIEMPRE en `client/src/utils/`** — nunca inline en JSX
- Los componentes JSX solo consumen resultados, no calculan
- Una función de util = una responsabilidad = un archivo o función bien nombrada

```javascript
// ✅ En utils/calcularIRPF.js
export const calcularIRPF = ({ salarioBruto, comunidad, hijos }) => {...}

// ✅ En IRPF.jsx
const resultado = calcularIRPF({ salarioBruto, comunidad, hijos })

// ❌ Nunca en IRPF.jsx
const cuota = salarioBruto * 0.095 // lógica inline en JSX
```

### Estilos

- **Variables CSS siempre** — nunca valores hex directos en CSS de componentes
- Los colores, radios, sombras y spacing vienen de `global.css`

```css
/* ✅ Correcto */
background: var(--surface-container-low);
border-radius: var(--radius-md);
box-shadow: var(--shadow-ambient);

/* ❌ Incorrecto */
background: #f3f4f5;
border-radius: 12px;
box-shadow: 0 8px 24px rgba(0,0,0,0.06);
```

### Componentes

- **Funcionales con hooks** — nunca clases React
- Props bien nombradas, en español si son de dominio, en inglés si son técnicas (`onClick`, `className`)
- Sin `PropTypes` por ahora (proyecto sin TypeScript, mantener consistencia)

### Sin duplicación

- Si el mismo bloque de JSX aparece en más de 2 lugares → crear componente
- Si la misma lógica aparece en más de 2 utils → extraer a función compartida
- Una sola fuente de verdad para datos de configuración (ej: tramos IRPF solo en `calcularIRPF.js`)

---

## 6. Control de Calidad

### Antes de marcar una tarea como completada

```
□ El archivo modificado está guardado
□ El frontend compila sin errores (npm run dev en client/)
□ El backend arranca sin errores (npm run dev en server/)
□ La funcionalidad específica que se corrigió funciona
□ Las funcionalidades adyacentes no están rotas
□ El código no tiene `console.log` de debug residuales
□ No hay `alert()` nuevos añadidos
□ El commit está hecho con formato correcto
□ ROADMAP.md tiene la tarea marcada como completada [ ] → [x]
□ CLAUDE.md está actualizado
```

### Al completar una fase

```
□ Todas las tareas de la fase marcadas como completadas
□ Las métricas de progreso en ROADMAP.md actualizadas
□ CLAUDE.md actualizado con el nuevo % de completitud
□ Commit de fase hecho
```

---

## 7. Manejo de Errores Inesperados

Si al corregir una tarea aparece un error nuevo no documentado:

1. **No ignorarlo** — detener el trabajo en la tarea original
2. **Documentarlo** en `CLAUDE.md → Bugs Conocidos` con el ID siguiente disponible
3. **Evaluar si bloquea** la tarea actual o puede posponerse
4. **Si bloquea:** añadirlo al ROADMAP en la fase correspondiente y resolverlo primero
5. **Si no bloquea:** continuar con la tarea original, el nuevo bug queda documentado

---

## 8. Flujo de Trabajo para Modelos de IA

Específico para Claude Code, Qwen, u otros modelos que trabajen en este proyecto:

### Al iniciar una sesión de trabajo

```
1. Leer CLAUDE.md (estado actual, bugs conocidos, decisiones)
2. Leer auditoria/ROADMAP.md (tareas pendientes)
3. Identificar la próxima tarea pendiente por prioridad de fase
4. NO asumir el contenido de ningún archivo — leer antes de modificar
```

### Al terminar una sesión de trabajo

```
1. Commit de todos los cambios con mensajes descriptivos
2. Actualizar CLAUDE.md:
   - Mover tareas completadas a "Tareas Completadas"
   - Actualizar "Último estado"
   - Actualizar "Última actualización" con fecha
3. Actualizar ROADMAP.md:
   - Marcar tareas [x]
   - Actualizar métricas de progreso
4. Si se tomaron decisiones técnicas: documentarlas en CLAUDE.md
```

### Qué NO hacer nunca

- No reescribir archivos completos cuando solo se necesita un cambio quirúrgico
- No ignorar errores de compilación y continuar con otras tareas
- No añadir dependencias npm sin documentarlas
- No cambiar el design system (colores, tipografía) sin actualizar `global.css`
- No crear archivos duplicados de lógica de cálculo
- No hacer commits sin mensaje descriptivo
