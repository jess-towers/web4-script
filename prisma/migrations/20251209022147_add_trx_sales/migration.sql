-- AlterTable
-- Agregar la columna trxSales a la tabla DailySales existente
ALTER TABLE "DailySales" ADD COLUMN IF NOT EXISTS "trxSales" DOUBLE PRECISION NOT NULL DEFAULT 0;
