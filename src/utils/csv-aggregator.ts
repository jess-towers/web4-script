// src/utils/csv-aggregator.ts

import { parse, Parser } from 'csv-parse';
import { PrismaClient } from '@prisma/client'; // Importar PrismaClient para validación de PoS
import { RawCsvRow, AggregatedDailySales } from '../types/csv.types'; // Tus interfaces definidas

/**
 * @function parseDateString
 * @description Parsea una cadena de fecha y hora en formato "D/M/YYYY HH:MM:SS" a un objeto Date.
 * @param dateString La cadena de fecha a parsear.
 * @returns Un objeto Date, o null si el parseo falla.
 */
function parseDateString(dateString: string): Date | null {
  // Espera formato: "D/M/YYYY HH:mm[:ss]"
  if (!dateString) return null;
  const [datePart, timePart] = dateString.split(' ');
  if (!datePart || !timePart) return null;

  const dateParts = datePart.split('/').map(Number);
  if (dateParts.length !== 3) return null;
  const year = dateParts[2];
  const month = dateParts[1] - 1; // Meses son 0-indexados en JS
  const day = dateParts[0];

  // Parsea la parte de la hora (acepta HH:mm o HH:mm:ss)
  const timeParts = timePart.split(':').map(Number);
  if (timeParts.length < 2 || timeParts.length > 3) return null;
  const hours = timeParts[0];
  const minutes = timeParts[1];
  const seconds = timeParts.length === 3 ? timeParts[2] : 0;

  const parsedDate = new Date(year, month, day, hours, minutes, seconds);
  if (isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate;
}


/**
 * @function parseImporte
 * @description Parsea una cadena de importe (ej. "11000,0000000") a un número.
 * Reemplaza la coma por punto para que Number() lo interprete correctamente.
 * @param importeString La cadena de importe.
 * @returns El importe como número, o NaN si el parseo falla.
 */
function parseImporte(importeString: string): number {
  // Reemplaza la coma decimal por un punto y luego parsea a float.
  const cleaned = importeString.replace(',', '.');
  return parseFloat(cleaned);
}

/**
 * @function cleanComercioId
 * @description Limpia el ID de comercio eliminando el prefijo "C".
 * @param comercioIdString La cadena de ID de comercio (ej. "C12345").
 * @returns El ID de comercio como número.
 */
function cleanComercioId(comercioIdString: string): number | null {
  if (!comercioIdString) return null;
  // Elimina la 'C' inicial si existe, acepta cualquier cantidad de dígitos después
  const cleaned = comercioIdString.startsWith('C') ? comercioIdString.substring(1) : comercioIdString;
  const numId = parseInt(cleaned, 10);
  return isNaN(numId) ? null : numId;
}

/**
 * @function processCsvData
 * @description Procesa el contenido de un CSV, agrega transacciones por PV y fecha,
 * y las valida antes de la inserción en la base de datos.
 * @param csvContent El contenido del archivo CSV como una cadena.
 * @param prisma La instancia de PrismaClient para validaciones de BD.
 * @returns Una Promesa que resuelve a un array de AggregatedDailySales listos para DB.
 * @throws {Error} Si hay errores de formato, PVs inexistentes o fallos de agregación.
 */
export async function processCsvData(csvContent: string, prisma: PrismaClient): Promise<AggregatedDailySales[]> {
  const records: RawCsvRow[] = [];
  const aggregationMap = new Map<string, AggregatedDailySales>();
  const uniquePoSIdsInCsv = new Set<number>();
  const transactionIds = new Set<string>(); // Para detectar IDs de transacción duplicados

  let hasParsingError = false;

  await new Promise<void>((resolve, reject) => {
    // Inicializa el parser fuera del evento para poder referenciarlo
    const csvParser = parse(csvContent, { // MODIFICADO: Capturamos la instancia del parser
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // MODIFICADO: Tipamos 'this' explícitamente como 'Parser'
    csvParser
    .on('readable', function(this: Parser) { // <-- CAMBIO CLAVE AQUÍ: 'function(this: Parser)'
      let record: RawCsvRow;
      while ((record = this.read()) !== null) {
        records.push(record);
      }
    })
    .on('error', function(err) {
      hasParsingError = true;
      reject(new Error(`Error al parsear el CSV: ${err.message}`));
    })
    .on('end', function() {
      if (!hasParsingError) {
        resolve();
      }
    });
  });

  if (records.length === 0) {
    throw new Error('El archivo CSV está vacío o no contiene datos válidos después del parseo.');
  }

  // VALIDACIÓN 1: Verificar IDs de transacción duplicados en el CSV
  const duplicateTransactionIds: string[] = [];
  for (const row of records) {
    if (transactionIds.has(row.Id)) {
      duplicateTransactionIds.push(row.Id);
    } else {
      transactionIds.add(row.Id);
    }
  }
  if (duplicateTransactionIds.length > 0) {
    throw new Error(`Se encontraron IDs de transacción duplicados en el CSV: ${duplicateTransactionIds.join(', ')}. El proceso ha sido cancelado.`);
  }

  // VALIDACIÓN 2: Verificar formato de datos antes de procesar
  const invalidRows: string[] = [];
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNumber = i + 2; // +2 porque la primera fila es el header y los índices empiezan en 0
    
    // Validar formato del ID de comercio
    if (!row.Comercio || !row.Comercio.startsWith('C')) {
      invalidRows.push(`Fila ${rowNumber}: ID de comercio '${row.Comercio}' no tiene el formato correcto (debe empezar con 'C')`);
      continue;
    }
    
    // Validar que el importe sea numérico
    const importe = parseImporte(row.Importe);
    if (isNaN(importe)) {
      invalidRows.push(`Fila ${rowNumber}: Importe '${row.Importe}' no es un número válido`);
      continue;
    }
    
    // Validar formato de fecha
    const rawDate = parseDateString(row.Fecha);
    if (!rawDate) {
      invalidRows.push(`Fila ${rowNumber}: Fecha '${row.Fecha}' no tiene el formato correcto`);
      continue;
    }
  }
  
  if (invalidRows.length > 0) {
    throw new Error(`Se encontraron errores de formato en el CSV:\n${invalidRows.join('\n')}\n\nEl proceso ha sido cancelado.`);
  }

  // Primera pasada: Recopilar y agregar datos
  for (const row of records) {
    const rawPointOfSaleId = cleanComercioId(row.Comercio);
    const rawDate = parseDateString(row.Fecha);
    const importe = parseImporte(row.Importe);
    const estado = row.Estado.trim().toUpperCase(); // Limpiar y estandarizar

    // Validaciones básicas de la fila (ya validadas arriba, pero por seguridad)
    if (rawPointOfSaleId === null || isNaN(importe) || rawDate === null) {
      throw new Error(`Error de formato en fila: ID de Comercio '${row.Comercio}', Fecha '${row.Fecha}' o Importe '${row.Importe}' inválidos.`);
    }

    uniquePoSIdsInCsv.add(rawPointOfSaleId); // Recopilar todos los PVs únicos del CSV

    // Si la transacción no es ACREDITADO, se cuenta para totalTransactionsCount pero se ignora para las sumas de ventas.
    const isValidTransaction = estado === 'ACREDITADO';

    // Agrupación por día local, no UTC
    const year = rawDate.getFullYear();
    const month = rawDate.getMonth(); // OJO: getMonth() ya es 0-indexado
    const day = rawDate.getDate();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const aggregationKey = `${rawPointOfSaleId}_${dateKey}`;

    if (!aggregationMap.has(aggregationKey)) {
      // Creamos la fecha a medianoche local para la BD
      const dateForDb = new Date(year, month, day, 0, 0, 0, 0);
      aggregationMap.set(aggregationKey, {
        pointOfSaleId: rawPointOfSaleId,
        date: dateForDb, // Usar siempre medianoche local
        totalTransactionsCount: 0,
        validTransactionsCount: 0,
        qrSales: 0,
        debitSales: 0,
        creditSales: 0,
        totalSales: 0,
      });
    }

    const aggregated = aggregationMap.get(aggregationKey)!;
    aggregated.totalTransactionsCount++; // Siempre se incrementa

    if (isValidTransaction) {
      aggregated.validTransactionsCount++; // Solo si es válida
      const medioPago = row.MedioPagoDescripcion.trim().toLowerCase(); // Limpiar y estandarizar

      switch (medioPago) {
        case 'tarjetadebito':
          aggregated.debitSales += importe;
          break;
        case 'tarjetacredito':
          aggregated.creditSales += importe;
          break;
        case 'transf30': // Esto representa QR en tu caso
          aggregated.qrSales += importe;
          break;
        default:
          // Podrías lanzar un error aquí si un MedioPago no reconocido es crítico,
          // o simplemente ignorarlo si es aceptable que existan otros tipos.
          // Por ahora, lo ignoramos para las sumas de ventas, pero se cuenta en totalTransactionsCount.
          console.warn(`Medio de pago no reconocido para suma: ${row.MedioPagoDescripcion}. Transacción ignorada para desglose de ventas.`);
          break;
      }
      aggregated.totalSales += importe; // Total general de ventas acreditadas
    }
  }

  // VALIDACIÓN 3: Verificar que todos los Puntos de Venta existan en la BD
  if (uniquePoSIdsInCsv.size > 0) {
    const existingPoS = await prisma.pointOfSale.findMany({
      where: {
        pointNumberId: {
          in: Array.from(uniquePoSIdsInCsv)
        }
      },
      select: {
        pointNumberId: true
      }
    });

    const existingPoSIds = new Set(existingPoS.map(pos => pos.pointNumberId));
    const nonExistingPoS = Array.from(uniquePoSIdsInCsv).filter(id => !existingPoSIds.has(id));

    if (nonExistingPoS.length > 0) {
      throw new Error(`Los siguientes Puntos de Venta del CSV no existen en la base de datos: ${nonExistingPoS.join(', ')}. Ningún dato será insertado.`);
    }
  } else {
    // Esto solo ocurriría si el CSV no tiene datos o no tiene PVs válidos
    throw new Error('No se encontraron Puntos de Venta válidos en el archivo CSV para procesar.');
  }

  // VALIDACIÓN 4: Verificar que no existan registros duplicados en la BD
  const result: AggregatedDailySales[] = Array.from(aggregationMap.values()).map(data => ({
    ...data,
    qrSales: parseFloat(data.qrSales.toFixed(2)),
    debitSales: parseFloat(data.debitSales.toFixed(2)),
    creditSales: parseFloat(data.creditSales.toFixed(2)),
    totalSales: parseFloat(data.totalSales.toFixed(2)),
  }));

  // Verificar duplicados en la BD antes de insertar
  const existingRecords = await prisma.dailySales.findMany({
    where: {
      OR: result.map(data => ({
        pointOfSaleId: data.pointOfSaleId,
        date: data.date
      }))
    },
    select: {
      pointOfSaleId: true,
      date: true
    }
  });

  if (existingRecords.length > 0) {
    const duplicateDates = existingRecords.map(record => {
      const year = record.date.getUTCFullYear();
      const month = String(record.date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(record.date.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      return `${record.pointOfSaleId} - ${formattedDate}`;
    });
    throw new Error(`Se encontraron registros existentes en la base de datos para las siguientes fechas y puntos de venta:\n${duplicateDates.join('\n')}\n\nEl proceso ha sido cancelado para evitar duplicados.`);
  }

  result.sort((a, b) => {
    if (a.pointOfSaleId !== b.pointOfSaleId) {
      return a.pointOfSaleId - b.pointOfSaleId;
    }
    return a.date.getTime() - b.date.getTime();
  });

  return result;
}
