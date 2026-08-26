// src/config/load-env.ts
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

/**
 * @file load-env.ts
 * @description Carga de variables de entorno para la aplicación, en un solo lugar.
 *
 * Existe para resolver un problema concreto: esta app escribe con Prisma DIRECTO
 * contra la base, sin pasar por ninguna API. Con un único archivo `.env` apuntando
 * a producción, ejecutarla desde consola para probar cargaba transacciones en la
 * base real.
 *
 * En desarrollo se leen dos archivos, en este orden:
 *
 *   1. `.env.local`  → tu base local. Está en .gitignore y NO se empaqueta.
 *   2. `.env`        → producción. Solo aporta lo que falte.
 *
 * `.env.local` se carga con `override: true` a propósito, y esto NO es opcional:
 * `@prisma/client` lee el `.env` por su cuenta en el momento en que se lo importa,
 * antes de que este loader llegue a correr. Como `dotenv` nunca pisa una variable
 * ya definida, sin `override` la URL de producción quedaba fija y `.env.local` no
 * tenía ningún efecto —fallando en silencio, que es el peor resultado posible—.
 *
 * En la app empaquetada se ignora `.env.local` a propósito y se lee únicamente el
 * `.env` que electron-builder copia a los recursos del instalador.
 */

let alreadyLoaded = false;

export interface LoadedEnv {
  /** Rutas de los archivos que efectivamente se leyeron, en orden de precedencia. */
  files: string[];
  /** true si la configuración vino de `.env.local` (es decir, apunta a tu base local). */
  usingLocalOverride: boolean;
}

let lastResult: LoadedEnv = { files: [], usingLocalOverride: false };

/**
 * Carga las variables de entorno. Es idempotente: llamarla más de una vez no
 * vuelve a leer los archivos ni cambia lo ya cargado.
 *
 * @param resourcesPath Presente solo en la app empaquetada (`process.resourcesPath`).
 */
export function loadEnv(resourcesPath?: string): LoadedEnv {
  if (alreadyLoaded) return lastResult;
  alreadyLoaded = true;

  const files: string[] = [];
  let usingLocalOverride = false;

  if (resourcesPath) {
    // App instalada: el único .env válido es el que viaja dentro del paquete.
    const packagedEnv = path.join(resourcesPath, '.env');
    if (fs.existsSync(packagedEnv)) {
      dotenv.config({ path: packagedEnv });
      files.push(packagedEnv);
    }
  } else {
    // Desarrollo: .env.local pisa (override), .env solo completa lo que falte.
    const localEnv = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(localEnv)) {
      dotenv.config({ path: localEnv, override: true });
      files.push(localEnv);
      usingLocalOverride = true;
    }

    const baseEnv = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(baseEnv)) {
      dotenv.config({ path: baseEnv });
      files.push(baseEnv);
    }
  }

  lastResult = { files, usingLocalOverride };
  return lastResult;
}

/**
 * Devuelve el destino de la conexión en forma legible y SIN credenciales, para
 * poder mostrar siempre contra qué base se está trabajando.
 */
export function describeDatabaseTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return 'DATABASE_URL no definida';

  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, '') || '(sin nombre)';
    const port = parsed.port ? `:${parsed.port}` : '';
    return `${parsed.hostname}${port}/${database}`;
  } catch {
    return 'DATABASE_URL con formato no reconocido';
  }
}
