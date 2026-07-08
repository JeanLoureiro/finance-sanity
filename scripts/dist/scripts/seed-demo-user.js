"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var prisma_1 = require("../lib/prisma");
var decimal_js_1 = __importDefault(require("decimal.js"));
var DEMO_EMAIL = "jean_loureiro+demo@hotmail.com";
var DEMO_PASSWORD = "johndoedemo";
var SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
var SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var adminClient = (0, supabase_js_1.createClient)(SUPABASE_URL, SERVICE_ROLE_KEY);
function seedDemoUser() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, authData, authError, userId, existingUser, user, settings, bankAccounts, etfHoldings, stockHoldings, cryptoHoldings, property, investmentProperty, superAccount, dividends, budgetTypes, budgetCategories, budgetItems, sideIncomeEntries, otherAssets, snapshots;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("🌱 Starting demo user seed...");
                    // 1. Create Supabase user
                    console.log("\n\uD83D\uDC64 Creating Supabase user: ".concat(DEMO_EMAIL));
                    return [4 /*yield*/, adminClient.auth.admin.createUser({
                            email: DEMO_EMAIL,
                            password: DEMO_PASSWORD,
                            email_confirm: true,
                        })];
                case 1:
                    _a = _b.sent(), authData = _a.data, authError = _a.error;
                    if (!authError) return [3 /*break*/, 5];
                    if (!authError.message.includes("already exists")) return [3 /*break*/, 3];
                    console.log("⚠️  User already exists, retrieving existing user...");
                    return [4 /*yield*/, adminClient.auth.admin.listUsers()];
                case 2:
                    existingUser = (_b.sent()).data;
                    user = existingUser === null || existingUser === void 0 ? void 0 : existingUser.users.find(function (u) { return u.email === DEMO_EMAIL; });
                    if (!user)
                        throw new Error("Could not find existing user");
                    userId = user.id;
                    return [3 /*break*/, 4];
                case 3: throw authError;
                case 4: return [3 /*break*/, 6];
                case 5:
                    userId = authData.user.id;
                    _b.label = 6;
                case 6:
                    console.log("\u2705 User created/found: ".concat(userId));
                    // 2. Create or get UserSettings
                    console.log("\n⚙️  Creating UserSettings...");
                    return [4 /*yield*/, prisma_1.prisma.userSettings.findUnique({
                            where: { userId: userId },
                        })];
                case 7:
                    settings = _b.sent();
                    if (!!settings) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma_1.prisma.userSettings.create({
                            data: {
                                userId: userId,
                                ownerEmail: DEMO_EMAIL,
                                currency: "AUD",
                                salary: new decimal_js_1.default("120000"),
                                taxBracket: new decimal_js_1.default("0.37"),
                                dayOfMonthPaid: 15,
                                salaryFrequency: "Monthly",
                                netIncome: new decimal_js_1.default("8000"),
                                jobStartDate: new Date("2022-01-01"),
                                bankInterestRate: new decimal_js_1.default("0.0475"),
                                marketReturnRate: new decimal_js_1.default("0.08"),
                                etfAllocation: new decimal_js_1.default("0.6"),
                                stockAllocation: new decimal_js_1.default("0.2"),
                                cryptoAllocation: new decimal_js_1.default("0.05"),
                                cashAllocation: new decimal_js_1.default("0.15"),
                                cashSavingsTarget: new decimal_js_1.default("60000"),
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
                        })];
                case 8:
                    settings = _b.sent();
                    _b.label = 9;
                case 9:
                    console.log("\u2705 UserSettings: ".concat(settings.id));
                    // 3. Bank Accounts
                    console.log("\n🏦 Creating bank accounts...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.bankAccount.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Everyday Savings",
                                    balance: new decimal_js_1.default("45000"),
                                    bsb: "062000",
                                    sortOrder: 0,
                                },
                            }),
                            prisma_1.prisma.bankAccount.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "High Interest Savings",
                                    balance: new decimal_js_1.default("35000"),
                                    bsb: "062000",
                                    sortOrder: 1,
                                },
                            }),
                            prisma_1.prisma.bankAccount.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Investment Account",
                                    balance: new decimal_js_1.default("12000"),
                                    bsb: "062000",
                                    sortOrder: 2,
                                },
                            }),
                        ])];
                case 10:
                    bankAccounts = _b.sent();
                    console.log("\u2705 Created ".concat(bankAccounts.length, " bank accounts"));
                    // 4. ETF Holdings
                    console.log("\n📊 Creating ETF holdings...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.eTFHolding.create({
                                data: {
                                    settingsId: settings.id,
                                    ticker: "VDHG",
                                    name: "Vanguard Diversified ETF",
                                    targetAllocation: new decimal_js_1.default("0.4"),
                                    managementFee: new decimal_js_1.default("0.0023"),
                                    pctAus: new decimal_js_1.default("0.3"),
                                    pctUS: new decimal_js_1.default("0.5"),
                                    pctAsia: new decimal_js_1.default("0.2"),
                                    dividendFreqMonths: 12,
                                    drpEnabled: true,
                                    sortOrder: 0,
                                    purchases: {
                                        create: [
                                            {
                                                date: new Date("2022-01-15"),
                                                units: new decimal_js_1.default("500"),
                                                price: new decimal_js_1.default("65.50"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                            {
                                                date: new Date("2023-06-20"),
                                                units: new decimal_js_1.default("300"),
                                                price: new decimal_js_1.default("68.20"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                            {
                                                date: new Date("2024-03-10"),
                                                units: new decimal_js_1.default("200"),
                                                price: new decimal_js_1.default("70.15"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                        ],
                                    },
                                },
                            }),
                            prisma_1.prisma.eTFHolding.create({
                                data: {
                                    settingsId: settings.id,
                                    ticker: "VAS",
                                    name: "Vanguard Australian Shares",
                                    targetAllocation: new decimal_js_1.default("0.2"),
                                    managementFee: new decimal_js_1.default("0.0009"),
                                    pctAus: new decimal_js_1.default("1"),
                                    dividendFreqMonths: 12,
                                    drpEnabled: true,
                                    sortOrder: 1,
                                    purchases: {
                                        create: [
                                            {
                                                date: new Date("2022-03-01"),
                                                units: new decimal_js_1.default("600"),
                                                price: new decimal_js_1.default("95.00"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                            {
                                                date: new Date("2023-09-15"),
                                                units: new decimal_js_1.default("400"),
                                                price: new decimal_js_1.default("98.50"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                        ],
                                    },
                                },
                            }),
                            prisma_1.prisma.eTFHolding.create({
                                data: {
                                    settingsId: settings.id,
                                    ticker: "VGS",
                                    name: "Vanguard Global Shares",
                                    targetAllocation: new decimal_js_1.default("0.3"),
                                    managementFee: new decimal_js_1.default("0.0016"),
                                    pctUS: new decimal_js_1.default("0.6"),
                                    pctAsia: new decimal_js_1.default("0.25"),
                                    pctAus: new decimal_js_1.default("0.15"),
                                    dividendFreqMonths: 12,
                                    drpEnabled: true,
                                    sortOrder: 2,
                                    purchases: {
                                        create: [
                                            {
                                                date: new Date("2021-12-01"),
                                                units: new decimal_js_1.default("800"),
                                                price: new decimal_js_1.default("52.30"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                            {
                                                date: new Date("2024-01-20"),
                                                units: new decimal_js_1.default("500"),
                                                price: new decimal_js_1.default("55.75"),
                                                brokerage: new decimal_js_1.default("0"),
                                            },
                                        ],
                                    },
                                },
                            }),
                        ])];
                case 11:
                    etfHoldings = _b.sent();
                    console.log("\u2705 Created ".concat(etfHoldings.length, " ETF holdings"));
                    // 5. Stock Holdings
                    console.log("\n📈 Creating stock holdings...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.stockHolding.create({
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
                                                units: new decimal_js_1.default("100"),
                                                price: new decimal_js_1.default("89.50"),
                                                brokerage: new decimal_js_1.default("10"),
                                            },
                                            {
                                                date: new Date("2023-08-22"),
                                                units: new decimal_js_1.default("50"),
                                                price: new decimal_js_1.default("92.30"),
                                                brokerage: new decimal_js_1.default("10"),
                                            },
                                        ],
                                    },
                                },
                            }),
                            prisma_1.prisma.stockHolding.create({
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
                                                units: new decimal_js_1.default("150"),
                                                price: new decimal_js_1.default("21.80"),
                                                brokerage: new decimal_js_1.default("10"),
                                            },
                                        ],
                                    },
                                },
                            }),
                            prisma_1.prisma.stockHolding.create({
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
                                                units: new decimal_js_1.default("80"),
                                                price: new decimal_js_1.default("23.45"),
                                                brokerage: new decimal_js_1.default("10"),
                                            },
                                        ],
                                    },
                                },
                            }),
                        ])];
                case 12:
                    stockHoldings = _b.sent();
                    console.log("\u2705 Created ".concat(stockHoldings.length, " stock holdings"));
                    // 6. Crypto Holdings
                    console.log("\n₿ Creating crypto holdings...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.cryptoHolding.create({
                                data: {
                                    settingsId: settings.id,
                                    ticker: "BTC",
                                    name: "Bitcoin",
                                    targetAllocation: new decimal_js_1.default("0.03"),
                                    sortOrder: 0,
                                    purchases: {
                                        create: [
                                            {
                                                date: new Date("2023-01-15"),
                                                units: new decimal_js_1.default("0.5"),
                                                price: new decimal_js_1.default("26500"),
                                                brokerage: new decimal_js_1.default("50"),
                                            },
                                            {
                                                date: new Date("2024-03-01"),
                                                units: new decimal_js_1.default("0.3"),
                                                price: new decimal_js_1.default("42000"),
                                                brokerage: new decimal_js_1.default("75"),
                                            },
                                        ],
                                    },
                                },
                            }),
                            prisma_1.prisma.cryptoHolding.create({
                                data: {
                                    settingsId: settings.id,
                                    ticker: "ETH",
                                    name: "Ethereum",
                                    targetAllocation: new decimal_js_1.default("0.02"),
                                    sortOrder: 1,
                                    purchases: {
                                        create: [
                                            {
                                                date: new Date("2023-06-20"),
                                                units: new decimal_js_1.default("5"),
                                                price: new decimal_js_1.default("1850"),
                                                brokerage: new decimal_js_1.default("30"),
                                            },
                                        ],
                                    },
                                },
                            }),
                        ])];
                case 13:
                    cryptoHoldings = _b.sent();
                    console.log("\u2705 Created ".concat(cryptoHoldings.length, " crypto holdings"));
                    // 7. Property
                    console.log("\n🏠 Creating property...");
                    return [4 /*yield*/, prisma_1.prisma.property.create({
                            data: {
                                settingsId: settings.id,
                                name: "Principal Place of Residence",
                                purchaseDate: new Date("2019-07-01"),
                                isPrimaryResidence: true,
                                purchaseValue: new decimal_js_1.default("650000"),
                                currentValue: new decimal_js_1.default("850000"),
                                mortgageStartDate: new Date("2019-07-01"),
                                mortgageAnnualRate: new decimal_js_1.default("0.045"),
                                mortgageStartBalance: new decimal_js_1.default("520000"),
                                mortgageCurrentBalance: new decimal_js_1.default("420000"),
                                mortgageMonthlyPayment: new decimal_js_1.default("2680"),
                                sortOrder: 0,
                                incomeEntries: {
                                    create: [],
                                },
                                expenseEntries: {
                                    create: [
                                        {
                                            date: new Date("2024-07-01"),
                                            category: "Council Rates",
                                            amount: new decimal_js_1.default("400"),
                                            frequency: "quarterly",
                                        },
                                        {
                                            date: new Date("2024-07-01"),
                                            category: "Home & Building Insurance",
                                            amount: new decimal_js_1.default("1200"),
                                            frequency: "annual",
                                        },
                                        {
                                            date: new Date("2024-07-01"),
                                            category: "Maintenance & Repairs",
                                            amount: new decimal_js_1.default("150"),
                                            frequency: "monthly",
                                        },
                                    ],
                                },
                            },
                        })];
                case 14:
                    property = _b.sent();
                    console.log("\u2705 Created property: ".concat(property.name));
                    // 8. Investment Property
                    console.log("\n🏘️  Creating investment property...");
                    return [4 /*yield*/, prisma_1.prisma.property.create({
                            data: {
                                settingsId: settings.id,
                                name: "Investment Property - Unit",
                                purchaseDate: new Date("2021-03-15"),
                                isPrimaryResidence: false,
                                purchaseValue: new decimal_js_1.default("480000"),
                                currentValue: new decimal_js_1.default("580000"),
                                netRentProfit: new decimal_js_1.default("150"),
                                mortgageStartDate: new Date("2021-03-15"),
                                mortgageAnnualRate: new decimal_js_1.default("0.0425"),
                                mortgageStartBalance: new decimal_js_1.default("384000"),
                                mortgageCurrentBalance: new decimal_js_1.default("330000"),
                                mortgageMonthlyPayment: new decimal_js_1.default("1950"),
                                sortOrder: 1,
                                incomeEntries: {
                                    create: [
                                        {
                                            date: new Date("2024-01-01"),
                                            grossRent: new decimal_js_1.default("2400"),
                                            frequency: "monthly",
                                        },
                                        {
                                            date: new Date("2024-02-01"),
                                            grossRent: new decimal_js_1.default("2400"),
                                            frequency: "monthly",
                                        },
                                        {
                                            date: new Date("2024-03-01"),
                                            grossRent: new decimal_js_1.default("2400"),
                                            frequency: "monthly",
                                        },
                                    ],
                                },
                                expenseEntries: {
                                    create: [
                                        {
                                            date: new Date("2024-01-01"),
                                            category: "Council Rates",
                                            amount: new decimal_js_1.default("280"),
                                            frequency: "quarterly",
                                        },
                                        {
                                            date: new Date("2024-01-01"),
                                            category: "Landlord Insurance",
                                            amount: new decimal_js_1.default("45"),
                                            frequency: "monthly",
                                        },
                                        {
                                            date: new Date("2024-01-01"),
                                            category: "Body Corporate",
                                            amount: new decimal_js_1.default("120"),
                                            frequency: "monthly",
                                        },
                                    ],
                                },
                            },
                        })];
                case 15:
                    investmentProperty = _b.sent();
                    console.log("\u2705 Created property: ".concat(investmentProperty.name));
                    // 9. Super Account
                    console.log("\n👴 Creating super account...");
                    return [4 /*yield*/, prisma_1.prisma.superAccount.create({
                            data: {
                                settingsId: settings.id,
                                name: "Industry Super Fund",
                                provider: "Industry Super",
                                balance: new decimal_js_1.default("285000"),
                                sortOrder: 0,
                            },
                        })];
                case 16:
                    superAccount = _b.sent();
                    console.log("\u2705 Created super account: ".concat(superAccount.name));
                    // 10. Dividends
                    console.log("\n💰 Creating dividend records...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.dividend.create({
                                data: {
                                    settingsId: settings.id,
                                    paymentDate: new Date("2024-03-15"),
                                    ticker: "CBA",
                                    holdingType: "stock",
                                    reinvested: true,
                                    netAmount: new decimal_js_1.default("180.50"),
                                },
                            }),
                            prisma_1.prisma.dividend.create({
                                data: {
                                    settingsId: settings.id,
                                    paymentDate: new Date("2024-04-01"),
                                    ticker: "VDHG",
                                    holdingType: "etf",
                                    reinvested: true,
                                    netAmount: new decimal_js_1.default("423.75"),
                                },
                            }),
                            prisma_1.prisma.dividend.create({
                                data: {
                                    settingsId: settings.id,
                                    paymentDate: new Date("2024-05-20"),
                                    ticker: "VAS",
                                    holdingType: "etf",
                                    reinvested: false,
                                    netAmount: new decimal_js_1.default("287.30"),
                                },
                            }),
                        ])];
                case 17:
                    dividends = _b.sent();
                    console.log("\u2705 Created ".concat(dividends.length, " dividend records"));
                    // 11. Budget Categories & Types
                    console.log("\n📋 Creating budget categories & types...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.budgetType.create({
                                data: { settingsId: settings.id, name: "Needs", sortOrder: 0 },
                            }),
                            prisma_1.prisma.budgetType.create({
                                data: { settingsId: settings.id, name: "Wants", sortOrder: 1 },
                            }),
                            prisma_1.prisma.budgetType.create({
                                data: { settingsId: settings.id, name: "Savings", sortOrder: 2 },
                            }),
                        ])];
                case 18:
                    budgetTypes = _b.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.budgetCategory.create({
                                data: { settingsId: settings.id, name: "Groceries", sortOrder: 0 },
                            }),
                            prisma_1.prisma.budgetCategory.create({
                                data: { settingsId: settings.id, name: "Utilities", sortOrder: 1 },
                            }),
                            prisma_1.prisma.budgetCategory.create({
                                data: { settingsId: settings.id, name: "Transport", sortOrder: 2 },
                            }),
                            prisma_1.prisma.budgetCategory.create({
                                data: { settingsId: settings.id, name: "Entertainment", sortOrder: 3 },
                            }),
                            prisma_1.prisma.budgetCategory.create({
                                data: { settingsId: settings.id, name: "Dining Out", sortOrder: 4 },
                            }),
                        ])];
                case 19:
                    budgetCategories = _b.sent();
                    // 12. Budget Items
                    console.log("\n💳 Creating budget items...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Groceries",
                                    monthlyAmount: new decimal_js_1.default("600"),
                                    frequency: "Monthly",
                                    budgetType: "Needs",
                                    category: "Groceries",
                                    sortOrder: 0,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Electricity & Gas",
                                    monthlyAmount: new decimal_js_1.default("250"),
                                    frequency: "Monthly",
                                    budgetType: "Needs",
                                    category: "Utilities",
                                    sortOrder: 1,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Internet & Mobile",
                                    monthlyAmount: new decimal_js_1.default("120"),
                                    frequency: "Monthly",
                                    budgetType: "Needs",
                                    category: "Utilities",
                                    sortOrder: 2,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Car Registration & Insurance",
                                    monthlyAmount: new decimal_js_1.default("180"),
                                    frequency: "Monthly",
                                    budgetType: "Needs",
                                    category: "Transport",
                                    sortOrder: 3,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Petrol",
                                    monthlyAmount: new decimal_js_1.default("300"),
                                    frequency: "Monthly",
                                    budgetType: "Needs",
                                    category: "Transport",
                                    sortOrder: 4,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Gym Membership",
                                    monthlyAmount: new decimal_js_1.default("60"),
                                    frequency: "Monthly",
                                    budgetType: "Wants",
                                    category: "Entertainment",
                                    sortOrder: 5,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Dining Out & Coffee",
                                    monthlyAmount: new decimal_js_1.default("400"),
                                    frequency: "Monthly",
                                    budgetType: "Wants",
                                    category: "Dining Out",
                                    sortOrder: 6,
                                },
                            }),
                            prisma_1.prisma.budgetItem.create({
                                data: {
                                    settingsId: settings.id,
                                    name: "Subscriptions (Netflix, etc)",
                                    monthlyAmount: new decimal_js_1.default("50"),
                                    frequency: "Monthly",
                                    budgetType: "Wants",
                                    category: "Entertainment",
                                    sortOrder: 7,
                                },
                            }),
                        ])];
                case 20:
                    budgetItems = _b.sent();
                    console.log("\u2705 Created ".concat(budgetItems.length, " budget items"));
                    // 13. Side Income
                    console.log("\n💼 Creating side income entries...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.sideIncomeEntry.create({
                                data: {
                                    settingsId: settings.id,
                                    date: new Date("2024-05-31"),
                                    sideIncome: new decimal_js_1.default("500"),
                                    rentalIncome: new decimal_js_1.default("0"),
                                    notes: "Freelance web development project",
                                },
                            }),
                            prisma_1.prisma.sideIncomeEntry.create({
                                data: {
                                    settingsId: settings.id,
                                    date: new Date("2024-04-30"),
                                    sideIncome: new decimal_js_1.default("750"),
                                    rentalIncome: new decimal_js_1.default("0"),
                                    notes: "Consulting work",
                                },
                            }),
                        ])];
                case 21:
                    sideIncomeEntries = _b.sent();
                    console.log("\u2705 Created ".concat(sideIncomeEntries.length, " side income entries"));
                    // 14. Other Assets
                    console.log("\n🎨 Creating other assets...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.otherAsset.create({
                                data: {
                                    settingsId: settings.id,
                                    description: "Car (2020 Honda Civic)",
                                    purchaseDate: new Date("2020-06-15"),
                                    units: new decimal_js_1.default("1"),
                                    unitPurchasePrice: new decimal_js_1.default("28000"),
                                    liveUnitPrice: new decimal_js_1.default("18000"),
                                },
                            }),
                            prisma_1.prisma.otherAsset.create({
                                data: {
                                    settingsId: settings.id,
                                    description: "Investment Watch Collection",
                                    purchaseDate: new Date("2021-01-10"),
                                    units: new decimal_js_1.default("5"),
                                    unitPurchasePrice: new decimal_js_1.default("3000"),
                                    liveUnitPrice: new decimal_js_1.default("3500"),
                                },
                            }),
                        ])];
                case 22:
                    otherAssets = _b.sent();
                    console.log("\u2705 Created ".concat(otherAssets.length, " other assets"));
                    // 15. Monthly Snapshots
                    console.log("\n📊 Creating monthly snapshots...");
                    return [4 /*yield*/, Promise.all([
                            prisma_1.prisma.monthlySnapshot.create({
                                data: {
                                    settingsId: settings.id,
                                    snapshotDate: new Date("2024-03-31"),
                                    cashTotal: new decimal_js_1.default("92000"),
                                    etfTotal: new decimal_js_1.default("145000"),
                                    stockTotal: new decimal_js_1.default("22800"),
                                    managedFundTotal: new decimal_js_1.default("0"),
                                    cryptoTotal: new decimal_js_1.default("18500"),
                                    otherAssetsTotal: new decimal_js_1.default("24500"),
                                    superTotal: new decimal_js_1.default("280000"),
                                    propertyValue: new decimal_js_1.default("1430000"),
                                    propertyEquity: new decimal_js_1.default("930000"),
                                    mortgageBalance: new decimal_js_1.default("750000"),
                                    liabilitiesTotal: new decimal_js_1.default("750000"),
                                    salary: new decimal_js_1.default("120000"),
                                    sideIncome: new decimal_js_1.default("1250"),
                                    investmentsAdded: new decimal_js_1.default("5000"),
                                    monthlySavings: new decimal_js_1.default("7500"),
                                    savingsRate: new decimal_js_1.default("0.65"),
                                    monthlySpend: new decimal_js_1.default("4000"),
                                    totalAssets: new decimal_js_1.default("2782800"),
                                    netWorth: new decimal_js_1.default("2032800"),
                                    notes: "Q1 review - on track",
                                },
                            }),
                            prisma_1.prisma.monthlySnapshot.create({
                                data: {
                                    settingsId: settings.id,
                                    snapshotDate: new Date("2024-04-30"),
                                    cashTotal: new decimal_js_1.default("94500"),
                                    etfTotal: new decimal_js_1.default("151200"),
                                    stockTotal: new decimal_js_1.default("24100"),
                                    managedFundTotal: new decimal_js_1.default("0"),
                                    cryptoTotal: new decimal_js_1.default("19800"),
                                    otherAssetsTotal: new decimal_js_1.default("24500"),
                                    superTotal: new decimal_js_1.default("288000"),
                                    propertyValue: new decimal_js_1.default("1450000"),
                                    propertyEquity: new decimal_js_1.default("950000"),
                                    mortgageBalance: new decimal_js_1.default("745000"),
                                    liabilitiesTotal: new decimal_js_1.default("745000"),
                                    salary: new decimal_js_1.default("120000"),
                                    sideIncome: new decimal_js_1.default("750"),
                                    investmentsAdded: new decimal_js_1.default("6500"),
                                    monthlySavings: new decimal_js_1.default("8200"),
                                    savingsRate: new decimal_js_1.default("0.68"),
                                    monthlySpend: new decimal_js_1.default("3800"),
                                    totalAssets: new decimal_js_1.default("2852100"),
                                    netWorth: new decimal_js_1.default("2107100"),
                                    notes: "Strong April performance",
                                },
                            }),
                            prisma_1.prisma.monthlySnapshot.create({
                                data: {
                                    settingsId: settings.id,
                                    snapshotDate: new Date("2024-05-31"),
                                    cashTotal: new decimal_js_1.default("98000"),
                                    etfTotal: new decimal_js_1.default("158500"),
                                    stockTotal: new decimal_js_1.default("25300"),
                                    managedFundTotal: new decimal_js_1.default("0"),
                                    cryptoTotal: new decimal_js_1.default("21500"),
                                    otherAssetsTotal: new decimal_js_1.default("24500"),
                                    superTotal: new decimal_js_1.default("295000"),
                                    propertyValue: new decimal_js_1.default("1480000"),
                                    propertyEquity: new decimal_js_1.default("975000"),
                                    mortgageBalance: new decimal_js_1.default("740000"),
                                    liabilitiesTotal: new decimal_js_1.default("740000"),
                                    salary: new decimal_js_1.default("120000"),
                                    sideIncome: new decimal_js_1.default("1250"),
                                    investmentsAdded: new decimal_js_1.default("8000"),
                                    monthlySavings: new decimal_js_1.default("9000"),
                                    savingsRate: new decimal_js_1.default("0.70"),
                                    monthlySpend: new decimal_js_1.default("3600"),
                                    totalAssets: new decimal_js_1.default("2982800"),
                                    netWorth: new decimal_js_1.default("2242800"),
                                    notes: "Excellent progress towards FIRE goals",
                                },
                            }),
                        ])];
                case 23:
                    snapshots = _b.sent();
                    console.log("\u2705 Created ".concat(snapshots.length, " monthly snapshots"));
                    console.log("\n✨ Demo user seed completed successfully!");
                    console.log("\n\uD83C\uDF89 Demo account ready:");
                    console.log("   Email: ".concat(DEMO_EMAIL));
                    console.log("   Password: ".concat(DEMO_PASSWORD));
                    console.log("\n\uD83D\uDCCA Demo data includes:");
                    console.log("   \u2022 3 Bank Accounts ($92k total)");
                    console.log("   \u2022 3 ETF Holdings (VDHG, VAS, VGS)");
                    console.log("   \u2022 3 Stock Holdings (CBA, WBC, ANZ)");
                    console.log("   \u2022 2 Crypto Holdings (BTC, ETH)");
                    console.log("   \u2022 2 Properties (Primary + Investment)");
                    console.log("   \u2022 Super Account ($295k)");
                    console.log("   \u2022 5 Dividend Records");
                    console.log("   \u2022 8 Budget Items (Needs/Wants/Savings)");
                    console.log("   \u2022 2 Side Income Entries");
                    console.log("   \u2022 2 Other Assets (Car, Watch Collection)");
                    console.log("   \u2022 3 Monthly Snapshots (Mar-May 2024)");
                    console.log("\n   Net Worth: $2.24M | Monthly Savings: $9k | Savings Rate: 70%");
                    return [2 /*return*/];
            }
        });
    });
}
seedDemoUser()
    .catch(function (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
