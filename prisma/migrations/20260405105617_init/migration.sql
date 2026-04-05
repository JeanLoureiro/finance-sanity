-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "salary" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "taxBracket" DECIMAL(5,4) NOT NULL DEFAULT 0.35,
    "dayOfMonthPaid" INTEGER NOT NULL DEFAULT 15,
    "salaryFrequency" TEXT NOT NULL DEFAULT 'Monthly',
    "netIncome" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "jobStartDate" TIMESTAMP(3),
    "includeSideIncomeInBudget" BOOLEAN NOT NULL DEFAULT true,
    "bankInterestRate" DECIMAL(7,6) NOT NULL DEFAULT 0.0604,
    "brokerage" DECIMAL(7,6) NOT NULL DEFAULT 0,
    "marketReturnRate" DECIMAL(7,6) NOT NULL DEFAULT 0,
    "etfAllocation" DECIMAL(5,4) NOT NULL DEFAULT 1,
    "stockAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cryptoAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cashAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "mfAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cashSavingsTarget" DECIMAL(20,6) NOT NULL DEFAULT 40000,
    "eoyGoal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "housePriceTarget" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "houseDepositPct" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "emergencyFundMonths" INTEGER NOT NULL DEFAULT 6,
    "cgtMethod" TEXT NOT NULL DEFAULT 'FIFO',
    "shortTermTaxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.32,
    "longTermTaxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.16,
    "cgtShowInLiabilities" BOOLEAN NOT NULL DEFAULT true,
    "includeMortgageInSavingsRate" BOOLEAN NOT NULL DEFAULT false,
    "coinmarketcapKey" TEXT,
    "cryptoPricingSource" TEXT NOT NULL DEFAULT 'CoinGecko',
    "yearOfBirth" INTEGER NOT NULL DEFAULT 1984,
    "inflationRate" DECIMAL(5,4) NOT NULL DEFAULT 0.03,
    "withdrawalRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "preservationAge" INTEGER NOT NULL DEFAULT 55,
    "superContribPct" DECIMAL(5,4) NOT NULL DEFAULT 0.115,
    "useBudget" BOOLEAN NOT NULL DEFAULT true,
    "useCash" BOOLEAN NOT NULL DEFAULT true,
    "useETFs" BOOLEAN NOT NULL DEFAULT true,
    "useStocks" BOOLEAN NOT NULL DEFAULT true,
    "useCrypto" BOOLEAN NOT NULL DEFAULT false,
    "useManagedFunds" BOOLEAN NOT NULL DEFAULT false,
    "useOtherAssets" BOOLEAN NOT NULL DEFAULT true,
    "useSideIncome" BOOLEAN NOT NULL DEFAULT true,
    "useProperty" BOOLEAN NOT NULL DEFAULT true,
    "useLiabilities" BOOLEAN NOT NULL DEFAULT false,
    "useCapitalGains" BOOLEAN NOT NULL DEFAULT true,
    "useFIRE" BOOLEAN NOT NULL DEFAULT true,
    "useSuper" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "balance" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ETFHolding" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "targetAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "managementFee" DECIMAL(7,6) NOT NULL DEFAULT 0,
    "location" TEXT,
    "pctUS" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "pctAsia" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "pctAus" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "sector" TEXT,
    "dividendFreqMonths" INTEGER,
    "drpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ETFHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ETFPurchase" (
    "id" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "brokerage" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "direction" TEXT NOT NULL DEFAULT 'BUY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ETFPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockHolding" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "targetAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "sector" TEXT,
    "dividendFreqMonths" INTEGER,
    "drpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPurchase" (
    "id" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "brokerage" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "direction" TEXT NOT NULL DEFAULT 'BUY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedFundHolding" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "targetAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "managementFee" DECIMAL(7,6) NOT NULL DEFAULT 0,
    "location" TEXT,
    "pctUS" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "pctAsia" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "pctAus" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "sector" TEXT,
    "dividendFreqMonths" INTEGER,
    "drpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedFundHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedFundPurchase" (
    "id" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "brokerage" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "direction" TEXT NOT NULL DEFAULT 'BUY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagedFundPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoHolding" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "targetAllocation" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CryptoHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoPurchase" (
    "id" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,6) NOT NULL,
    "brokerage" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "direction" TEXT NOT NULL DEFAULT 'BUY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherAsset" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "units" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "unitPurchasePrice" DECIMAL(20,6) NOT NULL,
    "liveUnitPrice" DECIMAL(20,6),
    "soldUnits" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "isPrimaryResidence" BOOLEAN NOT NULL DEFAULT false,
    "purchaseValue" DECIMAL(20,6) NOT NULL,
    "currentValue" DECIMAL(20,6) NOT NULL,
    "netRentProfit" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "mortgageStartDate" TIMESTAMP(3),
    "mortgageAnnualRate" DECIMAL(7,6),
    "mortgageMonthlyPayment" DECIMAL(20,6),
    "mortgageStartBalance" DECIMAL(20,6),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "interestFrequency" INTEGER NOT NULL DEFAULT 12,
    "annualRate" DECIMAL(7,6) NOT NULL,
    "regularPayment" DECIMAL(20,6) NOT NULL,
    "startingBalance" DECIMAL(20,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dividend" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "ticker" TEXT NOT NULL,
    "holdingType" TEXT NOT NULL,
    "exDividendDate" TIMESTAMP(3),
    "reinvested" BOOLEAN NOT NULL DEFAULT false,
    "netAmount" DECIMAL(20,6) NOT NULL,
    "priceAtDividend" DECIMAL(20,6),
    "unitsHeld" DECIMAL(20,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dividend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAccount" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "balance" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'Expenses',
    "bankAccount" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideIncomeEntry" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sideIncome" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "rentalIncome" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SideIncomeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySnapshot" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "cashTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "etfTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "stockTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "managedFundTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "cryptoTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "otherAssetsTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "superTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "propertyValue" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "propertyEquity" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "mortgageBalance" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "liabilitiesTotal" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "salary" DECIMAL(20,6),
    "sideIncome" DECIMAL(20,6),
    "investmentsAdded" DECIMAL(20,6),
    "monthlySavings" DECIMAL(20,6),
    "savingsRate" DECIMAL(7,6),
    "monthlySpend" DECIMAL(20,6),
    "totalAssets" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "netWorth" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySnapshot_settingsId_snapshotDate_key" ON "MonthlySnapshot"("settingsId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETFHolding" ADD CONSTRAINT "ETFHolding_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETFPurchase" ADD CONSTRAINT "ETFPurchase_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "ETFHolding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHolding" ADD CONSTRAINT "StockHolding_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPurchase" ADD CONSTRAINT "StockPurchase_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "StockHolding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedFundHolding" ADD CONSTRAINT "ManagedFundHolding_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedFundPurchase" ADD CONSTRAINT "ManagedFundPurchase_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "ManagedFundHolding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoHolding" ADD CONSTRAINT "CryptoHolding_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoPurchase" ADD CONSTRAINT "CryptoPurchase_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "CryptoHolding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherAsset" ADD CONSTRAINT "OtherAsset_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dividend" ADD CONSTRAINT "Dividend_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAccount" ADD CONSTRAINT "SuperAccount_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideIncomeEntry" ADD CONSTRAINT "SideIncomeEntry_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlySnapshot" ADD CONSTRAINT "MonthlySnapshot_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
