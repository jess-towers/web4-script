// preload.ts

import { contextBridge, ipcRenderer } from 'electron';

// Exponemos APIs específicas de Electron al proceso de renderizado (tu index.html)
// Esto asegura que tu UI no tenga acceso directo a todo Node.js o Electron,
// mejorando la seguridad.

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Envía el contenido del CSV al proceso principal para su procesamiento.
   * @param csvContent El contenido del archivo CSV como una cadena.
   */
  sendCsvContent: (csvContent: string) => {
    ipcRenderer.send('process-csv', csvContent);
  },

  /**
   * Escucha los mensajes de resultado del procesamiento del CSV desde el proceso principal.
   * @param callback Función a ejecutar cuando se recibe un resultado.
   * Recibe un objeto con { success: boolean, message: string, details?: string }.
   */
  onProcessingResult: (callback: (result: { success: boolean; message: string; details?: string }) => void) => {
    ipcRenderer.on('processing-result', (_event, result) => callback(result));
  },

  /**
   * Envía el contenido del HTML CSV (formato Banco) al proceso principal para su procesamiento.
   * @param htmlContent El contenido del archivo HTML CSV como una cadena.
   */
  sendHtmlCsvContent: (htmlContent: string) => {
    ipcRenderer.send('process-html-csv', htmlContent);
  },

  /**
   * Escucha los mensajes de resultado del procesamiento del HTML CSV desde el proceso principal.
   * @param callback Función a ejecutar cuando se recibe un resultado.
   * Recibe un objeto con { success: boolean, message: string, details?: string }.
   */
  onHtmlProcessingResult: (callback: (result: { success: boolean; message: string; details?: string }) => void) => {
    ipcRenderer.on('html-processing-result', (_event, result) => callback(result));
  }
});

