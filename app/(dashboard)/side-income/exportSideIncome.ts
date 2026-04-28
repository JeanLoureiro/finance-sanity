export type SideIncomeEntry = {
  id: string;
  date: string;
  sideIncome: string | number;
  rentalIncome: string | number;
  notes: string | null;
};

export function exportSideIncomeCSV(sideIncomeEntries: SideIncomeEntry[], fyLabel: string): void {
  const headers = ["Date", "Side Income ($)", "Rental Income ($)", "Total ($)", "Notes"];
  const rows = sideIncomeEntries.map((entry) => {
    const total = Number(entry.sideIncome) + Number(entry.rentalIncome);
    return [
      new Date(entry.date).toLocaleDateString("en-AU"),
      Number(entry.sideIncome).toFixed(2),
      Number(entry.rentalIncome).toFixed(2),
      total.toFixed(2),
      entry.notes ?? "",
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `side-income-${fyLabel.replace(/\s/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
