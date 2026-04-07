import { z } from "zod";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const settingsBaseSchema = z.object({
    currency: z.string().length(3).default("AUD"),
    salary: z.coerce.number().min(0),
    taxBracket: z.coerce.number().min(0).max(1),
    dayOfMonthPaid: z.coerce.number().int().min(1).max(31),
    salaryFrequency: z.enum([
      "Monthly",
      "Weekly",
      "2-weeks",
      "4-weeks",
      "Twice Monthly",
    ]),
    netIncome: z.coerce.number().min(0),
    jobStartDate: z.string().optional().nullable(),
    includeSideIncomeInBudget: z.boolean().default(true),
    bankInterestRate: z.coerce.number().min(0).max(1),
    brokerage: z.coerce.number().min(0).max(1),
    marketReturnRate: z.coerce.number().min(0).max(1),
    etfAllocation: z.coerce.number().min(0).max(1),
    stockAllocation: z.coerce.number().min(0).max(1),
    cryptoAllocation: z.coerce.number().min(0).max(1),
    cashAllocation: z.coerce.number().min(0).max(1),
    mfAllocation: z.coerce.number().min(0).max(1),
    cashSavingsTarget: z.coerce.number().min(0),
    eoyGoal: z.coerce.number().min(0),
    housePriceTarget: z.coerce.number().min(0),
    houseDepositPct: z.coerce.number().min(0).max(1),
    emergencyFundMonths: z.coerce.number().int().min(1).max(24),
    cgtMethod: z.enum(["FIFO", "UK_POOL"]),
    shortTermTaxRate: z.coerce.number().min(0).max(1),
    longTermTaxRate: z.coerce.number().min(0).max(1),
    cgtShowInLiabilities: z.boolean().default(true),
    includeMortgageInSavingsRate: z.boolean().default(false),
    coinmarketcapKey: z.string().optional().nullable(),
    cryptoPricingSource: z.enum(["CoinGecko", "CoinMarketCap"]),
    yearOfBirth: z.coerce.number().int().min(1900).max(2010),
    inflationRate: z.coerce.number().min(0).max(0.2),
    withdrawalRate: z.coerce.number().min(0).max(0.2),
    preservationAge: z.coerce.number().int().min(50).max(70),
    superContribPct: z.coerce.number().min(0).max(0.5),
    useBudget: z.boolean().default(true),
    useCash: z.boolean().default(true),
    useETFs: z.boolean().default(true),
    useStocks: z.boolean().default(true),
    useCrypto: z.boolean().default(false),
    useManagedFunds: z.boolean().default(false),
    useOtherAssets: z.boolean().default(true),
    useSideIncome: z.boolean().default(true),
    useProperty: z.boolean().default(true),
    useLiabilities: z.boolean().default(false),
    useCapitalGains: z.boolean().default(true),
    useFIRE: z.boolean().default(true),
    useSuper: z.boolean().default(true),
  });

export const settingsSchema = settingsBaseSchema.refine(
  (d) => {
    const total =
      d.etfAllocation +
      d.stockAllocation +
      d.cryptoAllocation +
      d.cashAllocation +
      d.mfAllocation;
    return Math.abs(total - 1.0) < 0.01;
  },
  {
    message: "Asset allocations must sum to 100%",
    path: ["etfAllocation"],
  }
);

export type SettingsInput = z.infer<typeof settingsSchema>;

// ---------------------------------------------------------------------------
// Bank Account
// ---------------------------------------------------------------------------
export const bankAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  currency: z.string().length(3).default("AUD"),
  balance: z.coerce.number().min(0),
  bsb: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
});

export type BankAccountInput = z.infer<typeof bankAccountSchema>;

// ---------------------------------------------------------------------------
// Purchase (shared by ETF, Stock, MF, Crypto)
// ---------------------------------------------------------------------------
export const purchaseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  units: z.coerce.number().positive("Units must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  brokerage: z.coerce.number().min(0).default(0),
  direction: z.enum(["BUY", "SELL"]),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;

// ---------------------------------------------------------------------------
// ETF Holding
// ---------------------------------------------------------------------------
export const etfHoldingSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  name: z.string().optional(),
  currency: z.string().length(3).default("AUD"),
  targetAllocation: z.coerce.number().min(0).max(1).default(0),
  managementFee: z.coerce.number().min(0).max(0.1).default(0),
  location: z.string().optional(),
  pctUS: z.coerce.number().min(0).max(1).default(0),
  pctAsia: z.coerce.number().min(0).max(1).default(0),
  pctAus: z.coerce.number().min(0).max(1).default(0),
  sector: z.string().optional(),
  dividendFreqMonths: z.coerce.number().int().optional().nullable(),
  drpEnabled: z.boolean().default(false),
  sortOrder: z.coerce.number().int().optional(),
});

export type ETFHoldingInput = z.infer<typeof etfHoldingSchema>;

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------
export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  isPrimaryResidence: z.boolean().default(false),
  purchaseValue: z.coerce.number().positive(),
  currentValue: z.coerce.number().positive(),
  netRentProfit: z.coerce.number().default(0),
  mortgageStartDate: z.string().optional().nullable(),
  mortgageAnnualRate: z.coerce.number().min(0).max(1).optional().nullable(),
  mortgageMonthlyPayment: z.coerce.number().min(0).optional().nullable(),
  mortgageStartBalance: z.coerce.number().min(0).optional().nullable(),
  equityLoanStartDate: z.string().optional().nullable(),
  equityLoanAnnualRate: z.coerce.number().min(0).max(1).optional().nullable(),
  equityLoanStartBalance: z.coerce.number().min(0).optional().nullable(),
  equityLoanMonthlyPayment: z.coerce.number().min(0).optional().nullable(),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const propertyIncomeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  grossRent: z.coerce.number().positive(),
  frequency: z.enum(["weekly", "fortnightly", "monthly", "quarterly", "annually"]).default("monthly"),
  notes: z.string().optional().nullable(),
});

export const propertyExpenseEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(["management_fee", "council_rates", "water", "insurance", "repairs", "other"]),
  amount: z.coerce.number().positive(),
  notes: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Loan
// ---------------------------------------------------------------------------
export const loanSchema = z.object({
  name: z.string().min(1, "Loan name is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  interestFrequency: z.coerce.number().int().min(1).max(365).default(12),
  annualRate: z.coerce.number().min(0).max(1),
  regularPayment: z.coerce.number().positive(),
  startingBalance: z.coerce.number().positive(),
});

export type LoanInput = z.infer<typeof loanSchema>;

// ---------------------------------------------------------------------------
// Dividend
// ---------------------------------------------------------------------------
export const dividendSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ticker: z.string().min(1),
  holdingType: z.enum(["ETF", "Stock", "ManagedFund", "Crypto"]),
  exDividendDate: z.string().optional().nullable(),
  reinvested: z.boolean().default(false),
  netAmount: z.coerce.number().positive(),
  priceAtDividend: z.coerce.number().positive().optional().nullable(),
});

export type DividendInput = z.infer<typeof dividendSchema>;

// ---------------------------------------------------------------------------
// Budget Item
// ---------------------------------------------------------------------------
export const BUDGET_FREQUENCIES = ["Weekly", "Fortnightly", "Monthly", "Quarterly", "Annually"] as const;
export type BudgetFrequency = typeof BUDGET_FREQUENCIES[number];

export const budgetItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  monthlyAmount: z.coerce.number().min(0),
  frequency: z.string().default("Monthly"),
  budgetType: z.string().default(""),
  category: z.string().default(""),
  bankAccount: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
});

export type BudgetItemInput = z.infer<typeof budgetItemSchema>;

export const budgetTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sortOrder: z.coerce.number().int().optional(),
});
export type BudgetTypeInput = z.infer<typeof budgetTypeSchema>;

export const budgetCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  sortOrder: z.coerce.number().int().optional(),
});
export type BudgetCategoryInput = z.infer<typeof budgetCategorySchema>;

// ---------------------------------------------------------------------------
// Side Income
// ---------------------------------------------------------------------------
export const sideIncomeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sideIncome: z.coerce.number().min(0).default(0),
  rentalIncome: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export type SideIncomeInput = z.infer<typeof sideIncomeSchema>;

// ---------------------------------------------------------------------------
// Super Account
// ---------------------------------------------------------------------------
export const superAccountSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional().nullable(),
  balance: z.coerce.number().min(0),
});

export type SuperAccountInput = z.infer<typeof superAccountSchema>;

// ---------------------------------------------------------------------------
// Stock Holding (no management fee, no geographic splits)
// ---------------------------------------------------------------------------
export const stockHoldingSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  name: z.string().optional(),
  currency: z.string().length(3).default("AUD"),
  targetAllocation: z.coerce.number().min(0).max(1).default(0),
  sector: z.string().optional(),
  dividendFreqMonths: z.coerce.number().int().optional().nullable(),
  drpEnabled: z.boolean().default(false),
  sortOrder: z.coerce.number().int().optional(),
});
export type StockHoldingInput = z.infer<typeof stockHoldingSchema>;

// ---------------------------------------------------------------------------
// Crypto Holding
// ---------------------------------------------------------------------------
export const cryptoHoldingSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  name: z.string().optional(),
  targetAllocation: z.coerce.number().min(0).max(1).default(0),
  sortOrder: z.coerce.number().int().optional(),
});
export type CryptoHoldingInput = z.infer<typeof cryptoHoldingSchema>;

// ---------------------------------------------------------------------------
// Managed Fund Holding (same fields as ETF)
// ---------------------------------------------------------------------------
export const managedFundHoldingSchema = etfHoldingSchema;
export type ManagedFundHoldingInput = ETFHoldingInput;

// ---------------------------------------------------------------------------
// Other Asset
// ---------------------------------------------------------------------------
export const otherAssetSchema = z.object({
  description: z.string().min(1, "Description is required"),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  units: z.coerce.number().positive(),
  currency: z.string().length(3).default("AUD"),
  unitPurchasePrice: z.coerce.number().min(0),
  liveUnitPrice: z.coerce.number().min(0).optional().nullable(),
  soldUnits: z.coerce.number().min(0).default(0),
});
export type OtherAssetInput = z.infer<typeof otherAssetSchema>;
