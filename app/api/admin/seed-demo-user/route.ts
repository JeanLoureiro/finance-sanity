import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import Decimal from "decimal.js";

const DEMO_EMAIL = "jean_loureiro+demo@hotmail.com";
const DEMO_PASSWORD = "johndoedemo";

export async function POST(req: NextRequest) {
  // Security: only allow from localhost or with a secret key
  const authHeader = req.headers.get("x-seed-key");
  const expectedKey = process.env.SEED_SECRET_KEY || "dev-seed-key";

  if (authHeader !== expectedKey) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create Supabase user
    console.log("👤 Creating Supabase user...");
    let userId: string;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already exists")) {
        console.log("⚠️  User already exists");
        // Get the user ID from the database
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users.find((u) => u.email === DEMO_EMAIL);
        if (!user) throw new Error("Could not find existing user");
        userId = user.id;
      } else {
        throw authError;
      }
    } else {
      userId = authData.user!.id;
    }

    // 2. Create UserSettings
    console.log("⚙️  Creating UserSettings...");
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: {
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
      },
    });

    // 3. Bank Accounts
    console.log("🏦 Creating bank accounts...");
    await prisma.bankAccount.deleteMany({ where: { settingsId: settings.id } });
    await Promise.all([
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

    // 4. ETF Holdings
    console.log("📊 Creating ETF holdings...");
    await prisma.eTFHolding.deleteMany({ where: { settingsId: settings.id } });
    await Promise.all([
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

    // 5. Stock Holdings
    console.log("📈 Creating stock holdings...");
    await prisma.stockHolding.deleteMany({ where: { settingsId: settings.id } });
    await Promise.all([
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

    // 6. Crypto Holdings
    console.log("₿ Creating crypto holdings...");
    await prisma.cryptoHolding.deleteMany({ where: { settingsId: settings.id } });
    await Promise.all([
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

    // 7. Properties
    console.log("🏠 Creating properties...");
    await prisma.property.deleteMany({ where: { settingsId: settings.id } });
    await Promise.all([
      prisma.property.create({
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
        },
      }),
      prisma.property.create({
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
        },
      }),
    ]);

    // 8. Super Account
    console.log("👴 Creating super account...");
    await prisma.superAccount.deleteMany({ where: { settingsId: settings.id } });
    await prisma.superAccount.create({
      data: {
        settingsId: settings.id,
        name: "Industry Super Fund",
        provider: "Industry Super",
        balance: new Decimal("285000"),
        sortOrder: 0,
      },
    });

    // 9. Budget Items
    console.log("💳 Creating budget items...");
    await prisma.budgetItem.deleteMany({ where: { settingsId: settings.id } });
    await Promise.all([
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
          name: "Petrol",
          monthlyAmount: new Decimal("300"),
          frequency: "Monthly",
          budgetType: "Needs",
          category: "Transport",
          sortOrder: 2,
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
          sortOrder: 3,
        },
      }),
    ]);

    // 10. Monthly Snapshots
    console.log("📊 Creating monthly snapshots...");
    await prisma.monthlySnapshot.deleteMany({ where: { settingsId: settings.id } });
    await prisma.monthlySnapshot.create({
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
    });

    console.log("✨ Demo data seed completed!");

    return Response.json({
      success: true,
      message: "Demo user created successfully",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      userId,
    });
  } catch (error) {
    console.error("❌ Seed failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
