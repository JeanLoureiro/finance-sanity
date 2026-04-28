export type BudgetItem = {
  id: string;
  name: string;
  monthlyAmount: number;
  frequency: string;
  budgetType: string;
  category: string;
  bankAccount: string | null;
};

export function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "Weekly":      return amount * 52 / 12;
    case "Fortnightly": return amount * 26 / 12;
    case "Quarterly":   return amount / 3;
    case "Annually":    return amount / 12;
    default:            return amount;
  }
}

export function fromMonthly(monthly: number, frequency: string): number {
  const validMonthly = Number(monthly) || 0;
  switch (frequency) {
    case "Weekly":      return validMonthly * 12 / 52;
    case "Fortnightly": return validMonthly * 12 / 26;
    case "Quarterly":   return validMonthly * 3;
    case "Annually":    return validMonthly * 12;
    default:            return validMonthly;
  }
}

export function safeToFixed(value: unknown, decimals: number = 2): string {
  const num = Number(value);
  return (isNaN(num) || !isFinite(num)) ? "0" : num.toFixed(decimals);
}

export function exportBudgetCSV(budgetItems: BudgetItem[], monthlyIncome: number, filename: string): void {
  const headers = ["Name", "Type", "Category", "Frequency", "Amount", "Monthly ($)", "Annual ($)", "% of Income", "Bank Account"];
  const rows = budgetItems.map((item) => {
    const displayAmount = fromMonthly(item.monthlyAmount || 0, item.frequency || "Monthly");
    const pct = monthlyIncome > 0 ? ((Number(item.monthlyAmount) / monthlyIncome) * 100).toFixed(1) + "%" : "";
    return [
      item.name,
      item.budgetType,
      item.category,
      item.frequency || "Monthly",
      safeToFixed(displayAmount, 2),
      safeToFixed(Number(item.monthlyAmount), 2),
      safeToFixed(Number(item.monthlyAmount) * 12, 2),
      pct,
      item.bankAccount ?? "",
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
