// preload.ts

import { contextBridge, ipcRenderer } from 'electron';

// Exponemos APIs específicas de Electron al proceso de renderizado (tu index.html)
// Esto asegura que tu UI no tenga acceso directo a todo Node.js o Electron,
// mejorando la seguridad.

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Envía el contenido de múltiples archivos CSV al proceso principal para su procesamiento.
   * @param files Array de objetos con { name: string, content: string }.
   */
  sendCsvContent: (files: { name: string; content: string }[]) => {
    ipcRenderer.send('process-csv', files);
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
   * Envía el contenido de múltiples archivos HTML CSV (formato Banco) al proceso principal para su procesamiento.
   * @param files Array de objetos con { name: string, content: string }.
   */
  sendHtmlCsvContent: (files: { name: string; content: string }[]) => {
    ipcRenderer.send('process-html-csv', files);
  },

  /**
   * Escucha los mensajes de resultado del procesamiento del HTML CSV desde el proceso principal.
   * @param callback Función a ejecutar cuando se recibe un resultado.
   * Recibe un objeto con { success: boolean, message: string, details?: string }.
   */
  onHtmlProcessingResult: (callback: (result: { success: boolean; message: string; details?: string }) => void) => {
    ipcRenderer.on('html-processing-result', (_event, result) => callback(result));
  },

  /**
   * Obtiene la lista de PDVs ignorados para Carga Bind.
   * @returns Promise que resuelve a un array de números.
   */
  getIgnoredPdvsCsv: (): Promise<number[]> => {
    return ipcRenderer.invoke('get-ignored-pdvs-csv');
  },

  /**
   * Guarda la lista de PDVs ignorados para Carga Bind.
   * @param pdvs Array de números (PDVs a ignorar).
   * @returns Promise que resuelve a true si se guardó correctamente.
   */
  setIgnoredPdvsCsv: (pdvs: number[]): Promise<boolean> => {
    return ipcRenderer.invoke('set-ignored-pdvs-csv', pdvs);
  },

  /**
   * Obtiene la lista de PDVs ignorados para Carga SEAC.
   * @returns Promise que resuelve a un array de números.
   */
  getIgnoredPdvsBanco: (): Promise<number[]> => {
    return ipcRenderer.invoke('get-ignored-pdvs-banco');
  },

  /**
   * Guarda la lista de PDVs ignorados para Carga SEAC.
   * @param pdvs Array de números (PDVs a ignorar).
   * @returns Promise que resuelve a true si se guardó correctamente.
   */
  setIgnoredPdvsBanco: (pdvs: number[]): Promise<boolean> => {
    return ipcRenderer.invoke('set-ignored-pdvs-banco', pdvs);
  }
});

