-- Add frequency to BudgetItem
ALTER TABLE "BudgetItem" ADD COLUMN "frequency" TEXT NOT NULL DEFAULT 'Monthly';

-- Add BSB and account number to BankAccount
ALTER TABLE "BankAccount" ADD COLUMN "bsb" TEXT;
ALTER TABLE "BankAccount" ADD COLUMN "accountNumber" TEXT;
