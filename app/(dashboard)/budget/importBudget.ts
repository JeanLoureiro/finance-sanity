import { fromMonthly, toMonthly } from "./exportBudget";
import { BUDGET_FREQUENCIES } from "@/lib/schemas";

export type BudgetImportRow = {
  name: string;
  monthlyAmount: number;
  frequency: string;
  budgetType: string;
  category: string;
  bankAccount: string | null;
};

export type ParseError = { line: number; message: string };

export type BudgetParseResult = {
  rows: BudgetImportRow[];
  errors: ParseError[];
};

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/** Minimal CSV row parser — handles double-quote escaping. */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

const EXPECTED_HEADERS = ["name", "type", "category", "frequency", "amount", "bank account"];

export function parseBudgetCSV(csvText: string): BudgetParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { rows: [], errors: [{ line: 0, message: "File is empty or has no data rows." }] };
  }

  const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase().replace(/\s*\(\$\)\s*/g, "").trim());
  const missingHeaders = EXPECTED_HEADERS.filter((expected) => !headers.includes(expected));
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Missing required columns: ${missingHeaders.join(", ")}. Download the template for the correct format.` }],
    };
  }

  const nameIndex = headers.indexOf("name");
  const typeIndex = headers.indexOf("type");
  const categoryIndex = headers.indexOf("category");
  const frequencyIndex = headers.indexOf("frequency");
  const amountIndex = headers.indexOf("amount");
  const bankAccountIndex = headers.indexOf("bank account");

  const rows: BudgetImportRow[] = [];
  const errors: ParseError[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const fields = parseCSVLine(lines[lineIndex]);
    const lineNumber = lineIndex + 1;

    const name = fields[nameIndex]?.trim() ?? "";
    if (!name) {
      errors.push({ line: lineNumber, message: "Name is required." });
      continue;
    }

    const rawFrequency = fields[frequencyIndex]?.trim() || "Monthly";
    const frequency = (BUDGET_FREQUENCIES as readonly string[]).includes(rawFrequency) ? rawFrequency : "Monthly";
    if (!(BUDGET_FREQUENCIES as readonly string[]).includes(rawFrequency) && rawFrequency) {
      errors.push({ line: lineNumber, message: `Unknown frequency "${rawFrequency}", defaulting to Monthly.` });
    }

    const rawAmount = parseFloat(fields[amountIndex]?.trim() ?? "0");
    if (isNaN(rawAmount) || rawAmount < 0) {
      errors.push({ line: lineNumber, message: `Invalid amount "${fields[amountIndex]?.trim()}".` });
      continue;
    }

    rows.push({
      name,
      monthlyAmount: toMonthly(rawAmount, frequency),
      frequency,
      budgetType: fields[typeIndex]?.trim() ?? "",
      category: fields[categoryIndex]?.trim() ?? "",
      bankAccount: fields[bankAccountIndex]?.trim() || null,
    });
  }

  return { rows, errors };
}

// ---------------------------------------------------------------------------
// Template download
// ---------------------------------------------------------------------------

export function downloadBudgetTemplate(existingItems?: { name: string; budgetType: string; category: string; frequency: string; monthlyAmount: number; bankAccount: string | null }[]): void {
  const headers = ["Name", "Type", "Category", "Frequency", "Amount", "Bank Account"];
  const exampleRows = existingItems && existingItems.length > 0
    ? existingItems.slice(0, 3).map((item) => [
        item.name,
        item.budgetType,
        item.category,
        item.frequency || "Monthly",
        fromMonthly(item.monthlyAmount, item.frequency || "Monthly").toFixed(2),
        item.bankAccount ?? "",
      ])
    : [
        ["Groceries", "Essential", "Food", "Monthly", "800", ""],
        ["Rent", "Essential", "Housing", "Monthly", "2000", "Everyday Account"],
        ["Netflix", "Discretionary", "Entertainment", "Monthly", "23", ""],
      ];

  const noteRow = ["# Frequency options: Weekly, Fortnightly, Monthly, Quarterly, Annually"];
  const csv = [headers, ...exampleRows, noteRow]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
