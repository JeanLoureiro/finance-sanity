-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "equityLoanPaymentFrequency" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "mortgagePaymentFrequency" TEXT NOT NULL DEFAULT 'monthly';
