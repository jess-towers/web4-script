    // C:\Users\ZefferX\Code\Tortuga-script-transactions\src\config\prisma-client.ts
    import { PrismaClient } from '@prisma/client';
    import dotenv from 'dotenv';

    // Cargar variables de entorno
    dotenv.config();

    // Este archivo simplemente inicializa y exporta una única instancia de PrismaClient.
    // Electron tiene múltiples procesos, y queremos que PrismaClient se inicialice
    // solo una vez y sea reutilizable en el proceso principal.
    export const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Manejo de errores de conexión
    prisma.$connect()
      .then(() => {
        console.log('✅ Conexión a la base de datos establecida correctamente');
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
    