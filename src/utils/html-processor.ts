// src/utils/html-processor.ts

import { parseDocument } from 'htmlparser2';
import { AggregatedDailySales } from '../types/csv.types';

/**
 * @interface AggregatedDailySalesHtml
 * @description Extensión de AggregatedDailySales para incluir trxSales
 */
interface AggregatedDailySalesHtml extends AggregatedDailySales {
  trxSales: number;
}

/**
 * @interface HtmlTableRow
 * @description Representa una fila de la tabla HTML parseada
 */
interface HtmlTableRow {
  fecha: string;        // Columna B (índice 1): DD/MM/YYYY
  pdv: number;          // Columna E (índice 4): Número de Punto de Venta
  concepto: string;     // Columna F (índice 5): Concepto/Tipo
  monto: number;        // Columna H (índice 7): Monto como número
}

/**
 * @function parseDateString
 * @description Parsea una cadena de fecha en formato "DD/MM/YYYY" a un objeto Date.
 * @param dateString La cadena de fecha a parsear.
 * @returns Un objeto Date, o null si el parseo falla.
 */
function parseDateString(dateString: string): Date | null {
  if (!dateString || !dateString.trim()) return null;
  
  const parts = dateString.trim().split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const monthRaw = parseInt(parts[1], 10); // Mes original (1-12)
  const year = parseInt(parts[2], 10);
  
  // Validar que todos los valores sean números válidos
  if (isNaN(day) || isNaN(monthRaw) || isNaN(year)) return null;
  
  // Validar que el mes esté en el rango válido (1-12) ANTES de ajustar
  if (monthRaw < 1 || monthRaw > 12) return null;
  
  // Validar que el día esté en un rango razonable (1-31)
  if (day < 1 || day > 31) return null;
  
  // Validar que el año sea razonable (por ejemplo, entre 1900 y 2100)
  if (year < 1900 || year > 2100) return null;
  
  // Convertir mes a formato 0-indexado de JavaScript
  const month = monthRaw - 1;
  
  const parsedDate = new Date(year, month, day);
  
  // Validación final: verificar que la fecha creada sea válida
  // (esto captura casos como 31/02/2025 que se ajustarían incorrectamente)
  if (isNaN(parsedDate.getTime())) {
    return null;
  }
  
  // Verificar que la fecha parseada coincida con los valores originales
  // (esto previene que Date ajuste automáticamente fechas inválidas)
  if (parsedDate.getDate() !== day || parsedDate.getMonth() !== month || parsedDate.getFullYear() !== year) {
    return null;
  }
  
  return parsedDate;
}

/**
 * @function parseMonto
 * @description Parsea una cadena de monto (ej. "85926,02") a un número.
 * Reemplaza la coma por punto para que Number() lo interprete correctamente.
 * @param montoString La cadena de monto.
 * @returns El monto como número, o NaN si el parseo falla.
 */
function parseMonto(montoString: string): number {
  if (!montoString) return NaN;
  // Reemplaza la coma decimal por un punto y luego parsea a float.
  const cleaned = montoString.replace(',', '.');
  return parseFloat(cleaned);
}

/**
 * @function parsePdv
 * @description Parsea el número de punto de venta a entero.
 * @param pdvString La cadena del PDV.
 * @returns El PDV como número, o NaN si el parseo falla.
 */
function parsePdv(pdvString: string): number {
  if (!pdvString) return NaN;
  const cleaned = pdvString.trim();
  return parseInt(cleaned, 10);
}

/**
 * @function extractTextFromElement
 * @description Extrae el texto de un elemento HTML, incluyendo texto de nodos hijos.
 * @param element El elemento HTML.
 * @returns El texto extraído.
 */
function extractTextFromElement(element: any): string {
  if (!element) return '';
  
  if (element.type === 'text') {
    return element.data || '';
  }
  
  if (element.children && element.children.length > 0) {
    return element.children
      .map((child: any) => extractTextFromElement(child))
      .join('')
      .trim();
  }
  
  return '';
}

/**
 * @function processHtmlCsvData
 * @description Procesa el contenido HTML (tabla) y agrega datos por PV y fecha.
 * @param htmlContent El contenido HTML como string (contiene una tabla).
 * @returns Una Promesa que resuelve a un array de AggregatedDailySales listos para DB.
 * @throws {Error} Si hay errores de formato, parsing o agregación.
 */
export async function processHtmlCsvData(htmlContent: string): Promise<AggregatedDailySalesHtml[]> {
  const rows: HtmlTableRow[] = [];
  const aggregationMap = new Map<string, AggregatedDailySalesHtml>();

  // Parsear el HTML
  const document = parseDocument(htmlContent);
  
  // Buscar la tabla en el documento
  let tableElement: any = null;
  
  function findTable(element: any): any {
    if (!element) return null;
    
    if (element.name === 'table') {
      return element;
    }
    
    if (element.children) {
      for (const child of element.children) {
        const found = findTable(child);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  tableElement = findTable(document);
  
  if (!tableElement) {
    throw new Error('No se encontró ninguna tabla en el archivo HTML.');
  }

  // Extraer filas de la tabla
  const tableRows: any[] = [];
  
  function extractRows(element: any) {
    if (!element) return;
    
    if (element.name === 'tr') {
      tableRows.push(element);
    }
    
    if (element.children) {
      for (const child of element.children) {
        extractRows(child);
      }
    }
  }
  
  extractRows(tableElement);
  
  if (tableRows.length === 0) {
    throw new Error('La tabla no contiene filas de datos.');
  }

  // Procesar cada fila (saltando el header si existe)
  for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex];
    
    // Extraer celdas (td o th) - SOLO hijos directos para evitar incluir celdas de tablas anidadas
    const cells: any[] = [];
    
    // Solo procesar hijos directos de la fila, no descendientes profundos
    // Esto previene que se incluyan celdas de tablas anidadas que desplazarían los índices
    if (row.children && row.children.length > 0) {
      for (const child of row.children) {
        // Solo agregar si es una celda directa (td o th)
        if (child.name === 'td' || child.name === 'th') {
          cells.push(child);
        }
        // NO buscar recursivamente en hijos para evitar capturar celdas de tablas anidadas
      }
    }
    
    // Necesitamos al menos 8 columnas (índices 0-7, necesitamos 1, 4, 5, 7)
    if (cells.length < 8) {
      // Saltar filas que no tengan suficientes columnas (puede ser header o fila inválida)
      continue;
    }
    
    // Extraer texto de cada celda
    const cellTexts = cells.map(cell => extractTextFromElement(cell).trim());
    
    // Columna B (índice 1): Fecha
    const fechaString = cellTexts[1] || '';
    // Columna E (índice 4): PDV
    const pdvString = cellTexts[4] || '';
    // Columna F (índice 5): Concepto
    const concepto = cellTexts[5] || '';
    // Columna H (índice 7): Monto
    const montoString = cellTexts[7] || '';
    
    // Validar que tengamos datos mínimos
    if (!fechaString || !pdvString || !montoString) {
      continue; // Saltar filas incompletas
    }
    
    // Parsear valores
    const fecha = parseDateString(fechaString);
    const pdv = parsePdv(pdvString);
    const monto = parseMonto(montoString);
    
    // Validar que los valores parseados sean válidos
    if (!fecha || isNaN(pdv) || isNaN(monto)) {
      continue; // Saltar filas con datos inválidos
    }
    
    rows.push({
      fecha: fechaString,
      pdv,
      concepto: concepto.toUpperCase(),
      monto
    });
  }

  if (rows.length === 0) {
    throw new Error('No se encontraron filas válidas con datos en la tabla HTML.');
  }

  // Agregación de datos
  for (const row of rows) {
    const rawDate = parseDateString(row.fecha);
    if (!rawDate) continue;
    
    // Agrupación por día local
    const year = rawDate.getFullYear();
    const month = rawDate.getMonth();
    const day = rawDate.getDate();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const aggregationKey = `${row.pdv}_${dateKey}`;

    if (!aggregationMap.has(aggregationKey)) {
      // Creamos la fecha a medianoche local para la BD
      const dateForDb = new Date(year, month, day, 0, 0, 0, 0);
      aggregationMap.set(aggregationKey, {
        pointOfSaleId: row.pdv,
        date: dateForDb,
        totalTransactionsCount: 0,
        validTransactionsCount: 0,
        qrSales: 0,
        debitSales: 0,
        creditSales: 0, // Siempre 0 para este procesador
        trxSales: 0, // Nueva columna para transferencias
        totalSales: 0,
      });
    }

    const aggregated = aggregationMap.get(aggregationKey)!;
    aggregated.totalTransactionsCount++;
    aggregated.validTransactionsCount++; // Todas las transacciones se consideran válidas en este flujo

    // Clasificar según el concepto
    const conceptoUpper = row.concepto.toUpperCase();
    
    if (conceptoUpper.includes('OPERACION COBRO QR') || conceptoUpper.includes('QR MAX')) {
      aggregated.qrSales += row.monto;
      aggregated.totalSales += row.monto;
    } else if (conceptoUpper === 'OPERACION TARJETA DEBITO (PRISMA-WEB)') {
      aggregated.debitSales += row.monto;
      aggregated.totalSales += row.monto;
    } else if (conceptoUpper === 'OPERACION TRANSFERENCIA') {
      aggregated.trxSales += row.monto;
      aggregated.totalSales += row.monto;
    }
    // Si no coincide con ninguna categoría conocida, no se suma a ninguna categoría ni a totalSales
  }

  // Preparar resultado final
  const result: AggregatedDailySalesHtml[] = Array.from(aggregationMap.values()).map(data => {
    const qrSales = parseFloat(data.qrSales.toFixed(2));
    const debitSales = parseFloat(data.debitSales.toFixed(2));
    const trxSales = parseFloat(data.trxSales.toFixed(2));
    // Recalcular totalSales como suma exacta de las categorías
    const totalSales = parseFloat((qrSales + debitSales + trxSales).toFixed(2));
    
    return {
      ...data,
      qrSales,
      debitSales,
      creditSales: 0, // Siempre 0 para este procesador
      trxSales,
      totalSales,
    };
  });

  // Ordenar resultado
  result.sort((a, b) => {
    if (a.pointOfSaleId !== b.pointOfSaleId) {
      return a.pointOfSaleId - b.pointOfSaleId;
    }
    return a.date.getTime() - b.date.getTime();
  });

  return result;
}

