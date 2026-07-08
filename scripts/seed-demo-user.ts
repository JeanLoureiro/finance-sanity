import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma";
import Decimal from "decimal.js";

const DEMO_EMAIL = "jean_loureiro+demo@hotmail.com";
const DEMO_PASSWORD = "johndoedemo";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedDemoUser() {
  console.log("🌱 Starting demo user seed...");

  // 1. Create Supabase user
  console.log(`\n👤 Creating Supabase user: ${DEMO_EMAIL}`);
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  let userId: string;

  if (authError) {
    if (authError.message.includes("already exists")) {
      console.log("⚠️  User already exists, retrieving existing user...");
      const { data: existingUser } = await adminClient.auth.admin.listUsers();
      const user = existingUser?.users.find((u) => u.email === DEMO_EMAIL);
      if (!user) throw new Error("Could not find existing user");
      userId = user.id;
    } else {
      throw authError;
    }
  } else {
    userId = authData.user!.id;
  }
  console.log(`✅ User created/found: ${userId}`);

  // 2. Create or get UserSettings
  console.log("\n⚙️  Creating UserSettings...");
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        ownerEmail: DEMO_EMAIL,
        currency: "AUD",
        salary: new Decimal("120000"),
        taxBracket: new Decimal("0.37"),
        dayOfMonthPaid: 15,
        salaryFrequency: "Monthly",
        netIncome: new Decimal("8000"),
        jobStartDate: new Date("2022-01-01"),
        bankInterestRate: new Decimal("0.0475"),
        marketReturnRate: new Decimal("0.08"),
        etfAllocation: new Decimal("0.6"),
        stockAllocation: new Decimal("0.2"),
        cryptoAllocation: new Decimal("0.05"),
        cashAllocation: new Decimal("0.15"),
        cashSavingsTarget: new Decimal("60000"),
        emergencyFundMonths: 6,
        yearOfBirth: 1988,
        useBudget: true,
        useCash: true,
        useETFs: true,
        useStocks: true,
        useCrypto: true,
        useManagedFunds: true,
        useOtherAssets: true,
        useSideIncome: true,
        useProperty: true,
        useLiabilities: true,
        useCapitalGains: true,
        useFIRE: true,
        useSuper: true,
        useDividends: true,
      },
    });
  }

  console.log(`✅ UserSettings: ${settings.id}`);

  // 3. Bank Accounts
  console.log("\n🏦 Creating bank accounts...");
  const bankAccounts = await Promise.all([
    prisma.bankAccount.create({
      data: {
        settingsId: settings.id,
        name: "Everyday Savings",
        balance: new Decimal("45000"),
        bsb: "062000",
        sortOrder: 0,
      },
    }),
    prisma.bankAccount.create({
      data: {
        settingsId: settings.id,
        name: "High Interest Savings",
        balance: new Decimal("35000"),
        bsb: "062000",
        sortOrder: 1,
      },
    }),
    prisma.bankAccount.create({
      data: {
        settingsId: settings.id,
        name: "Investment Account",
        balance: new Decimal("12000"),
        bsb: "062000",
        sortOrder: 2,
      },
    }),
  ]);
  console.log(`✅ Created ${bankAccounts.length} bank accounts`);

  // 4. ETF Holdings
  console.log("\n📊 Creating ETF holdings...");
  const etfHoldings = await Promise.all([
    prisma.eTFHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "VDHG",
        name: "Vanguard Diversified ETF",
        targetAllocation: new Decimal("0.4"),
        managementFee: new Decimal("0.0023"),
        pctAus: new Decimal("0.3"),
        pctUS: new Decimal("0.5"),
        pctAsia: new Decimal("0.2"),
        dividendFreqMonths: 12,
        drpEnabled: true,
        sortOrder: 0,
        purchases: {
          create: [
            {
              date: new Date("2022-01-15"),
              units: new Decimal("500"),
              price: new Decimal("65.50"),
              brokerage: new Decimal("0"),
            },
            {
              date: new Date("2023-06-20"),
              units: new Decimal("300"),
              price: new Decimal("68.20"),
              brokerage: new Decimal("0"),
            },
            {
              date: new Date("2024-03-10"),
              units: new Decimal("200"),
              price: new Decimal("70.15"),
              brokerage: new Decimal("0"),
            },
          ],
        },
      },
    }),
    prisma.eTFHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "VAS",
        name: "Vanguard Australian Shares",
        targetAllocation: new Decimal("0.2"),
        managementFee: new Decimal("0.0009"),
        pctAus: new Decimal("1"),
        dividendFreqMonths: 12,
        drpEnabled: true,
        sortOrder: 1,
        purchases: {
          create: [
            {
              date: new Date("2022-03-01"),
              units: new Decimal("600"),
              price: new Decimal("95.00"),
              brokerage: new Decimal("0"),
            },
            {
              date: new Date("2023-09-15"),
              units: new Decimal("400"),
              price: new Decimal("98.50"),
              brokerage: new Decimal("0"),
            },
          ],
        },
      },
    }),
    prisma.eTFHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "VGS",
        name: "Vanguard Global Shares",
        targetAllocation: new Decimal("0.3"),
        managementFee: new Decimal("0.0016"),
        pctUS: new Decimal("0.6"),
        pctAsia: new Decimal("0.25"),
        pctAus: new Decimal("0.15"),
        dividendFreqMonths: 12,
        drpEnabled: true,
        sortOrder: 2,
        purchases: {
          create: [
            {
              date: new Date("2021-12-01"),
              units: new Decimal("800"),
              price: new Decimal("52.30"),
              brokerage: new Decimal("0"),
            },
            {
              date: new Date("2024-01-20"),
              units: new Decimal("500"),
              price: new Decimal("55.75"),
              brokerage: new Decimal("0"),
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${etfHoldings.length} ETF holdings`);

  // 5. Stock Holdings
  console.log("\n📈 Creating stock holdings...");
  const stockHoldings = await Promise.all([
    prisma.stockHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "CBA",
        name: "Commonwealth Bank",
        sector: "Financials",
        dividendFreqMonths: 6,
        drpEnabled: true,
        sortOrder: 0,
        purchases: {
          create: [
            {
              date: new Date("2022-05-10"),
              units: new Decimal("100"),
              price: new Decimal("89.50"),
              brokerage: new Decimal("10"),
            },
            {
              date: new Date("2023-08-22"),
              units: new Decimal("50"),
              price: new Decimal("92.30"),
              brokerage: new Decimal("10"),
            },
          ],
        },
      },
    }),
    prisma.stockHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "WBC",
        name: "Westpac Banking",
        sector: "Financials",
        dividendFreqMonths: 6,
        drpEnabled: false,
        sortOrder: 1,
        purchases: {
          create: [
            {
              date: new Date("2023-02-14"),
              units: new Decimal("150"),
              price: new Decimal("21.80"),
              brokerage: new Decimal("10"),
            },
          ],
        },
      },
    }),
    prisma.stockHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "ANZ",
        name: "Australia and New Zealand Banking",
        sector: "Financials",
        dividendFreqMonths: 6,
        drpEnabled: true,
        sortOrder: 2,
        purchases: {
          create: [
            {
              date: new Date("2022-11-05"),
              units: new Decimal("80"),
              price: new Decimal("23.45"),
              brokerage: new Decimal("10"),
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${stockHoldings.length} stock holdings`);

  // 6. Crypto Holdings
  console.log("\n₿ Creating crypto holdings...");
  const cryptoHoldings = await Promise.all([
    prisma.cryptoHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "BTC",
        name: "Bitcoin",
        targetAllocation: new Decimal("0.03"),
        sortOrder: 0,
        purchases: {
          create: [
            {
              date: new Date("2023-01-15"),
              units: new Decimal("0.5"),
              price: new Decimal("26500"),
              brokerage: new Decimal("50"),
            },
            {
              date: new Date("2024-03-01"),
              units: new Decimal("0.3"),
              price: new Decimal("42000"),
              brokerage: new Decimal("75"),
            },
          ],
        },
      },
    }),
    prisma.cryptoHolding.create({
      data: {
        settingsId: settings.id,
        ticker: "ETH",
        name: "Ethereum",
        targetAllocation: new Decimal("0.02"),
        sortOrder: 1,
        purchases: {
          create: [
            {
              date: new Date("2023-06-20"),
              units: new Decimal("5"),
              price: new Decimal("1850"),
              brokerage: new Decimal("30"),
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${cryptoHoldings.length} crypto holdings`);

  // 7. Property
  console.log("\n🏠 Creating property...");
  const property = await prisma.property.create({
    data: {
      settingsId: settings.id,
      name: "Principal Place of Residence",
      purchaseDate: new Date("2019-07-01"),
      isPrimaryResidence: true,
      purchaseValue: new Decimal("650000"),
      currentValue: new Decimal("850000"),
      mortgageStartDate: new Date("2019-07-01"),
      mortgageAnnualRate: new Decimal("0.045"),
      mortgageStartBalance: new Decimal("520000"),
      mortgageCurrentBalance: new Decimal("420000"),
      mortgageMonthlyPayment: new Decimal("2680"),
      sortOrder: 0,
      incomeEntries: {
        create: [],
      },
      expenseEntries: {
        create: [
          {
            date: new Date("2024-07-01"),
            category: "Council Rates",
            amount: new Decimal("400"),
            frequency: "quarterly",
          },
          {
            date: new Date("2024-07-01"),
            category: "Home & Building Insurance",
            amount: new Decimal("1200"),
            frequency: "annual",
          },
          {
            date: new Date("2024-07-01"),
            category: "Maintenance & Repairs",
            amount: new Decimal("150"),
            frequency: "monthly",
          },
        ],
      },
    },
  });
  console.log(`✅ Created property: ${property.name}`);

  // 8. Investment Property
  console.log("\n🏘️  Creating investment property...");
  const investmentProperty = await prisma.property.create({
    data: {
      settingsId: settings.id,
      name: "Investment Property - Unit",
      purchaseDate: new Date("2021-03-15"),
      isPrimaryResidence: false,
      purchaseValue: new Decimal("480000"),
      currentValue: new Decimal("580000"),
      netRentProfit: new Decimal("150"),
      mortgageStartDate: new Date("2021-03-15"),
      mortgageAnnualRate: new Decimal("0.0425"),
      mortgageStartBalance: new Decimal("384000"),
      mortgageCurrentBalance: new Decimal("330000"),
      mortgageMonthlyPayment: new Decimal("1950"),
      sortOrder: 1,
      incomeEntries: {
        create: [
          {
            date: new Date("2024-01-01"),
            grossRent: new Decimal("2400"),
            frequency: "monthly",
          },
          {
            date: new Date("2024-02-01"),
            grossRent: new Decimal("2400"),
            frequency: "monthly",
          },
          {
            date: new Date("2024-03-01"),
            grossRent: new Decimal("2400"),
            frequency: "monthly",
          },
        ],
      },
      expenseEntries: {
        create: [
          {
            date: new Date("2024-01-01"),
            category: "Council Rates",
            amount: new Decimal("280"),
            frequency: "quarterly",
          },
          {
            date: new Date("2024-01-01"),
            category: "Landlord Insurance",
            amount: new Decimal("45"),
            frequency: "monthly",
          },
          {
            date: new Date("2024-01-01"),
            category: "Body Corporate",
            amount: new Decimal("120"),
            frequency: "monthly",
          },
        ],
      },
    },
  });
  console.log(`✅ Created property: ${investmentProperty.name}`);

  // 9. Super Account
  console.log("\n👴 Creating super account...");
  const superAccount = await prisma.superAccount.create({
    data: {
      settingsId: settings.id,
      name: "Industry Super Fund",
      provider: "Industry Super",
      balance: new Decimal("285000"),
      sortOrder: 0,
    },
  });
  console.log(`✅ Created super account: ${superAccount.name}`);

  // 10. Dividends
  console.log("\n💰 Creating dividend records...");
  const dividends = await Promise.all([
    prisma.dividend.create({
      data: {
        settingsId: settings.id,
        paymentDate: new Date("2024-03-15"),
        ticker: "CBA",
        holdingType: "stock",
        reinvested: true,
        netAmount: new Decimal("180.50"),
      },
    }),
    prisma.dividend.create({
      data: {
        settingsId: settings.id,
        paymentDate: new Date("2024-04-01"),
        ticker: "VDHG",
        holdingType: "etf",
        reinvested: true,
        netAmount: new Decimal("423.75"),
      },
    }),
    prisma.dividend.create({
      data: {
        settingsId: settings.id,
        paymentDate: new Date("2024-05-20"),
        ticker: "VAS",
        holdingType: "etf",
        reinvested: false,
        netAmount: new Decimal("287.30"),
      },
    }),
  ]);
  console.log(`✅ Created ${dividends.length} dividend records`);

  // 11. Budget Categories & Types
  console.log("\n📋 Creating budget categories & types...");
  void await Promise.all([
    prisma.budgetType.create({
      data: { settingsId: settings.id, name: "Needs", sortOrder: 0 },
    }),
    prisma.budgetType.create({
      data: { settingsId: settings.id, name: "Wants", sortOrder: 1 },
    }),
    prisma.budgetType.create({
      data: { settingsId: settings.id, name: "Savings", sortOrder: 2 },
    }),
  ]);

  void await Promise.all([
    prisma.budgetCategory.create({
      data: { settingsId: settings.id, name: "Groceries", sortOrder: 0 },
    }),
    prisma.budgetCategory.create({
      data: { settingsId: settings.id, name: "Utilities", sortOrder: 1 },
    }),
    prisma.budgetCategory.create({
      data: { settingsId: settings.id, name: "Transport", sortOrder: 2 },
    }),
    prisma.budgetCategory.create({
      data: { settingsId: settings.id, name: "Entertainment", sortOrder: 3 },
    }),
    prisma.budgetCategory.create({
      data: { settingsId: settings.id, name: "Dining Out", sortOrder: 4 },
    }),
  ]);

  // 12. Budget Items
  console.log("\n💳 Creating budget items...");
  const budgetItems = await Promise.all([
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Groceries",
        monthlyAmount: new Decimal("600"),
        frequency: "Monthly",
        budgetType: "Needs",
        category: "Groceries",
        sortOrder: 0,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Electricity & Gas",
        monthlyAmount: new Decimal("250"),
        frequency: "Monthly",
        budgetType: "Needs",
        category: "Utilities",
        sortOrder: 1,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Internet & Mobile",
        monthlyAmount: new Decimal("120"),
        frequency: "Monthly",
        budgetType: "Needs",
        category: "Utilities",
        sortOrder: 2,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Car Registration & Insurance",
        monthlyAmount: new Decimal("180"),
        frequency: "Monthly",
        budgetType: "Needs",
        category: "Transport",
        sortOrder: 3,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Petrol",
        monthlyAmount: new Decimal("300"),
        frequency: "Monthly",
        budgetType: "Needs",
        category: "Transport",
        sortOrder: 4,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Gym Membership",
        monthlyAmount: new Decimal("60"),
        frequency: "Monthly",
        budgetType: "Wants",
        category: "Entertainment",
        sortOrder: 5,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Dining Out & Coffee",
        monthlyAmount: new Decimal("400"),
        frequency: "Monthly",
        budgetType: "Wants",
        category: "Dining Out",
        sortOrder: 6,
      },
    }),
    prisma.budgetItem.create({
      data: {
        settingsId: settings.id,
        name: "Subscriptions (Netflix, etc)",
        monthlyAmount: new Decimal("50"),
        frequency: "Monthly",
        budgetType: "Wants",
        category: "Entertainment",
        sortOrder: 7,
      },
    }),
  ]);
  console.log(`✅ Created ${budgetItems.length} budget items`);

  // 13. Side Income
  console.log("\n💼 Creating side income entries...");
  const sideIncomeEntries = await Promise.all([
    prisma.sideIncomeEntry.create({
      data: {
        settingsId: settings.id,
        date: new Date("2024-05-31"),
        sideIncome: new Decimal("500"),
        rentalIncome: new Decimal("0"),
        notes: "Freelance web development project",
      },
    }),
    prisma.sideIncomeEntry.create({
      data: {
        settingsId: settings.id,
        date: new Date("2024-04-30"),
        sideIncome: new Decimal("750"),
        rentalIncome: new Decimal("0"),
        notes: "Consulting work",
      },
    }),
  ]);
  console.log(`✅ Created ${sideIncomeEntries.length} side income entries`);

  // 14. Other Assets
  console.log("\n🎨 Creating other assets...");
  const otherAssets = await Promise.all([
    prisma.otherAsset.create({
      data: {
        settingsId: settings.id,
        description: "Car (2020 Honda Civic)",
        purchaseDate: new Date("2020-06-15"),
        units: new Decimal("1"),
        unitPurchasePrice: new Decimal("28000"),
        liveUnitPrice: new Decimal("18000"),
      },
    }),
    prisma.otherAsset.create({
      data: {
        settingsId: settings.id,
        description: "Investment Watch Collection",
        purchaseDate: new Date("2021-01-10"),
        units: new Decimal("5"),
        unitPurchasePrice: new Decimal("3000"),
        liveUnitPrice: new Decimal("3500"),
      },
    }),
  ]);
  console.log(`✅ Created ${otherAssets.length} other assets`);

  // 15. Monthly Snapshots
  console.log("\n📊 Creating monthly snapshots...");
  const snapshots = await Promise.all([
    prisma.monthlySnapshot.create({
      data: {
        settingsId: settings.id,
        snapshotDate: new Date("2024-03-31"),
        cashTotal: new Decimal("92000"),
        etfTotal: new Decimal("145000"),
        stockTotal: new Decimal("22800"),
        managedFundTotal: new Decimal("0"),
        cryptoTotal: new Decimal("18500"),
        otherAssetsTotal: new Decimal("24500"),
        superTotal: new Decimal("280000"),
        propertyValue: new Decimal("1430000"),
        propertyEquity: new Decimal("930000"),
        mortgageBalance: new Decimal("750000"),
        liabilitiesTotal: new Decimal("750000"),
        salary: new Decimal("120000"),
        sideIncome: new Decimal("1250"),
        investmentsAdded: new Decimal("5000"),
        monthlySavings: new Decimal("7500"),
        savingsRate: new Decimal("0.65"),
        monthlySpend: new Decimal("4000"),
        totalAssets: new Decimal("2782800"),
        netWorth: new Decimal("2032800"),
        notes: "Q1 review - on track",
      },
    }),
    prisma.monthlySnapshot.create({
      data: {
        settingsId: settings.id,
        snapshotDate: new Date("2024-04-30"),
        cashTotal: new Decimal("94500"),
        etfTotal: new Decimal("151200"),
        stockTotal: new Decimal("24100"),
        managedFundTotal: new Decimal("0"),
        cryptoTotal: new Decimal("19800"),
        otherAssetsTotal: new Decimal("24500"),
        superTotal: new Decimal("288000"),
        propertyValue: new Decimal("1450000"),
        propertyEquity: new Decimal("950000"),
        mortgageBalance: new Decimal("745000"),
        liabilitiesTotal: new Decimal("745000"),
        salary: new Decimal("120000"),
        sideIncome: new Decimal("750"),
        investmentsAdded: new Decimal("6500"),
        monthlySavings: new Decimal("8200"),
        savingsRate: new Decimal("0.68"),
        monthlySpend: new Decimal("3800"),
        totalAssets: new Decimal("2852100"),
        netWorth: new Decimal("2107100"),
        notes: "Strong April performance",
      },
    }),
    prisma.monthlySnapshot.create({
      data: {
        settingsId: settings.id,
        snapshotDate: new Date("2024-05-31"),
        cashTotal: new Decimal("98000"),
        etfTotal: new Decimal("158500"),
        stockTotal: new Decimal("25300"),
        managedFundTotal: new Decimal("0"),
        cryptoTotal: new Decimal("21500"),
        otherAssetsTotal: new Decimal("24500"),
        superTotal: new Decimal("295000"),
        propertyValue: new Decimal("1480000"),
        propertyEquity: new Decimal("975000"),
        mortgageBalance: new Decimal("740000"),
        liabilitiesTotal: new Decimal("740000"),
        salary: new Decimal("120000"),
        sideIncome: new Decimal("1250"),
        investmentsAdded: new Decimal("8000"),
        monthlySavings: new Decimal("9000"),
        savingsRate: new Decimal("0.70"),
        monthlySpend: new Decimal("3600"),
        totalAssets: new Decimal("2982800"),
        netWorth: new Decimal("2242800"),
        notes: "Excellent progress towards FIRE goals",
      },
    }),
  ]);
  console.log(`✅ Created ${snapshots.length} monthly snapshots`);

  console.log("\n✨ Demo user seed completed successfully!");
  console.log(`\n🎉 Demo account ready:`);
  console.log(`   Email: ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`\n📊 Demo data includes:`);
  console.log(`   • 3 Bank Accounts ($92k total)`);
  console.log(`   • 3 ETF Holdings (VDHG, VAS, VGS)`);
  console.log(`   • 3 Stock Holdings (CBA, WBC, ANZ)`);
  console.log(`   • 2 Crypto Holdings (BTC, ETH)`);
  console.log(`   • 2 Properties (Primary + Investment)`);
  console.log(`   • Super Account ($295k)`);
  console.log(`   • 5 Dividend Records`);
  console.log(`   • 8 Budget Items (Needs/Wants/Savings)`);
  console.log(`   • 2 Side Income Entries`);
  console.log(`   • 2 Other Assets (Car, Watch Collection)`);
  console.log(`   • 3 Monthly Snapshots (Mar-May 2024)`);
  console.log(`\n   Net Worth: $2.24M | Monthly Savings: $9k | Savings Rate: 70%`);
}

seedDemoUser()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
