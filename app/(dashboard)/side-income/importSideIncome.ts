export type SideIncomeImportRow = {
  date: string; // YYYY-MM-DD
  sideIncome: number;
  rentalIncome: number;
  notes: string | null;
};

export type ParseError = { line: number; message: string };

export type SideIncomeParseResult = {
  rows: SideIncomeImportRow[];
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

/** Accepts DD/MM/YYYY or YYYY-MM-DD and returns YYYY-MM-DD, or null if unparseable. */
function normaliseDate(raw: string): string | null {
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (isoPattern.test(raw)) return raw;

  const auPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = raw.match(auPattern);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

const EXPECTED_HEADERS = ["date", "side income", "rental income"];

export function parseSideIncomeCSV(csvText: string): SideIncomeParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { rows: [], errors: [{ line: 0, message: "File is empty or has no data rows." }] };
  }

  const headers = parseCSVLine(lines[0]).map((header) =>
    header.toLowerCase().replace(/\s*\(\$\)\s*/g, "").trim()
  );

  const missingHeaders = EXPECTED_HEADERS.filter((expected) => !headers.includes(expected));
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Missing required columns: ${missingHeaders.join(", ")}. Download the template for the correct format.` }],
    };
  }

  const dateIndex = headers.indexOf("date");
  const sideIncomeIndex = headers.indexOf("side income");
  const rentalIncomeIndex = headers.indexOf("rental income");
  const notesIndex = headers.indexOf("notes");

  const rows: SideIncomeImportRow[] = [];
  const errors: ParseError[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (line.startsWith("#")) continue;

    const fields = parseCSVLine(line);
    const lineNumber = lineIndex + 1;

    const rawDate = fields[dateIndex]?.trim() ?? "";
    const isoDate = normaliseDate(rawDate);
    if (!isoDate) {
      errors.push({ line: lineNumber, message: `Invalid date "${rawDate}". Use YYYY-MM-DD or DD/MM/YYYY.` });
      continue;
    }

    const rawSideIncome = parseFloat(fields[sideIncomeIndex]?.trim() ?? "0");
    if (isNaN(rawSideIncome) || rawSideIncome < 0) {
      errors.push({ line: lineNumber, message: `Invalid side income "${fields[sideIncomeIndex]?.trim()}".` });
      continue;
    }

    const rawRentalIncome = parseFloat(fields[rentalIncomeIndex]?.trim() ?? "0");
    if (isNaN(rawRentalIncome) || rawRentalIncome < 0) {
      errors.push({ line: lineNumber, message: `Invalid rental income "${fields[rentalIncomeIndex]?.trim()}".` });
      continue;
    }

    rows.push({
      date: isoDate,
      sideIncome: rawSideIncome,
      rentalIncome: rawRentalIncome,
      notes: notesIndex >= 0 ? fields[notesIndex]?.trim() || null : null,
    });
  }

  return { rows, errors };
}

// ---------------------------------------------------------------------------
// Template download
// ---------------------------------------------------------------------------

export function downloadSideIncomeTemplate(): void {
  const headers = ["Date", "Side Income ($)", "Rental Income ($)", "Notes"];
  const exampleRows = [
    ["2025-07-01", "500", "0", "Freelance project"],
    ["2025-08-15", "0", "1200", "Monthly rental"],
    ["2025-09-01", "750", "1200", ""],
  ];
  const csv = [headers, ...exampleRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "side-income-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
