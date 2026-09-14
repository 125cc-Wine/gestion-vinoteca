// Costo de oportunidad de la plata inmovilizada en cta. cte. y cheques
// recibidos, usado por /financiero. La idea de fondo: un peso cobrado hoy no
// vale lo mismo que un peso cobrado el día de la venta — en el medio subió
// el nivel general de precios. Medimos esa pérdida de poder adquisitivo
// llevando cada cobro a "pesos de hoy" con el índice acumulado de inflación
// mensual (INDEC, sincronizado vía /api/inflacion/sync — ver ese archivo
// para la fuente).
//
// Esto es una corrección de UN solo factor (inflación). No modela lo que esa
// plata podría haber rendido invertida (una tasa de plazo fijo, por ejemplo,
// suele ganarle a la inflación en meses puntuales) — el usuario eligió medir
// específicamente pérdida de poder adquisitivo, no rendimiento alternativo.

export interface IndiceInflacionRow {
  mes: string // 'YYYY-MM-01' (o cualquier fecha parseable dentro del mes)
  valor_mensual: number // % mensual, ej 1.7 = 1.7%
}

interface Tramo {
  mesInicio: Date
  indiceInicio: number
  valorMensual: number
}

export interface IndiceAcumulado {
  tramos: Tramo[]
  ultimoMes: string | null // 'YYYY-MM' del último dato real cargado (para avisar en la UI)
}

// Ojo: NO usar `new Date(fechaIso)` acá — con un string 'YYYY-MM-DD' (sin
// hora) el motor lo interpreta como medianoche UTC, y en un server corriendo
// en una zona horaria negativa (ej. Argentina, UTC-3) eso cae en el DÍA
// ANTERIOR al leerlo con los getters locales (getFullYear/getMonth) — un mes
// entero se corría un mes para atrás en local. Parseamos año/mes a mano y
// construimos la fecha directo en horario local para no depender de en qué
// huso horario corre el proceso.
function primerDiaMes(fechaIso: string): Date {
  const [y, m] = fechaIso.slice(0, 7).split('-').map(Number)
  return new Date(y, m - 1, 1)
}

function mesSiguiente(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

function diasDelMes(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

// Arma el índice acumulado (base 100 en el primer mes con dato) a partir de
// la serie mensual. Los tramos quedan ordenados cronológicamente.
export function construirIndice(rows: IndiceInflacionRow[]): IndiceAcumulado {
  const sorted = [...rows]
    .map(r => ({ mesInicio: primerDiaMes(r.mes), valorMensual: r.valor_mensual }))
    .sort((a, b) => a.mesInicio.getTime() - b.mesInicio.getTime())

  let indice = 100
  const tramos: Tramo[] = []
  for (const r of sorted) {
    tramos.push({ mesInicio: r.mesInicio, indiceInicio: indice, valorMensual: r.valorMensual })
    indice *= 1 + r.valorMensual / 100
  }

  const ultimo = sorted[sorted.length - 1]
  const ultimoMes = ultimo ? `${ultimo.mesInicio.getFullYear()}-${String(ultimo.mesInicio.getMonth() + 1).padStart(2, '0')}` : null

  return { tramos, ultimoMes }
}

// Índice acumulado en una fecha cualquiera. Interpola dentro del mes
// (compounding exponencial suave, no lineal) y, para fechas más allá del
// último mes con dato real (el mes en curso, que INDEC todavía no publicó),
// extrapola mes a mes con el último valor mensual conocido — mejor una
// estimación razonable que no poder calcular nada para "hoy".
export function indiceEn(fecha: Date, acumulado: IndiceAcumulado): number {
  const { tramos } = acumulado
  if (tramos.length === 0) return 100
  if (fecha < tramos[0].mesInicio) return tramos[0].indiceInicio

  let tramo = tramos[0]
  for (const t of tramos) {
    if (t.mesInicio <= fecha) tramo = t
    else break
  }

  // Si "fecha" cae en un mes posterior al último con dato real, se extrapola
  // mes a mes con el último valor mensual conocido hasta alcanzar el mes de
  // "fecha".
  const ultimo = tramos[tramos.length - 1]
  if (fecha >= mesSiguiente(ultimo.mesInicio)) {
    let cursorMes = ultimo.mesInicio
    let indiceCursor = ultimo.indiceInicio
    while (mesSiguiente(cursorMes) <= fecha) {
      indiceCursor *= 1 + ultimo.valorMensual / 100
      cursorMes = mesSiguiente(cursorMes)
    }
    tramo = { mesInicio: cursorMes, indiceInicio: indiceCursor, valorMensual: ultimo.valorMensual }
  }

  const dias = diasDelMes(tramo.mesInicio)
  const diaDelMes = fecha.getDate() - 1 // 0-indexado: día 1 = fracción 0
  const fraccion = Math.min(1, Math.max(0, diaDelMes / dias))
  return tramo.indiceInicio * Math.pow(1 + tramo.valorMensual / 100, fraccion)
}

// Costo de oportunidad, en pesos de "fechaRef" (normalmente hoy), de haber
// cobrado $monto en "fechaCobro" en vez de en "fechaVenta". Si se cobró el
// mismo día (contado) da ~0; cuanto más tardó el cobro, más pesos "de hoy"
// se perdieron de poder adquisitivo entre medio. El monto nominal cobrado no
// cambia (acá no se factura interés por financiación) — lo que cambia es
// cuánto vale hoy ese mismo número de pesos según cuándo entraron.
export function costoOportunidad(monto: number, fechaVenta: Date, fechaCobro: Date, acumulado: IndiceAcumulado, fechaRef: Date): number {
  if (monto <= 0) return 0
  const iRef = indiceEn(fechaRef, acumulado)
  const iVenta = indiceEn(fechaVenta, acumulado)
  const iCobro = indiceEn(fechaCobro, acumulado)
  if (iVenta <= 0 || iCobro <= 0) return 0
  return monto * iRef * (1 / iVenta - 1 / iCobro)
}
