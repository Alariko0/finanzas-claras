/**
 * Base de conocimiento fiscal 2025 para AsistenteIA
 * Respuestas a preguntas frecuentes sobre fiscalidad en España
 */

export const baseConocimiento = [
  {
    question: "¿Cuándo es la declaración de la renta?",
    answer: `La campaña de la declaración de la renta se abre el 2 de febrero y cierra el 30 de junio del año siguiente a la obtención de los ingresos. Por ejemplo, por la renta 2025 podrás declarar desde el 2 de febrero hasta el 30 de junio de 2026.

Recuerda que la Agencia Tributaria envía una notificación individual cuando es obligatorio o voluntario declarar. Si no recibes ninguna, probablemente tu situación sea simple y no tengas obligación de declarar.`
  },
  {
    question: "¿Qué puedo deducirme como autónomo?",
    answer: `Como autónomo tienes varias deducciones disponibles:

1. **Gastos de la actividad económica**: Todos los gastos necesarios para tu negocio (material, desplazamientos, teléfono, etc.)
2. **Cotizaciones a la Seguridad Social**: Las cuotas de autónomos son 100% deducibles
3. **Intereses de préstamo hipotecario**: Si la vivienda es tu local profesional
4. **Formación profesional**: Hasta 1.500€ deducibles
5. **Deducción por ordenadores**: 20% del importe (hasta 1.200€)
6. **Deducción por software**: 20% de las licencias de programas informáticos

Además puedes amortizar la inversión en tu material y equipos de forma lineal.`
  },
  {
    question: "¿Cómo tributan las criptomonedas en España?",
    answer: `Las criptomonedas en España tributan en el IRPF como rendimientos de capital mobiliario.

**Reglas clave:**
- **Plusvalías**: Debes declarar las ganancias cuando vendes (precio venta - precio compra - comisiones)
- **Pérdidas**: Puedes compensar pérdidas con ganancias del mismo ejercicio o llevarlas a los 4 siguientes
- **Límite 600€**: Las ganancias inferiores a 600€ anuales no tienen retención obligatoria (pero igual hay que declarar)
- **Periodo de custodia**: El tiempo que conservas el activo no afecta a la tributación
- **Divisas**: Las ganancias en euros de operaciones con monedas extranjeras tributan al 19-47% según tu tramo

**Ejemplo**: Si compras Bitcoin a 30.000€ y lo vendes a 40.000€, tu plusvalía de 10.000€ tributa en tu declaración.`
  },
  {
    question: "¿Qué es el modelo 720?",
    answer: `El Modelo 720 es una declaración informativa que deben presentar los contribuyentes españoles que residan fuera de España y posean activos financieros en el extranjero.

**Obligados a presentar:**
- Residentes fiscales españoles viviendo en el extranjero
- Patrimoniales en el extranjero superiores a 50.000€
- Ingresos brutos en el extranjero superiores a 60.000€
- Devengados en el extranjero superiores a 500.000€

**Plazos:** Entre el 1 de marzo y el 30 de junio de cada año.

**Sanciones:** Desde 600€ (infracción leve) hasta 277.500€ en casos graves de ocultación de patrimonio en el extranjero.`
  },
  {
    question: "¿Me puedo deducir el alquiler?",
    answer: `Sí, pero solo en ciertos casos específicos:

**Deducción por alquiler (600€/año):**
- Debes tener menos de 35 años
- No ser propietario de vivienda
- Vivir en el piso de tus padres
- No tener posibilidad de acceder a vivienda con hipoteca
- No estar empadronado en propiedad

**Requisitos:**
- Contrato de alquiler en vigor
- Pago de alquiler documentado
- No superar el límite de 10.000€ de ingresos anuales (20.000€ en zonas tensionadas)

**Importante:** Esta deducción no se acumula con la por el alquiler temporal (para desplazamientos por trabajo).`
  },
  {
    question: "¿Qué es el IRPF?",
    answer: `El Impuesto sobre la Renta de las Personas Físicas (IRPF) es el impuesto que pagamos sobre nuestros ingresos anuales.

**¿Cómo funciona?**
El impuesto es progresivo: a más ingresos, más porcentaje. En 2025 los tramos estatales son:

| Base Imponible | Tipo Impositivo |
|----------------|-----------------|
| 0 - 12.450€    | 9,5%            |
| 12.450 - 20.200€ | 12%          |
| 20.200 - 35.200€ | 15%          |
| 35.200 - 60.000€ | 18,5%         |
| 60.000 - 300.000€ | 22,5%        |
| Más de 300.000€ | 24,5%          |

**La cuota liquida:** Es el impuesto real que pagas después de aplicar reducciones (seguridad social, rendimientos del trabajo, gastos médicos, etc.).

**Seguridad Social:** Las cotizaciones a la seguridad social también reducen el IRPF a pagar.`
  },
  {
    question: "¿Cuánto deduzco por la hipoteca?",
    answer: `Puedes deducir los intereses de tu hipoteca de hasta 1.200€/año (antes del 2026).

**Requisitos:**
- La vivienda sea tu residencia habitual
- Estés en el pago de los intereses
- Presentar la certificación de la entidad (cuota interestable)

**Ejemplo práctico:**
Si pagas 20.000€ en intereses al año:
- Puedes deducir 1.200€ (límite)
- Si tu tipo marginal es 25%, te ahorras 300€ en impuestos
- El rest 18.000€ son intereses personales de la deuda

**Además puedes deducir:**
- Comisiones por apertura y gestorías (primer año)
- Gastos notariales e impuestos de transmitencia
- Tasas de gestoría del préstamo`
  },
  {
    question: "¿Cómo calculo mi tramo IRPF?",
    answer: `Para saber en qué tramo estás y cuánto pagar:

**Pasos:**
1. Suma todos tus ingresos del año (salario, alquileres, intereses, etc.)
2. Resta las reducciones aplicables (SS, rentas familiares, etc.)
3. Aplica el impuesto progresivo por tramos
4. Resta las deducciones disponibles

**Ejemplo rápido:**
Con 40.000€ de rendimiento en Madrid:
- Tramo 0-12.450€: 12.450 × 9,5% = 1.182,75€
- Tramo 12.450-20.200€: 7.750 × 12% = 930€
- Tramo 20.200-35.200€: 15.000 × 15% = 2.250€
- Tramo 35.200-40.000€: 4.800 × 18,5% = 888€
Total: 5.250,75€

Restando reducciones (aprox. 1.500€ por SS), pagas ~3.750€ de IRPF.`
  },
  {
    question: "¿Qué es la retención del IRPF?",
    answer: `La retención es el impuesto que tu empleador retiene de tu nómina y paga directamente a Hacienda.

**Cálculo:**
Depende de tu base imponible anual y el porcentaje de retención estimado (18-22,5% según tramos).

**Problema común:**
- Si la retención es muy alta → recibes menos en nómina pero pagas menos al declarar
- Si la retención es muy baja → recibes más en nómina pero pagas más al declarar

**Solución:** Presenta una comunicación preventiva a tu empresa para ajustar la retención.`
  },
  {
    question: "¿Cómo declaro los ingresos en efectivo?",
    answer: `Los ingresos en efectivo se declaran igual que cualquier otro ingreso:

**Qué declarar:**
- Todos los ingresos sin importar el medio (efectivo, transferencia, tarjeta)
- Las ganancias por venta de activos (cripto, acciones, etc.)
- Los premios y herencias

**Recomendación:**
Mantén un registro de todas las transacciones (apps como Abacus, CoinTracker, o una hoja de cálculo).

**Recordatorio:**
La ocultación de ingresos puede derivar en sanciones de hasta el 150% del impuesto evadido.`
  },
  {
    question: "¿Puedo deducir gastos médicos?",
    answer: `Sí, puedes deducir gastos médicos personales y familiares hasta 1.500€:

**Gastos deducibles:**
- Medicamentos, prótesis, aparatos ortopédicos
- Consultas con especialistas
- Test y análisis médicos
- Tratamientos odontológicos
- Planes de dietas y nutrición

**Requisitos:**
- Que no estén cubiertos por tu póliza de salud
- Presentar los tickets y facturas
- Declarar en el apartado de reducciones por gastos

**Gastos familiares:**
Puedes deducir los gastos de tus padres si tienen más de 65 años o son tu hijos menores.`
  },
  {
    question: "¿Qué es la plusvalía municipal?",
    answer: `La plusvalía municipal es el impuesto sobre el incremento de valor del suelo y las mejoras de tu vivienda.

**Desde 2021:**
La Junta de Madrid (y otras comunidades) han eliminado este impuesto para las viviendas.

**Existe también:**
- **Plusvalía por venta de criptomonedas:** Tributa en el IRPF como plusvalía
- **Plusvalías por venta de acciones:** También en el IRPF

**Cuidado:** Algunas comunidades reintrodujeron el impuesto local. Verifica en tu comunidad autónoma.`
  },
  {
    question: "¿Cuánto deduzco por el colegio de mis hijos?",
    answer: `Puedes deducir los gastos de enseñanza de tus hijos hasta 1.500€:

**Gastos deducibles:**
- Matrícula y tasas de los colegios
- Cuota de comedor y transporte
- Material escolar
- Libros y útiles

**Limitaciones:**
- El centro debe estar autorizado por la comunidad
- Los gastos de los hermanos no pueden superar 6.000€
- Debes declarar la matrícula y los gastos

**Consejo:** Guarda todos los recibos y facturas. Sin documento válido, no hay deducción.`
  },
  {
    question: "¿Puedo deducir mi alquiler temporal?",
    answer: `Sí, pero solo si tu desplazamiento es por motivos de trabajo:

**Condiciones:**
- Debes estar contratado y no ser autónomo
- Los desplazamientos no pueden superar los 500 km
- Debes estar empadronado donde vives
- El desplazamiento debe ser por trabajo (no vacaciones)

**Cuota deducible:**
600€ anuales, pero proporcional al número de meses con alquiler temporal.

**Ejemplo:**
Si pagas 500€ al mes y vives 4 meses fuera:
- Deducción: 500€ × 4 = 2.000€
- Límite: 600€
- Deducible: 600€ (18% = 108€ de ahorro fiscal)`
  },
  {
    question: "¿Qué es el IRPH?",
    answer: `El IRPH (Indicador de Referencia de Préstamos Hipotecarios) es un tipo medio ponderado de las hipotecas variables.

**Cuidado con el IRPH:**
Las hipotecas con IRPH pueden tener una TAE muy superior al Euribor.

**Diferencia:**
- Euribor: Tipo base que sube y baja (3-4% actualmente)
- IRPH: Tipo fijo que se aplicó + Euribor (hasta 7-9% en algunos casos)

**Tu hipoteca puede tener:**
- TAE = Euribor + diferencial
- Algunos bancos usan IRPH que puede ser 1-2 puntos superior

**Revisa tu contrato:** Verifica si tu hipoteca usa Euribor o IRPH antes de hacer una tasación de la deuda.`
  }
];

export default baseConocimiento;
