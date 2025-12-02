// src/types/csv.types.ts

    /**
     * @interface RawCsvRow
     * @description Define la estructura de una fila individual tal como se lee directamente del archivo CSV.
     * Los nombres de las propiedades coinciden exactamente con los encabezados de las columnas del CSV.
     */
    export interface RawCsvRow {
        Id: string;
        Fecha: string; // Ej: "2/5/2025 17:25:53"
        Importe: string; // Ej: "11000,0000000" (coma como separador decimal)
        Entidad: string;
        EntidadCodigo: string;
        Comercio: string; // Ej: "C11682"
        CodigoComercioCaja: string;
        Sucursal: string;
        Estado: string; // Ej: "ACREDITADO", "DEVUELTA", "RECHAZADO"
        EstadoMotivo: string;
        ProcesadorDescripcion: string;
        Procesador: string;
        IdProcesador: string;
        Canal: string;
        MedioPagoId: string;
        MedioPagoDescripcion: string; // Ej: "Tarjetadebito", "Tarjetacredito", "Transf30"
        IdOrdenVentaQr: string;
        IdentificadorOrdenVenta: string;
        IdentificadorReferencia: string;
        CompradorCuenta: string;
      }
  
      /**
       * @interface AggregatedDailySales
       * @description Define la estructura de los datos de DailySales después de ser agregados
       * y validados desde el CSV, listos para ser insertados/actualizados en la base de datos.
       * Corresponde a un registro de DailySales por punto de venta y fecha.
       */
      export interface AggregatedDailySales {
        pointOfSaleId: number;
        date: Date; // Ya como objeto Date
        totalTransactionsCount: number;
        validTransactionsCount: number;
        qrSales: number;
        debitSales: number;
        creditSales: number;
        totalSales: number;
        // No incluimos createdAt y updatedAt aquí, ya que Prisma los manejará automáticamente.
      }
      