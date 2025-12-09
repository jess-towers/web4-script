-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointOfSale" (
    "pointNumberId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointOfSale_pkey" PRIMARY KEY ("pointNumberId")
);

-- CreateTable
CREATE TABLE "DailySales" (
    "id" SERIAL NOT NULL,
    "pointOfSaleId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "totalTransactionsCount" INTEGER NOT NULL DEFAULT 0,
    "validTransactionsCount" INTEGER NOT NULL DEFAULT 0,
    "qrSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debitSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trxSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPointOfSale" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pointOfSaleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_pointNumberId_key" ON "PointOfSale"("pointNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "PointOfSale_name_key" ON "PointOfSale"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailySales_pointOfSaleId_date_key" ON "DailySales"("pointOfSaleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserPointOfSale_userId_pointOfSaleId_key" ON "UserPointOfSale"("userId", "pointOfSaleId");

-- AddForeignKey
ALTER TABLE "DailySales" ADD CONSTRAINT "DailySales_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("pointNumberId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointOfSale" ADD CONSTRAINT "UserPointOfSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPointOfSale" ADD CONSTRAINT "UserPointOfSale_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("pointNumberId") ON DELETE RESTRICT ON UPDATE CASCADE;
