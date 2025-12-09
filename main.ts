// main.ts

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';

// Cargar variables de entorno según el entorno de ejecución
if (app.isPackaged) {
  // En producción, cargar desde el directorio de recursos
  require('dotenv').config({ path: path.join(process.resourcesPath, '.env') });
} else {
  // En desarrollo, cargar desde la raíz del proyecto
  require('dotenv').config();
}

import { prisma, disconnectPrisma } from './src/config/prisma-client'; // Usar la nueva configuración
import { processCsvData } from './src/utils/csv-aggregator'; // Tu lógica de agregación
import { processHtmlCsvData } from './src/utils/html-processor'; // Procesador HTML para archivos Banco

let mainWindow: BrowserWindow | null;

/**
 * @function createWindow
 * @description Crea la ventana principal de la aplicación Electron.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ruta al script preload compilado
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, 'src', 'icon', 'Group-10.ico'),
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
    dialog.showErrorBox('Error de Inicialización', 'No se pudo inicializar la aplicación. Por favor, verifica tu archivo .env y que la base de datos esté accesible.');
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
 * @function handleProcessCsv
 * @description Maneja la petición de procesamiento de CSV desde la UI.
 * Realiza la agregación de datos y la inserción transaccional en la BD.
 */
ipcMain.on('process-csv', async (event, csvContent: string) => {
  console.log('Received CSV content for processing.');

  let result: { success: boolean; message: string; details?: string } = {
    success: false,
    message: 'Ocurrió un error inesperado antes de la asignación del resultado.'
  };

  try {
    const aggregatedData = await processCsvData(csvContent, prisma);
    console.log(`Aggregated ${aggregatedData.length} DailySales records.`);

    // 1. Verificar si ya existen registros para alguna combinación pointOfSaleId + date
    const existing = await prisma.dailySales.findMany({
      where: {
        OR: aggregatedData.map(data => ({
          pointOfSaleId: data.pointOfSaleId,
          date: data.date,
        }))
      },
      select: { pointOfSaleId: true, date: true }
    });


    //ACA ESTA EL ERROR DE FECHA DE DIA ANTERIOR!!
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
      if (mainWindow) {
        dialog.showErrorBox('Transacciones duplicadas', result.message);
      }
      event.sender.send('processing-result', result);
      return;
    }

    // 2. Si no hay duplicados, insertar normalmente
    for (const data of aggregatedData) {
      await prisma.dailySales.create({
        data: {
          pointOfSaleId: data.pointOfSaleId,
          date: data.date,
          totalTransactionsCount: data.totalTransactionsCount,
          validTransactionsCount: data.validTransactionsCount,
          qrSales: data.qrSales,
          debitSales: data.debitSales,
          creditSales: data.creditSales,
          totalSales: data.totalSales,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    result = { success: true, message: `Procesamiento completado con éxito. Se insertaron ${aggregatedData.length} resúmenes diarios.` };
    console.log('CSV processing and DB insert successful.');

  } catch (error: any) {
    console.error('Error durante el procesamiento del CSV o la operación de base de datos:', error);
    result = {
      success: false,
      message: `Error al procesar el CSV: ${error.message || 'Error desconocido.'}`,
      details: error.stack || 'No hay detalles de stack disponibles.'
    };
    if (mainWindow) {
        dialog.showErrorBox('Error de Procesamiento', result.message);
    }
  } finally {
    event.sender.send('processing-result', result);
  }
});

/**
 * @function handleProcessHtmlCsv
 * @description Maneja la petición de procesamiento de HTML CSV (formato Banco) desde la UI.
 * Realiza validaciones estrictas y inserción transaccional atómica en la BD.
 */
ipcMain.on('process-html-csv', async (event, htmlContent: string) => {
  console.log('Received HTML CSV content for processing.');

  let result: { success: boolean; message: string; details?: string } = {
    success: false,
    message: 'Ocurrió un error inesperado antes de la asignación del resultado.'
  };

  try {
    // Procesar el HTML y obtener datos agregados
    const aggregatedData = await processHtmlCsvData(htmlContent);
    console.log(`Aggregated ${aggregatedData.length} DailySales records from HTML.`);

    if (aggregatedData.length === 0) {
      result = {
        success: false,
        message: 'No se encontraron datos válidos para procesar en el archivo.'
      };
      event.sender.send('html-processing-result', result);
      return;
    }

    // VALIDACIÓN 1: Existencia de PDV (BLOQUEANTE)
    const uniquePoSIds = new Set(aggregatedData.map(data => data.pointOfSaleId));
    
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

    if (nonExistingPoS.length > 0) {
      result = {
        success: false,
        message: `Error: Los siguientes PDVs no están registrados: ${nonExistingPoS.join(', ')}. Ningún dato será insertado.`
      };
      console.warn(result.message);
      if (mainWindow) {
        dialog.showErrorBox('PDVs no registrados', result.message);
      }
      event.sender.send('html-processing-result', result);
      return;
    }

    // VALIDACIÓN 2: Duplicados (BLOQUEANTE)
    const existing = await prisma.dailySales.findMany({
      where: {
        OR: aggregatedData.map(data => ({
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
      if (mainWindow) {
        dialog.showErrorBox('Registros duplicados', result.message);
      }
      event.sender.send('html-processing-result', result);
      return;
    }

    // INSERCIÓN ATÓMICA (All-or-Nothing) usando transacción
    // Usamos createMany para mejor rendimiento y timeout extendido para grandes volúmenes
    await prisma.$transaction(
      async (tx) => {
        await tx.dailySales.createMany({
          data: aggregatedData.map(data => ({
            pointOfSaleId: data.pointOfSaleId,
            date: data.date,
            totalTransactionsCount: data.totalTransactionsCount,
            validTransactionsCount: data.validTransactionsCount,
            qrSales: data.qrSales,
            debitSales: data.debitSales,
            creditSales: 0, // Siempre 0 para este flujo
            trxSales: data.trxSales || 0, // Nueva columna para transferencias
            totalSales: data.totalSales,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          skipDuplicates: false, // No permitir duplicados (la validación ya se hizo arriba)
        });
      },
      {
        maxWait: 30000, // Esperar hasta 30 segundos para iniciar la transacción
        timeout: 60000, // Timeout de 60 segundos para completar la transacción
      }
    );

    result = { 
      success: true, 
      message: `Procesamiento completado con éxito. Se insertaron ${aggregatedData.length} resúmenes diarios.` 
    };
    console.log('HTML CSV processing and DB insert successful.');

  } catch (error: any) {
    console.error('Error durante el procesamiento del HTML CSV o la operación de base de datos:', error);
    result = {
      success: false,
      message: `Error al procesar el archivo: ${error.message || 'Error desconocido.'}`,
      details: error.stack || 'No hay detalles de stack disponibles.'
    };
    if (mainWindow) {
      dialog.showErrorBox('Error de Procesamiento', result.message);
    }
  } finally {
    event.sender.send('html-processing-result', result);
  }
});