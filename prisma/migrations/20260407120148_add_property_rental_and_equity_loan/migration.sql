-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "equityLoanAnnualRate" DECIMAL(7,6),
ADD COLUMN     "equityLoanMonthlyPayment" DECIMAL(20,6),
ADD COLUMN     "equityLoanStartBalance" DECIMAL(20,6),
ADD COLUMN     "equityLoanStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PropertyIncomeEntry" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "grossRent" DECIMAL(20,6) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyIncomeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyExpenseEntry" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(20,6) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyExpenseEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyIncomeEntry" ADD CONSTRAINT "PropertyIncomeEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyExpenseEntry" ADD CONSTRAINT "PropertyExpenseEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
