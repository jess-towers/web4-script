    // C:\Users\ZefferX\Code\Tortuga-script-transactions\src\config\prisma-client.ts
    import { loadEnv, describeDatabaseTarget } from './load-env';

    // El orden de estas dos líneas NO es casual y no hay que invertirlo:
    // `@prisma/client` lee el archivo .env por su cuenta apenas se lo importa,
    // así que las variables tienen que estar cargadas antes. TypeScript conserva
    // el orden textual de los imports al compilar a CommonJS.
    // `loadEnv` es idempotente: si main.ts ya corrió, esta llamada no hace nada.
    loadEnv();

    import { PrismaClient } from '@prisma/client';

    // Este archivo simplemente inicializa y exporta una única instancia de PrismaClient.
    // Electron tiene múltiples procesos, y queremos que PrismaClient se inicialice
    // solo una vez y sea reutilizable en el proceso principal.
    export const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Manejo de errores de conexión
    prisma.$connect()
      .then(() => {
        // Se informa siempre el destino (sin credenciales): esta app escribe
        // directo en la base, y confundir la local con la de producción sale caro.
        console.log(`✅ Conexión establecida con la base: ${describeDatabaseTarget()}`);
      })
      .catch((error) => {
        console.error('❌ Error al conectar con la base de datos:', error);
      });

    // Función para desconectar de forma limpia
    export const disconnectPrisma = async () => {
      await prisma.$disconnect();
      console.log('🔌 Desconectado de la base de datos');
    };

    // Puedes añadir una función para desconectar si fuera necesario al cerrar la app
    // Sin embargo, PrismaClient gestiona las conexiones de forma eficiente por defecto.
    