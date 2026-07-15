import * as XLSX from 'xlsx';

// ─── Normalización ───────────────────────────────────────────────────────────

/**
 * Genera la clave de deduplicación: minúsculas, sin tildes, sin puntos, sin espacios extra.
 */
export function normalizeKey(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\./g, '');
}

/**
 * Convierte la clave normalizada a Title Case para almacenamiento en DB.
 */
function toDisplayName(name: string): string {
  return normalizeKey(name)
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface RapiRow {
  sellerName: string;
  comQr: number;
  comDebit: number;
  comTrx: number;
  comPrisma: number;
  comDepos: number;
  salesQr: number;
  salesDebit: number;
  salesTrx: number;
  salesPrisma: number;
  salesDepos: number;
}

export interface ExpressRow {
  sellerName: string;
  comQr: number;
  salesQr: number;
}

export interface MergedSellerRow {
  sellerName: string;
  provider: 'RAPI' | 'EXPRESS';
  comQr: number;
  comDebit: number;
  comTrx: number;
  comPrisma: number;
  comDepos: number;
  salesQr: number;
  salesDebit: number;
  salesTrx: number;
  salesPrisma: number;
  salesDepos: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toFloat(val: unknown): number {
  const n = parseFloat(String(val ?? '0').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/**
 * Busca el índice de una columna normalizando tanto los encabezados del archivo
 * como el nombre buscado (insensitive a tildes y mayúsculas).
 */
function findColIdx(headers: string[], needle: string): number {
  const needleNorm = normalizeKey(needle);
  return headers.findIndex((h) => normalizeKey(String(h ?? '')) === needleNorm);
}

/**
 * Busca el índice de una columna probando una lista de nombres candidatos en
 * orden (para tolerar variantes de encabezado entre distintas versiones del
 * archivo del proveedor). Devuelve el índice del primer candidato encontrado,
 * o -1 si ninguno matchea.
 */
function findColIdxAny(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = findColIdx(headers, candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

function isTotalsRow(rawName: string): boolean {
  const key = normalizeKey(rawName);
  return key === 'total' || key === 'totales';
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

/**
 * Parsea el archivo Rapi. Los encabezados están en la FILA 2 del Excel
 * (índice 1 en el array base-0 de sheet_to_json).
 * @param binaryContent - Contenido binario del .xlsx leído con FileReader.readAsBinaryString
 */
export function parseRapiXlsx(binaryContent: string): RapiRow[] {
  const wb = XLSX.read(binaryContent, { type: 'binary' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // raw = array de arrays; fila 0 = fila Excel 1 (puede ser título/logo), fila 1 = encabezados
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });

  if (raw.length < 3) return []; // sin datos

  const headers = (raw[1] as string[]).map(String);
  const dataRows = raw.slice(2);

  const iVendedor  = findColIdx(headers, 'Vendedor');
  const iComQr     = findColIdx(headers, 'Com. QR');
  const iComDebit  = findColIdx(headers, 'Com. Débito');
  const iComTrx    = findColIdx(headers, 'Com. TRX');
  const iComPrisma = findColIdx(headers, 'Com. Prisma');
  // "Depósitos" puede venir como "Com. Depósitos", "Com. Depós.", "Com. Depos.", etc.
  const iComDepos  = findColIdxAny(headers, ['Com. Depósitos', 'Com. Depós.', 'Com. Depos.']);

  const iSalesQr     = findColIdx(headers, 'Ventas QR');
  const iSalesDebit  = findColIdx(headers, 'Ventas DEB');
  const iSalesTrx    = findColIdx(headers, 'Ventas TRX');
  const iSalesPrisma = findColIdx(headers, 'Ventas Prisma');
  // El proveedor renombró esta columna a "Depós. Enviados"; se conservan los
  // nombres anteriores como fallback por compatibilidad con archivos viejos.
  const iSalesDepos  = findColIdxAny(headers, ['Depós. Enviados', 'Ventas Depós.', 'Ventas Depos.']);

  const missingColumns: string[] = [];
  if (iVendedor === -1) missingColumns.push('Vendedor');
  if (iComQr === -1) missingColumns.push('Com. QR');
  if (iComDebit === -1) missingColumns.push('Com. Débito');
  if (iComTrx === -1) missingColumns.push('Com. TRX');
  if (iComPrisma === -1) missingColumns.push('Com. Prisma');
  if (iComDepos === -1) missingColumns.push('Com. Depósitos');
  if (iSalesQr === -1) missingColumns.push('Ventas QR');
  if (iSalesDebit === -1) missingColumns.push('Ventas DEB');
  if (iSalesTrx === -1) missingColumns.push('Ventas TRX');
  if (iSalesPrisma === -1) missingColumns.push('Ventas Prisma');
  if (iSalesDepos === -1) missingColumns.push('Depós. Enviados');

  if (missingColumns.length > 0) {
    throw new Error(
      `Rapi: no se encontraron las siguientes columnas en la fila 2 de encabezados: ${missingColumns.join(', ')}.`,
    );
  }

  const results: RapiRow[] = [];
  const seenKeys = new Set<string>();
  const duplicateNames: string[] = [];

  for (const row of dataRows) {
    const arr = row as unknown[];
    const rawName = String(arr[iVendedor] ?? '').trim();
    if (!rawName) continue;
    if (isTotalsRow(rawName)) continue;

    const key = normalizeKey(rawName);
    if (seenKeys.has(key)) {
      duplicateNames.push(toDisplayName(rawName));
      continue;
    }
    seenKeys.add(key);

    results.push({
      sellerName: toDisplayName(rawName),
      comQr:      toFloat(iComQr     >= 0 ? arr[iComQr]     : 0),
      comDebit:   toFloat(iComDebit  >= 0 ? arr[iComDebit]  : 0),
      comTrx:     toFloat(iComTrx    >= 0 ? arr[iComTrx]    : 0),
      comPrisma:  toFloat(iComPrisma >= 0 ? arr[iComPrisma] : 0),
      comDepos:   toFloat(iComDepos  >= 0 ? arr[iComDepos]  : 0),
      salesQr:    toFloat(iSalesQr     >= 0 ? arr[iSalesQr]     : 0),
      salesDebit: toFloat(iSalesDebit  >= 0 ? arr[iSalesDebit]  : 0),
      salesTrx:   toFloat(iSalesTrx    >= 0 ? arr[iSalesTrx]    : 0),
      salesPrisma:toFloat(iSalesPrisma >= 0 ? arr[iSalesPrisma] : 0),
      salesDepos: toFloat(iSalesDepos  >= 0 ? arr[iSalesDepos]  : 0),
    });
  }

  if (duplicateNames.length > 0) {
    throw new Error(
      `El archivo Rapi contiene vendedores duplicados: ${duplicateNames.join(', ')}. Unifique los montos en el Excel antes de cargarlo.`,
    );
  }

  return results;
}

/**
 * Parsea el archivo Express. Los encabezados están en la FILA 1 (comportamiento normal).
 * @param binaryContent - Contenido binario del .xlsx leído con FileReader.readAsBinaryString
 */
export function parseExpressXlsx(binaryContent: string): ExpressRow[] {
  const wb = XLSX.read(binaryContent, { type: 'binary' });
  const ws = wb.Sheets[wb.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: 0 });

  if (rows.length === 0) return [];

  // Detectar nombres de columna normalizando
  const firstRow = rows[0];
  const colKeys = Object.keys(firstRow);

  const findKey = (needle: string) =>
    colKeys.find((k) => normalizeKey(k) === normalizeKey(needle)) ?? '';

  const kVendedor = findKey('Vendedor');
  const kComQr    = findKey('Total Comis QR');
  const kSalesQr  = findKey('Total Ventas QR');

  const missingColumns: string[] = [];
  if (!kVendedor) missingColumns.push('Vendedor');
  if (!kComQr) missingColumns.push('Total Comis QR');
  if (!kSalesQr) missingColumns.push('Total Ventas QR');

  if (missingColumns.length > 0) {
    throw new Error(
      `Express: no se encontraron las siguientes columnas en la fila 1 de encabezados: ${missingColumns.join(', ')}.`,
    );
  }

  const results: ExpressRow[] = [];
  const seenKeys = new Set<string>();
  const duplicateNames: string[] = [];

  for (const row of rows) {
    const rawName = String(row[kVendedor] ?? '').trim();
    if (!rawName) continue;
    if (isTotalsRow(rawName)) continue;

    const key = normalizeKey(rawName);
    if (seenKeys.has(key)) {
      duplicateNames.push(toDisplayName(rawName));
      continue;
    }
    seenKeys.add(key);

    results.push({
      sellerName: toDisplayName(rawName),
      comQr:   toFloat(kComQr   ? row[kComQr]   : 0),
      salesQr: toFloat(kSalesQr ? row[kSalesQr] : 0),
    });
  }

  if (duplicateNames.length > 0) {
    throw new Error(
      `El archivo Express contiene vendedores duplicados: ${duplicateNames.join(', ')}. Unifique los montos en el Excel antes de cargarlo.`,
    );
  }

  return results;
}

// ─── Merge ───────────────────────────────────────────────────────────────────

/**
 * Combina los arrays de Rapi y Express en un único array plano listo para
 * prisma.sellerSnapshot.createMany(). Un vendedor puede aparecer en ambas
 * fuentes → genera dos filas (una por proveedor). Si solo aparece en una, se
 * genera solo esa fila.
 */
export function mergeSellerData(
  rapiRows: RapiRow[],
  expressRows: ExpressRow[],
): MergedSellerRow[] {
  // Mapa de clave normalizada → display name canónico (prevalece Rapi)
  const displayNames = new Map<string, string>();

  for (const r of rapiRows) {
    displayNames.set(normalizeKey(r.sellerName), r.sellerName);
  }
  for (const e of expressRows) {
    const key = normalizeKey(e.sellerName);
    if (!displayNames.has(key)) displayNames.set(key, e.sellerName);
  }

  const result: MergedSellerRow[] = [];

  // Filas Rapi
  for (const r of rapiRows) {
    const displayName = displayNames.get(normalizeKey(r.sellerName)) ?? r.sellerName;
    result.push({
      sellerName:  displayName,
      provider:    'RAPI',
      comQr:       r.comQr,
      comDebit:    r.comDebit,
      comTrx:      r.comTrx,
      comPrisma:   r.comPrisma,
      comDepos:    r.comDepos,
      salesQr:     r.salesQr,
      salesDebit:  r.salesDebit,
      salesTrx:    r.salesTrx,
      salesPrisma: r.salesPrisma,
      salesDepos:  r.salesDepos,
    });
  }

  // Filas Express
  for (const e of expressRows) {
    const displayName = displayNames.get(normalizeKey(e.sellerName)) ?? e.sellerName;
    result.push({
      sellerName:  displayName,
      provider:    'EXPRESS',
      comQr:       e.comQr,
      comDebit:    0,
      comTrx:      0,
      comPrisma:   0,
      comDepos:    0,
      salesQr:     e.salesQr,
      salesDebit:  0,
      salesTrx:    0,
      salesPrisma: 0,
      salesDepos:  0,
    });
  }

  return result;
}
