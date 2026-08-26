// main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import Store from 'electron-store';

// Cargar variables de entorno según el entorno de ejecución.
// Tiene que ocurrir ANTES de importar prisma-client, porque ese módulo instancia
// PrismaClient al cargarse y ahí ya lee DATABASE_URL. TypeScript conserva este
// orden al compilar (el require de abajo queda después de estas líneas).
const { loadEnv, describeDatabaseTarget } = require('./src/config/load-env');
const envInfo = loadEnv(app.isPackaged ? process.resourcesPath : undefined);

console.log(`[env] archivos leídos: ${envInfo.files.join(', ') || 'ninguno'}`);
console.log(`[env] base de datos destino: ${describeDatabaseTarget()}`);
if (envInfo.usingLocalOverride) {
  console.log('[env] usando .env.local — NO se está tocando la base de producción.');
}

import { prisma, disconnectPrisma } from './src/config/prisma-client'; // Usar la nueva configuración
import { processCsvData } from './src/utils/csv-aggregator'; // Tu lógica de agregación
import { processHtmlCsvData } from './src/utils/html-processor'; // Procesador HTML para archivos Banco
import { AggregatedDailySales } from './src/types/csv.types';
import { parseRapiXlsx, parseExpressXlsx, mergeSellerData } from './src/utils/xlsx-parser';

let mainWindow: BrowserWindow | null;

// Inicializar electron-store para persistencia de configuración
const store = new Store({
  defaults: {
    ignoredPdvsCsv: [] as number[],
    ignoredPdvsBanco: [] as number[],
  },
});

/**
 * @function createWindow
 * @description Crea la ventana principal de la aplicación Electron.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 650,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ruta al script preload compilado
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, 'src', 'icon', 'web4-icon.ico'),
    title: 'web4',
    // Eliminar la barra de menú
    autoHideMenuBar: true,
    // Ocultar completamente la barra de menú
    show: false
  });

  // Eliminar la barra de menú por completo
  mainWindow.setMenu(null);

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Mostrar la ventana cuando esté lista para evitar parpadeo
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // La conexión ya se maneja en prisma-client.ts
    console.log('Aplicación iniciada correctamente.');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    console.error('Error de Inicialización: No se pudo inicializar la aplicación. Por favor, verifica tu archivo .env y que la base de datos esté accesible.');
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await disconnectPrisma();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Manejo de Eventos IPC desde el Renderizador (UI) ---

/**
 * Handlers IPC para gestión de configuración de PDVs ignorados
 */
ipcMain.handle('get-ignored-pdvs-csv', () => {
  return store.get('ignoredPdvsCsv', []) as number[];
});

ipcMain.handle('set-ignored-pdvs-csv', (_event, pdvs: number[]) => {
  store.set('ignoredPdvsCsv', pdvs);
  return true;
});

ipcMain.handle('get-ignored-pdvs-banco', () => {
  return store.get('ignoredPdvsBanco', []) as number[];
});

ipcMain.handle('set-ignored-pdvs-banco', (_event, pdvs: number[]) => {
  store.set('ignoredPdvsBanco', pdvs);
  return true;
});

/**
 * @function handleProcessCsv
 * @description Maneja la petición de procesamiento de múltiples archivos CSV desde la UI.
 * Realiza la agregación de datos y la inserción transaccional en la BD.
 */
ipcMain.on('process-csv', async (event, files: { name: string; content: string }[]) => {
  console.log(`Received ${files.length} CSV file(s) for processing.`);

  let result: { success: boolean; message: string; details?: string } = {
    success: false,
    message: 'Ocurrió un error inesperado antes de la asignación del resultado.'
  };

  try {
    if (!files || files.length === 0) {
      result = {
        success: false,
        message: 'No se proporcionaron archivos para procesar.'
      };
      event.sender.send('processing-result', result);
      return;
    }

    // 1. Recuperar lista de PDVs ignorados
    const ignoredPdvs = store.get('ignoredPdvsCsv', []) as number[];
    const ignoredPdvsSet = new Set(ignoredPdvs);

    // 2. Procesar todos los archivos y consolidar datos
    const allAggregatedData: AggregatedDailySales[] = [];
    
    for (const file of files) {
      try {
        const fileData = await processCsvData(file.content, prisma, ignoredPdvsSet);
        allAggregatedData.push(...fileData);
        console.log(`File "${file.name}": Aggregated ${fileData.length} DailySales records.`);
      } catch (error: any) {
        throw new Error(`Error procesando archivo "${file.name}": ${error.message}`);
      }
    }

    if (allAggregatedData.length === 0) {
      result = {
        success: false,
        message: 'No se encontraron datos válidos para procesar en los archivos.'
      };
      event.sender.send('processing-result', result);
      return;
    }

    // 3. Validación de colisiones internas (duplicados dentro del lote)
    const internalDuplicates = new Map<string, number>();
    for (const data of allAggregatedData) {
      const key = `${data.pointOfSaleId}_${data.date.toISOString().split('T')[0]}`;
      internalDuplicates.set(key, (internalDuplicates.get(key) || 0) + 1);
    }
    
    const duplicateKeys = Array.from(internalDuplicates.entries())
      .filter(([_, count]) => count > 1)
      .map(([key, _]) => key);
    
    if (duplicateKeys.length > 0) {
      result = {
        success: false,
        message: `Error: Se encontraron combinaciones duplicadas de PDV + Fecha dentro de los archivos cargados:\n${duplicateKeys.map(k => k.replace('_', ' - ')).join('\n')}\n\nEl proceso ha sido cancelado.`
      };
      console.warn(result.message);
      event.sender.send('processing-result', result);
      return;
    }

    // 4. REGLA DE ORO: Validación de existencia de PDVs
    const uniquePoSIds = new Set(allAggregatedData.map(data => data.pointOfSaleId));
    const existingPoS = await prisma.pointOfSale.findMany({
      where: {
        pointNumberId: {
          in: Array.from(uniquePoSIds)
        }
      },
      select: {
        pointNumberId: true
      }
    });

    const existingPoSIds = new Set(existingPoS.map(pos => pos.pointNumberId));
    const nonExistingPoS = Array.from(uniquePoSIds).filter(id => !existingPoSIds.has(id));
    
    // Separar PDVs no existentes: los que están ignorados vs los que no
    const nonExistingNotIgnored = nonExistingPoS.filter(id => !ignoredPdvsSet.has(id));
    
    if (nonExistingNotIgnored.length > 0) {
      result = {
        success: false,
        message: `Error: Los siguientes PDVs no están registrados en la base de datos y no están en la lista de ignorados.\n\nNingún dato será insertado.`,
        details: nonExistingNotIgnored.join(', ')
      };
      console.warn(`PDVs no registrados: ${nonExistingNotIgnored.join(', ')}`);
      event.sender.send('processing-result', result);
      return;
    }

    // 5. Filtrar transacciones de PDVs ignorados (que no existen en BD)
    const filteredData = allAggregatedData.filter(data => {
      // Si existe en BD, se incluye (prioridad BD)
      if (existingPoSIds.has(data.pointOfSaleId)) {
        return true;
      }
      // Si no existe en BD pero está ignorado, se excluye
      if (ignoredPdvsSet.has(data.pointOfSaleId)) {
        return false;
      }
      // Este caso no debería ocurrir por la validación anterior, pero por seguridad
      return true;
    });

    if (filteredData.length === 0) {
      result = {
        success: false,
        message: 'Todos los datos fueron filtrados (PDVs ignorados o no válidos).'
      };
      event.sender.send('processing-result', result);
      return;
    }

    // 6. Verificar duplicados en BD
    const existing = await prisma.dailySales.findMany({
      where: {
        OR: filteredData.map(data => ({
          pointOfSaleId: data.pointOfSaleId,
          date: data.date,
        }))
      },
      select: { pointOfSaleId: true, date: true }
    });

    if (existing.length > 0) {
      const duplicados = existing.map(e => {
        const year = e.date.getUTCFullYear();
        const month = String(e.date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(e.date.getUTCDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        return `PV: ${e.pointOfSaleId}, Fecha: ${formattedDate}`;
      }).join(' | ');
      result = {
        success: false,
        message: `No se cargó nada. Ya existen resúmenes diarios para las siguientes combinaciones de Punto de Venta y Fecha:\n${duplicados}`
      };
      console.warn(result.message);
      event.sender.send('processing-result', result);
      return;
    }

    // 7. Insertar datos filtrados
    await prisma.dailySales.createMany({
      data: filteredData.map(data => ({
        pointOfSaleId: data.pointOfSaleId,
        date: data.date,
        totalTransactionsCount: data.totalTransactionsCount,
        validTransactionsCount: data.validTransactionsCount,
        qrSales: data.qrSales,
        debitSales: data.debitSales,
        creditSales: data.creditSales,
        trxSales: 0, // CSV no usa trxSales
        totalSales: data.totalSales,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      skipDuplicates: false,
    });

    const ignoredCount = allAggregatedData.length - filteredData.length;
    const ignoredMsg = ignoredCount > 0 ? ` Se ignoraron ${ignoredCount} registro(s) de PDVs en la lista de ignorados.` : '';
    
    result = { 
      success: true, 
      message: `Procesamiento completado con éxito. Se insertaron ${filteredData.length} resúmenes diarios de ${files.length} archivo(s).${ignoredMsg}` 
    };
    console.log('CSV processing and DB insert successful.');

  } catch (error: any) {
    console.error('Error durante el procesamiento del CSV o la operación de base de datos:', error);
    result = {
      success: false,
      message: `Error al procesar los archivos: ${error.message || 'Error desconocido.'}`
    };
  } finally {
    event.sender.send('processing-result', result);
  }
});

/**
 * @function handleProcessHtmlCsv
 * @description Maneja la petición de procesamiento de múltiples archivos HTML CSV (formato Banco) desde la UI.
 * Realiza validaciones estrictas y inserción transaccional atómica en la BD.
 */
ipcMain.on('process-html-csv', async (event, files: { name: string; content: string }[]) => {
  console.log(`Received ${files.length} HTML CSV file(s) for processing.`);

  let result: { success: boolean; message: string; details?: string } = {
    success: false,
    message: 'Ocurrió un error inesperado antes de la asignación del resultado.'
  };

  try {
    if (!files || files.length === 0) {
      result = {
        success: false,
        message: 'No se proporcionaron archivos para procesar.'
      };
      event.sender.send('html-processing-result', result);
      return;
    }

    // 1. Recuperar lista de PDVs ignorados
    const ignoredPdvs = store.get('ignoredPdvsBanco', []) as number[];
    const ignoredPdvsSet = new Set(ignoredPdvs);

    // 2. Procesar todos los archivos y consolidar datos
    const allAggregatedData: AggregatedDailySales[] = [];
    
    for (const file of files) {
      try {
        const fileData = await processHtmlCsvData(file.content, ignoredPdvsSet);
        allAggregatedData.push(...fileData);
        console.log(`File "${file.name}": Aggregated ${fileData.length} DailySales records from HTML.`);
      } catch (error: any) {
        throw new Error(`Error procesando archivo "${file.name}": ${error.message}`);
      }
    }

    if (allAggregatedData.length === 0) {
      result = {
        success: false,
        message: 'No se encontraron datos válidos para procesar en los archivos.'
      };
      event.sender.send('html-processing-result', result);
      return;
    }

    // 3. Validación de colisiones internas (duplicados dentro del lote)
    const internalDuplicates = new Map<string, number>();
    for (const data of allAggregatedData) {
      const key = `${data.pointOfSaleId}_${data.date.toISOString().split('T')[0]}`;
      internalDuplicates.set(key, (internalDuplicates.get(key) || 0) + 1);
    }
    
    const duplicateKeys = Array.from(internalDuplicates.entries())
      .filter(([_, count]) => count > 1)
      .map(([key, _]) => key);
    
    if (duplicateKeys.length > 0) {
      result = {
        success: false,
        message: `Error: Se encontraron combinaciones duplicadas de PDV + Fecha dentro de los archivos cargados:\n${duplicateKeys.map(k => k.replace('_', ' - ')).join('\n')}\n\nEl proceso ha sido cancelado.`
      };
      console.warn(result.message);
      event.sender.send('html-processing-result', result);
      return;
    }

    // 4. REGLA DE ORO: Validación de existencia de PDVs
    const uniquePoSIds = new Set(allAggregatedData.map(data => data.pointOfSaleId));
    const existingPoS = await prisma.pointOfSale.findMany({
      where: {
        pointNumberId: {
          in: Array.from(uniquePoSIds)
        }
      },
      select: {
        pointNumberId: true
      }
    });

    const existingPoSIds = new Set(existingPoS.map(pos => pos.pointNumberId));
    const nonExistingPoS = Array.from(uniquePoSIds).filter(id => !existingPoSIds.has(id));
    
    // Separar PDVs no existentes: los que están ignorados vs los que no
    const nonExistingNotIgnored = nonExistingPoS.filter(id => !ignoredPdvsSet.has(id));
    
    if (nonExistingNotIgnored.length > 0) {
      result = {
        success: false,
        message: `Error: Los siguientes PDVs no están registrados en la base de datos y no están en la lista de ignorados.\n\nNingún dato será insertado.`,
        details: nonExistingNotIgnored.join(', ')
      };
      console.warn(`PDVs no registrados: ${nonExistingNotIgnored.join(', ')}`);
      event.sender.send('html-processing-result', result);
      return;
    }

    // 5. Filtrar transacciones de PDVs ignorados (que no existen en BD)
    const filteredData = allAggregatedData.filter(data => {
      // Si existe en BD, se incluye (prioridad BD)
      if (existingPoSIds.has(data.pointOfSaleId)) {
        return true;
      }
      // Si no existe en BD pero está ignorado, se excluye
      if (ignoredPdvsSet.has(data.pointOfSaleId)) {
        return false;
      }
      // Este caso no debería ocurrir por la validación anterior, pero por seguridad
      return true;
    });

    if (filteredData.length === 0) {
      result = {
        success: false,
        message: 'Todos los datos fueron filtrados (PDVs ignorados o no válidos).'
      };
      event.sender.send('html-processing-result', result);
      return;
    }

    // 6. Verificar duplicados en BD
    const existing = await prisma.dailySales.findMany({
      where: {
        OR: filteredData.map(data => ({
          pointOfSaleId: data.pointOfSaleId,
          date: data.date,
        }))
      },
      select: { pointOfSaleId: true, date: true }
    });

    if (existing.length > 0) {
      const duplicados = existing.map(e => {
        const year = e.date.getUTCFullYear();
        const month = String(e.date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(e.date.getUTCDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        return `PDV: ${e.pointOfSaleId}, Fecha: ${formattedDate}`;
      }).join(' | ');
      result = {
        success: false,
        message: `Error: Ya existen registros en la base de datos para las siguientes combinaciones de PDV y Fecha:\n${duplicados}\n\nEl proceso ha sido cancelado para evitar duplicados.`
      };
      console.warn(result.message);
      event.sender.send('html-processing-result', result);
      return;
    }

    // 7. INSERCIÓN ATÓMICA (All-or-Nothing) usando transacción
    await prisma.$transaction(
      async (tx) => {
        await tx.dailySales.createMany({
          data: filteredData.map(data => ({
            pointOfSaleId: data.pointOfSaleId,
            date: data.date,
            totalTransactionsCount: data.totalTransactionsCount,
            validTransactionsCount: data.validTransactionsCount,
            qrSales: data.qrSales,
            debitSales: data.debitSales,
            creditSales: data.creditSales,
            trxSales: (data as any).trxSales || 0, // Nueva columna para transferencias
            totalSales: data.totalSales,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          skipDuplicates: false,
        });
      },
      {
        maxWait: 30000,
        timeout: 60000,
      }
    );

    const ignoredCount = allAggregatedData.length - filteredData.length;
    const ignoredMsg = ignoredCount > 0 ? ` Se ignoraron ${ignoredCount} registro(s) de PDVs en la lista de ignorados.` : '';
    
    result = { 
      success: true, 
      message: `Procesamiento completado con éxito. Se insertaron ${filteredData.length} resúmenes diarios de ${files.length} archivo(s).${ignoredMsg}` 
    };
    console.log('HTML CSV processing and DB insert successful.');

  } catch (error: any) {
    console.error('Error durante el procesamiento del HTML CSV o la operación de base de datos:', error);
    result = {
      success: false,
      message: `Error al procesar los archivos: ${error.message || 'Error desconocido.'}`
    };
  } finally {
    event.sender.send('html-processing-result', result);
  }
});

/**
 * @function handleProcessSellersXlsx
 * @description Procesa 2 archivos XLSX (Rapi + Express), los combina por vendedor
 * y reemplaza por completo el snapshot en la tabla SellerSnapshot.
 */
ipcMain.on(
  'process-sellers-xlsx',
  async (
    event,
    files: { rapi: { name: string; content: string }; express: { name: string; content: string } },
  ) => {
    console.log('Received seller XLSX files for processing.');

    let result: { success: boolean; message: string; details?: string } = {
      success: false,
      message: 'Ocurrió un error inesperado.',
    };

    try {
      if (!files?.rapi?.content || !files?.express?.content) {
        result = { success: false, message: 'Se requieren ambos archivos (Rapi y Express).' };
        event.sender.send('sellers-processing-result', result);
        return;
      }

      // 1. Parsear archivos
      const rapiRows    = parseRapiXlsx(files.rapi.content);
      const expressRows = parseExpressXlsx(files.express.content);

      if (rapiRows.length === 0 && expressRows.length === 0) {
        result = { success: false, message: 'No se encontraron datos válidos en los archivos.' };
        event.sender.send('sellers-processing-result', result);
        return;
      }

      // 2. Combinar
      const rows = mergeSellerData(rapiRows, expressRows);

      // 3. Reemplazar snapshot: truncar + insertar en bloque
      await prisma.$transaction(async (tx) => {
        await tx.sellerSnapshot.deleteMany({});
        await tx.sellerSnapshot.createMany({ data: rows });
      });

      result = {
        success: true,
        message: `Vendedores actualizados correctamente. ${rapiRows.length} vendedor(es) de Rapi, ${expressRows.length} de Express. Total de filas insertadas: ${rows.length}.`,
      };
      console.log('Seller XLSX processing successful.');

    } catch (error: any) {
      console.error('Error durante el procesamiento de vendedores:', error);
      result = {
        success: false,
        message: `Error al procesar los archivos: ${error.message || 'Error desconocido.'}`,
      };
    } finally {
      event.sender.send('sellers-processing-result', result);
    }
  },
);