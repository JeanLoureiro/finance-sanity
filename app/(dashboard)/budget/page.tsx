"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { BUDGET_FREQUENCIES } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Trash2, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef } from "react";
import type { BudgetItemInput } from "@/lib/schemas";

type BudgetItem = {
  id: string;
  name: string;
  monthlyAmount: number;
  frequency: string;
  budgetType: string;
  category: string;
  bankAccount: string | null;
};
type LabelRow = { id: string; name: string; sortOrder: number };
type BankAccount = { id: string; name: string; bsb: string | null; accountNumber: string | null };

const FREQ_LIST = [...BUDGET_FREQUENCIES];

function toMonthly(amount: number, freq: string): number {
  switch (freq) {
    case "Weekly":      return amount * 52 / 12;
    case "Fortnightly": return amount * 26 / 12;
    case "Quarterly":   return amount / 3;
    case "Annually":    return amount / 12;
    default:            return amount; // Monthly
  }
}

function fromMonthly(monthly: number, freq: string): number {
  switch (freq) {
    case "Weekly":      return monthly * 12 / 52;
    case "Fortnightly": return monthly * 12 / 26;
    case "Quarterly":   return monthly * 3;
    case "Annually":    return monthly * 12;
    default:            return monthly; // Monthly
  }
}

function computeMonthlyIncome(netIncome: number, frequency: string): number {
  switch (frequency) {
    case "Weekly":       return netIncome * 52 / 12;
    case "2-weeks":      return netIncome * 26 / 12;
    case "4-weeks":      return netIncome * 13 / 12;
    case "Twice Monthly":return netIncome * 2;
    default:             return netIncome;
  }
}

// Inline editable cell — renders a plain select that saves on change
function SelectCell({
  value,
  options,
  onSave,
}: {
  value: string;
  options: string[];
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;

  if (editing) {
    return (
      <select
        autoFocus
        className="text-xs border rounded px-1 py-0.5 bg-background"
        defaultValue={value}
        onChange={(e) => { onSave(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
      >
        <option value="">— none —</option>
        {allOptions.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <span
      className="cursor-pointer text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
      onClick={() => setEditing(true)}
    >
      {value || <span className="italic">—</span>}
    </span>
  );
}

// A single budget item row (shared by grouped and flat views)
function ItemRow({
  item,
  monthlyIncome,
  typeNames,
  categoryNames,
  bankAccounts,
  showType,
  updateMutation,
  delMutation,
}: {
  item: BudgetItem;
  monthlyIncome: number;
  typeNames: string[];
  categoryNames: string[];
  bankAccounts: BankAccount[];
  showType: boolean;
  updateMutation: { mutate: (d: { id: string } & Partial<BudgetItemInput>) => void };
  delMutation: { mutate: (id: string) => void };
}) {
  const amountRef = useRef<HTMLInputElement>(null);
  const displayAmount = fromMonthly(item.monthlyAmount, item.frequency);
  const linkedAccount = bankAccounts.find((a) => a.name === item.bankAccount);

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20 group">
      <td className="px-4 py-2">{item.name}</td>
      {showType && (
        <td className="px-4 py-2">
          <SelectCell
            value={item.budgetType}
            options={typeNames}
            onSave={(v) => updateMutation.mutate({ id: item.id, budgetType: v })}
          />
        </td>
      )}
      <td className="px-4 py-2">
        <SelectCell
          value={item.category}
          options={categoryNames}
          onSave={(v) => updateMutation.mutate({ id: item.id, category: v })}
        />
      </td>
      <td className="px-4 py-2">
        <SelectCell
          value={item.frequency || "Monthly"}
          options={FREQ_LIST}
          onSave={(v) => {
            // When frequency changes, re-express the current display amount in the new frequency
            const currentDisplay = fromMonthly(item.monthlyAmount, item.frequency);
            updateMutation.mutate({
              id: item.id,
              frequency: v,
              monthlyAmount: toMonthly(currentDisplay, v),
            });
          }}
        />
      </td>
      <td className="px-4 py-2 text-right">
        {/* Amount shown in the item's own frequency */}
        <input
          key={item.frequency}
          ref={amountRef}
          className="text-right w-28 bg-transparent border-b border-transparent group-hover:border-border outline-none text-sm"
          type="number"
          defaultValue={Number(displayAmount.toFixed(2))}
          onBlur={(e) => {
            const monthly = toMonthly(Number(e.target.value), item.frequency);
            updateMutation.mutate({ id: item.id, monthlyAmount: monthly });
          }}
        />
      </td>
      <td className="px-4 py-2 text-right text-muted-foreground text-sm">
        <CurrencyAmount value={item.monthlyAmount} />
      </td>
      <td className="px-4 py-2 text-right text-muted-foreground text-sm">
        {monthlyIncome > 0 ? `${(item.monthlyAmount / monthlyIncome * 100).toFixed(1)}%` : "—"}
      </td>
      <td className="px-4 py-2 text-right text-muted-foreground text-sm">
        <CurrencyAmount value={item.monthlyAmount / 4.33} />
      </td>
      <td className="px-4 py-2 text-right text-muted-foreground text-sm">
        <CurrencyAmount value={item.monthlyAmount * 12} />
      </td>
      <td className="px-4 py-2 min-w-[140px]">
        <SelectCell
          value={item.bankAccount ?? ""}
          options={bankAccounts.map((a) => a.name)}
          onSave={(v) => updateMutation.mutate({ id: item.id, bankAccount: v || null })}
        />
        {linkedAccount && (linkedAccount.bsb || linkedAccount.accountNumber) && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
            {linkedAccount.bsb && <span>BSB {linkedAccount.bsb}</span>}
            {linkedAccount.bsb && linkedAccount.accountNumber && <span> · </span>}
            {linkedAccount.accountNumber && <span>ACC {linkedAccount.accountNumber}</span>}
          </p>
        )}
      </td>
      <td className="px-2">
        <Button size="sm" variant="ghost" onClick={() => delMutation.mutate(item.id)}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </td>
    </tr>
  );
}

function TableHead({ showType }: { showType: boolean }) {
  return (
    <thead className="bg-muted/50 border-b text-sm">
      <tr>
        <th className="text-left px-4 py-2">Name</th>
        {showType && <th className="text-left px-4 py-2">Type</th>}
        <th className="text-left px-4 py-2">Category</th>
        <th className="text-left px-4 py-2">Frequency</th>
        <th className="text-right px-4 py-2">Amount</th>
        <th className="text-right px-4 py-2">Monthly</th>
        <th className="text-right px-4 py-2">% of Income</th>
        <th className="text-right px-4 py-2">Weekly</th>
        <th className="text-right px-4 py-2">Annual</th>
        <th className="text-left px-4 py-2">Bank Account</th>
        <th className="w-10" />
      </tr>
    </thead>
  );
}

function TotalRow({
  total,
  monthlyIncome,
  showType,
}: {
  total: number;
  monthlyIncome: number;
  showType: boolean;
}) {
  // Name + [Type] + Category + Frequency + Amount = 4 or 5 cols before Monthly
  const spanCols = showType ? 5 : 4;
  return (
    <tr className="bg-muted/50 font-semibold text-sm">
      <td className="px-4 py-2" colSpan={spanCols}>Total</td>
      <td className="px-4 py-2 text-right"><CurrencyAmount value={total} /></td>
      <td className="px-4 py-2 text-right">
        {monthlyIncome > 0 ? `${(total / monthlyIncome * 100).toFixed(1)}%` : "—"}
      </td>
      <td className="px-4 py-2 text-right"><CurrencyAmount value={total / 4.33} /></td>
      <td className="px-4 py-2 text-right"><CurrencyAmount value={total * 12} /></td>
      <td colSpan={2} />
    </tr>
  );
}

// Manage panel for types or categories
function ManagePanel({
  label,
  items,
  addMutation,
  deleteMutation,
}: {
  label: string;
  items: LabelRow[];
  addMutation: { mutate: (name: string) => void; isPending: boolean };
  deleteMutation: { mutate: (id: string) => void };
}) {
  const [newName, setNewName] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm py-0.5">
            <span>{item.name}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5"
              onClick={() => deleteMutation.mutate(item.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-muted-foreground italic">No {label.toLowerCase()} yet</li>}
      </ul>
      <div className="flex gap-2">
        <Input
          className="h-8 text-sm flex-1"
          placeholder={`New ${label.toLowerCase().replace(/s$/, "")}…`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              addMutation.mutate(newName.trim());
              setNewName("");
            }
          }}
        />
        <Button
          size="sm"
          disabled={!newName.trim() || addMutation.isPending}
          onClick={() => { addMutation.mutate(newName.trim()); setNewName(""); }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<BudgetItem[]>({
    queryKey: queryKeys.budget.items(),
    queryFn: () => fetch("/api/budget").then((r) => r.json()),
  });
  const { data: budgetTypes = [] } = useQuery<LabelRow[]>({
    queryKey: queryKeys.budget.types(),
    queryFn: () => fetch("/api/budget/types").then((r) => r.json()),
  });
  const { data: budgetCategories = [] } = useQuery<LabelRow[]>({
    queryKey: queryKeys.budget.categories(),
    queryFn: () => fetch("/api/budget/categories").then((r) => r.json()),
  });
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: queryKeys.cash.accounts(),
    queryFn: () => fetch("/api/cash").then((r) => r.json()),
  });
  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const typeNames = budgetTypes.map((t) => t.name);
  const categoryNames = budgetCategories.map((c) => c.name);

  const delMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/budget/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.items() }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<BudgetItemInput>) =>
      fetch(`/api/budget/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.items() }),
  });

  // Add item form state
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addFrequency, setAddFrequency] = useState("Monthly");
  const [addType, setAddType] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addBankAccount, setAddBankAccount] = useState("");

  const addMutation = useMutation({
    mutationFn: (data: BudgetItemInput) =>
      fetch("/api/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budget.items() });
      setAddName(""); setAddAmount(""); setAddFrequency("Monthly");
      setAddType(""); setAddCategory(""); setAddBankAccount("");
    },
  });

  // Budget type management
  const addTypeMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/budget/types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.types() }),
  });
  const delTypeMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/budget/types/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.types() }),
  });

  // Category management
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/budget/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.categories() }),
  });
  const delCategoryMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/budget/categories/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.categories() }),
  });

  // View mode (persisted)
  const [viewMode, setViewMode] = useState<"grouped" | "flat">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("budget-view-mode") as "grouped" | "flat") ?? "grouped";
    }
    return "grouped";
  });
  const [activeTypeFilter, setActiveTypeFilter] = useState("All");
  const [showManage, setShowManage] = useState(false);

  const monthlyIncome = settings
    ? computeMonthlyIncome(Number(settings.netIncome), settings.salaryFrequency)
    : 0;
  const totalExpenses = items.reduce((s, i) => s + i.monthlyAmount, 0);
  const monthlySavings = monthlyIncome - totalExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
  const emergencyTarget = (settings?.emergencyFundMonths ?? 6) * totalExpenses;

  // Per-type breakdown for summary
  const typeBreakdown = typeNames
    .map((type) => {
      const typeItems = items.filter((i) => i.budgetType === type);
      const total = typeItems.reduce((s, i) => s + i.monthlyAmount, 0);
      return { type, total, pct: monthlyIncome > 0 ? total / monthlyIncome : 0 };
    })
    .filter((t) => t.total > 0);

  // For grouped view
  const groupedItems = typeNames
    .map((type) => ({ type, items: items.filter((i) => i.budgetType === type) }))
    .filter((g) => g.items.length > 0);
  const untypedItems = items.filter((i) => !i.budgetType);

  // For flat view
  const filteredItems = activeTypeFilter === "All"
    ? items
    : items.filter((i) => i.budgetType === activeTypeFilter);

  const handleViewMode = (mode: "grouped" | "flat") => {
    setViewMode(mode);
    localStorage.setItem("budget-view-mode", mode);
  };

  const rowProps = {
    monthlyIncome,
    typeNames,
    categoryNames,
    bankAccounts,
    updateMutation,
    delMutation,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Budget</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Income", value: monthlyIncome },
          { label: "Total Expenses", value: totalExpenses },
          { label: "Monthly Savings", value: monthlySavings, highlight: true },
          { label: "Savings Rate", value: null, pct: savingsRate },
        ].map(({ label, value, pct, highlight }) => (
          <Card key={label} className={highlight && monthlySavings > 0 ? "border-green-500" : ""}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${highlight ? (monthlySavings > 0 ? "text-green-600" : "text-red-500") : ""}`}>
                {pct !== undefined
                  ? `${(pct * 100).toFixed(1)}%`
                  : <CurrencyAmount value={value} />}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Annual Expenses</p>
          <p className="text-xl font-bold"><CurrencyAmount value={totalExpenses * 12} /></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Emergency Fund Target ({settings?.emergencyFundMonths ?? 6} months)</p>
          <p className="text-xl font-bold"><CurrencyAmount value={emergencyTarget} /></p>
        </CardContent></Card>
      </div>

      {/* Per-type breakdown */}
      {typeBreakdown.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Spending Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {typeBreakdown.map(({ type, total, pct }) => (
              <Card key={type}>
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground truncate">{type}</p>
                  <p className="text-base font-bold"><CurrencyAmount value={total} /></p>
                  <p className="text-xs text-muted-foreground">{(pct * 100).toFixed(1)}% of income</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => handleViewMode(v as "grouped" | "flat")}>
          <TabsList>
            <TabsTrigger value="grouped">Grouped</TabsTrigger>
            <TabsTrigger value="flat">Flat Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Items table */}
      {isLoading ? (
        <Card><CardContent className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent></Card>
      ) : viewMode === "grouped" ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Expense Items</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <TableHead showType={false} />
              <tbody>
                {groupedItems.map(({ type, items: groupItems }) => {
                  const groupTotal = groupItems.reduce((s, i) => s + i.monthlyAmount, 0);
                  return (
                    <>
                      <tr key={`group-${type}`} className="bg-muted/40 border-b border-t">
                        <td colSpan={8} className="px-4 py-1.5">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-xs uppercase tracking-wide">{type}</span>
                            <Badge variant="outline" className="text-xs h-5">{groupItems.length} item{groupItems.length !== 1 ? "s" : ""}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              <CurrencyAmount value={groupTotal} />
                              {monthlyIncome > 0 && ` · ${(groupTotal / monthlyIncome * 100).toFixed(1)}%`}
                            </span>
                          </div>
                        </td>
                        <td colSpan={3} />
                      </tr>
                      {groupItems.map((item) => (
                        <ItemRow key={item.id} item={item} showType={false} {...rowProps} />
                      ))}
                    </>
                  );
                })}
                {untypedItems.length > 0 && (
                  <>
                    <tr className="bg-muted/40 border-b border-t">
                      <td colSpan={11} className="px-4 py-1.5">
                        <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Uncategorised</span>
                      </td>
                    </tr>
                    {untypedItems.map((item) => (
                      <ItemRow key={item.id} item={item} showType={false} {...rowProps} />
                    ))}
                  </>
                )}
                {items.length > 0 && (
                  <TotalRow total={totalExpenses} monthlyIncome={monthlyIncome} showType={false} />
                )}
                {items.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No budget items yet</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base mr-2">Expense Items</CardTitle>
              {["All", ...typeNames].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTypeFilter(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeTypeFilter === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <TableHead showType={true} />
              <tbody>
                {filteredItems.map((item) => (
                  <ItemRow key={item.id} item={item} showType={true} {...rowProps} />
                ))}
                {filteredItems.length > 0 && (
                  <TotalRow
                    total={filteredItems.reduce((s, i) => s + i.monthlyAmount, 0)}
                    monthlyIncome={monthlyIncome}
                    showType={true}
                  />
                )}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">No items</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add item */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Item</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap items-end">
            <Input
              className="flex-1 min-w-36"
              placeholder="Name (e.g. Groceries)"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
            <div className="flex gap-1 items-center">
              <Input
                type="number"
                className="w-28"
                placeholder="Amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
              <select
                className="h-9 text-sm border rounded-md px-2 bg-background"
                value={addFrequency}
                onChange={(e) => setAddFrequency(e.target.value)}
              >
                {FREQ_LIST.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <select
              className="h-9 text-sm border rounded-md px-2 bg-background"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
            >
              <option value="">Type…</option>
              {typeNames.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="h-9 text-sm border rounded-md px-2 bg-background"
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
            >
              <option value="">Category…</option>
              {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="h-9 text-sm border rounded-md px-2 bg-background"
              value={addBankAccount}
              onChange={(e) => setAddBankAccount(e.target.value)}
            >
              <option value="">Bank account…</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.name}>{a.name}{a.bsb ? ` (${a.bsb})` : ""}</option>
              ))}
            </select>
            <Button
              disabled={!addName.trim() || addMutation.isPending}
              onClick={() => {
                addMutation.mutate({
                  name: addName.trim(),
                  monthlyAmount: toMonthly(parseFloat(addAmount) || 0, addFrequency),
                  frequency: addFrequency,
                  budgetType: addType,
                  category: addCategory,
                  bankAccount: addBankAccount || null,
                });
              }}
            >
              {addMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manage Types & Categories */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center gap-2 text-base font-semibold w-full text-left"
            onClick={() => setShowManage((v) => !v)}
          >
            {showManage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Manage Types &amp; Categories
          </button>
        </CardHeader>
        {showManage && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ManagePanel
                label="Budget Types"
                items={budgetTypes}
                addMutation={{ mutate: addTypeMutation.mutate, isPending: addTypeMutation.isPending }}
                deleteMutation={{ mutate: delTypeMutation.mutate }}
              />
              <ManagePanel
                label="Expense Categories"
                items={budgetCategories}
                addMutation={{ mutate: addCategoryMutation.mutate, isPending: addCategoryMutation.isPending }}
                deleteMutation={{ mutate: delCategoryMutation.mutate }}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
