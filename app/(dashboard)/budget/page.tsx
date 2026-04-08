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
import { Trash2, PlusCircle, ChevronDown, ChevronUp, SlidersHorizontal, X, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useRef } from "react";
import type { BudgetItemInput } from "@/lib/schemas";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

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

// ---------------------------------------------------------------------------
// Frequency helpers
// ---------------------------------------------------------------------------
const FREQ_LIST = [...BUDGET_FREQUENCIES];

function toMonthly(amount: number, freq: string): number {
  switch (freq) {
    case "Weekly":      return amount * 52 / 12;
    case "Fortnightly": return amount * 26 / 12;
    case "Quarterly":   return amount / 3;
    case "Annually":    return amount / 12;
    default:            return amount;
  }
}

function fromMonthly(monthly: number, freq: string): number {
  switch (freq) {
    case "Weekly":      return monthly * 12 / 52;
    case "Fortnightly": return monthly * 12 / 26;
    case "Quarterly":   return monthly * 3;
    case "Annually":    return monthly * 12;
    default:            return monthly;
  }
}

function computeMonthlyIncome(netIncome: number, frequency: string): number {
  switch (frequency) {
    case "Weekly":        return netIncome * 52 / 12;
    case "2-weeks":       return netIncome * 26 / 12;
    case "4-weeks":       return netIncome * 13 / 12;
    case "Twice Monthly": return netIncome * 2;
    default:              return netIncome;
  }
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------
type SortBy = "name" | "monthly" | "annual" | "pct";
type SortDir = "asc" | "desc";

type FilterState = {
  search: string;
  types: string[];
  categories: string[];
  frequencies: string[];
  bankAccounts: string[];
  amountMin: string;
  amountMax: string;
  sortBy: SortBy;
  sortDir: SortDir;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  types: [],
  categories: [],
  frequencies: [],
  bankAccounts: [],
  amountMin: "",
  amountMax: "",
  sortBy: "name",
  sortDir: "asc",
};

function countActiveFilters(f: FilterState): number {
  return (
    (f.search.trim() ? 1 : 0) +
    f.types.length +
    f.categories.length +
    f.frequencies.length +
    f.bankAccounts.length +
    (f.amountMin ? 1 : 0) +
    (f.amountMax ? 1 : 0)
  );
}

function applyFilters(items: BudgetItem[], f: FilterState, monthlyIncome: number): BudgetItem[] {
  let result = [...items];

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter((i) => i.name.toLowerCase().includes(q));
  }
  if (f.types.length) {
    result = result.filter((i) => f.types.includes(i.budgetType));
  }
  if (f.categories.length) {
    result = result.filter((i) => f.categories.includes(i.category));
  }
  if (f.frequencies.length) {
    result = result.filter((i) => f.frequencies.includes(i.frequency || "Monthly"));
  }
  if (f.bankAccounts.length) {
    result = result.filter((i) => {
      if (!i.bankAccount) return f.bankAccounts.includes("(No Account)");
      return f.bankAccounts.includes(i.bankAccount);
    });
  }
  if (f.amountMin) {
    const min = parseFloat(f.amountMin);
    if (!isNaN(min)) result = result.filter((i) => i.monthlyAmount >= min);
  }
  if (f.amountMax) {
    const max = parseFloat(f.amountMax);
    if (!isNaN(max)) result = result.filter((i) => i.monthlyAmount <= max);
  }

  result.sort((a, b) => {
    let diff = 0;
    switch (f.sortBy) {
      case "name":    diff = a.name.localeCompare(b.name); break;
      case "monthly": diff = a.monthlyAmount - b.monthlyAmount; break;
      case "annual":  diff = (a.monthlyAmount - b.monthlyAmount) * 12; break;
      case "pct":     diff = monthlyIncome > 0 ? a.monthlyAmount - b.monthlyAmount : 0; break;
    }
    return f.sortDir === "asc" ? diff : -diff;
  });

  return result;
}

// ---------------------------------------------------------------------------
// Filter panel sub-components
// ---------------------------------------------------------------------------
function FilterChips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selected.includes(o)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  onChange,
  onClear,
  typeNames,
  categoryNames,
  bankAccountNames,
  hasNoAccountItems,
}: {
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onClear: () => void;
  typeNames: string[];
  categoryNames: string[];
  bankAccountNames: string[];
  hasNoAccountItems: boolean;
}) {
  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const bankOptions = [
    ...bankAccountNames,
    ...(hasNoAccountItems ? ["(No Account)"] : []),
  ];

  const activeCount = countActiveFilters(filters);

  return (
    <Card className="border-primary/20 bg-muted/10">
      <CardContent className="pt-4 space-y-5">
        {/* Row 1: search + sort + clear */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search by name…"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
            />
            {filters.search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => onChange({ search: "" })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Sort by</p>
            <select
              className="h-8 text-xs border rounded-md px-2 bg-background"
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as SortBy })}
            >
              <option value="name">Name</option>
              <option value="monthly">Monthly $</option>
              <option value="annual">Annual $</option>
              <option value="pct">% of Income</option>
            </select>
            <button
              title={filters.sortDir === "asc" ? "Ascending" : "Descending"}
              onClick={() => onChange({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })}
              className="h-8 w-8 flex items-center justify-center border rounded-md hover:bg-muted transition-colors"
            >
              {filters.sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {activeCount > 0 && (
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-muted-foreground" onClick={onClear}>
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>

        {/* Row 2: multi-select chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterChips
            label="Type"
            options={typeNames}
            selected={filters.types}
            onToggle={(v) => onChange({ types: toggleArr(filters.types, v) })}
          />
          <FilterChips
            label="Category"
            options={categoryNames}
            selected={filters.categories}
            onToggle={(v) => onChange({ categories: toggleArr(filters.categories, v) })}
          />
          <FilterChips
            label="Frequency"
            options={FREQ_LIST}
            selected={filters.frequencies}
            onToggle={(v) => onChange({ frequencies: toggleArr(filters.frequencies, v) })}
          />
          <FilterChips
            label="Bank Account"
            options={bankOptions}
            selected={filters.bankAccounts}
            onToggle={(v) => onChange({ bankAccounts: toggleArr(filters.bankAccounts, v) })}
          />
        </div>

        {/* Row 3: amount range */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly amount</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min $</span>
            <Input
              type="number"
              className="h-8 w-28 text-sm"
              placeholder="0"
              value={filters.amountMin}
              onChange={(e) => onChange({ amountMin: e.target.value })}
            />
          </div>
          <span className="text-muted-foreground text-sm">—</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Max $</span>
            <Input
              type="number"
              className="h-8 w-28 text-sm"
              placeholder="any"
              value={filters.amountMax}
              onChange={(e) => onChange({ amountMax: e.target.value })}
            />
          </div>
          {(filters.amountMin || filters.amountMax) && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onChange({ amountMin: "", amountMax: "" })}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Active filter summary chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t">
            <span className="text-[11px] text-muted-foreground self-center">Active:</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Search: "{filters.search}"
                <button onClick={() => onChange({ search: "" })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.types.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Type: {t}
                <button onClick={() => onChange({ types: filters.types.filter((x) => x !== t) })}><X className="h-3 w-3" /></button>
              </span>
            ))}
            {filters.categories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Cat: {c}
                <button onClick={() => onChange({ categories: filters.categories.filter((x) => x !== c) })}><X className="h-3 w-3" /></button>
              </span>
            ))}
            {filters.frequencies.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Freq: {f}
                <button onClick={() => onChange({ frequencies: filters.frequencies.filter((x) => x !== f) })}><X className="h-3 w-3" /></button>
              </span>
            ))}
            {filters.bankAccounts.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Bank: {b}
                <button onClick={() => onChange({ bankAccounts: filters.bankAccounts.filter((x) => x !== b) })}><X className="h-3 w-3" /></button>
              </span>
            ))}
            {filters.amountMin && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Min: ${filters.amountMin}/mo
                <button onClick={() => onChange({ amountMin: "" })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.amountMax && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                Max: ${filters.amountMax}/mo
                <button onClick={() => onChange({ amountMax: "" })}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inline editable cell
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Editable plain-text cell (for name)
// ---------------------------------------------------------------------------
function EditableTextCell({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        className="text-sm border rounded px-1 py-0.5 bg-background w-full min-w-[120px] outline-none focus:ring-1 focus:ring-primary"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
            setEditing(false);
          }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
      />
    );
  }
  return (
    <span
      className="cursor-pointer hover:underline underline-offset-2 hover:text-primary"
      title="Click to edit name"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || <span className="italic text-muted-foreground">—</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Item row
// ---------------------------------------------------------------------------
function ItemRow({
  item,
  monthlyIncome,
  typeNames,
  categoryNames,
  bankAccounts,
  showType,
  updateMutation,
  onDelete,
}: {
  item: BudgetItem;
  monthlyIncome: number;
  typeNames: string[];
  categoryNames: string[];
  bankAccounts: BankAccount[];
  showType: boolean;
  updateMutation: { mutate: (d: { id: string } & Partial<BudgetItemInput>) => void };
  onDelete: (id: string) => void;
}) {
  const amountRef = useRef<HTMLInputElement>(null);
  const displayAmount = fromMonthly(item.monthlyAmount, item.frequency);
  const linkedAccount = bankAccounts.find((a) => a.name === item.bankAccount);

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20 group">
      <td className="px-4 py-2">
        <EditableTextCell
          value={item.name}
          onSave={(v) => updateMutation.mutate({ id: item.id, name: v })}
        />
      </td>
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
        <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </td>
    </tr>
  );
}

function TableHead({ showType }: { showType: boolean }) {
  return (
    <thead className="sticky top-0 z-10 text-sm border-b shadow-[0_1px_0_0_hsl(var(--border))]">
      <tr>
        <th className="text-left px-4 py-2 bg-muted/90 backdrop-blur-sm">Name</th>
        {showType && <th className="text-left px-4 py-2 bg-muted/90 backdrop-blur-sm">Type</th>}
        <th className="text-left px-4 py-2 bg-muted/90 backdrop-blur-sm">Category</th>
        <th className="text-left px-4 py-2 bg-muted/90 backdrop-blur-sm">Frequency</th>
        <th className="text-right px-4 py-2 bg-muted/90 backdrop-blur-sm">Amount</th>
        <th className="text-right px-4 py-2 bg-muted/90 backdrop-blur-sm">Monthly</th>
        <th className="text-right px-4 py-2 bg-muted/90 backdrop-blur-sm">% of Income</th>
        <th className="text-right px-4 py-2 bg-muted/90 backdrop-blur-sm">Weekly</th>
        <th className="text-right px-4 py-2 bg-muted/90 backdrop-blur-sm">Annual</th>
        <th className="text-left px-4 py-2 bg-muted/90 backdrop-blur-sm">Bank Account</th>
        <th className="w-10 bg-muted/90 backdrop-blur-sm" />
      </tr>
    </thead>
  );
}

function TotalRow({
  total,
  monthlyIncome,
  showType,
  label = "Total",
}: {
  total: number;
  monthlyIncome: number;
  showType: boolean;
  label?: string;
}) {
  const spanCols = showType ? 5 : 4;
  return (
    <tr className="bg-muted/50 font-semibold text-sm">
      <td className="px-4 py-2" colSpan={spanCols}>{label}</td>
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

// ---------------------------------------------------------------------------
// Manage panel
// ---------------------------------------------------------------------------
function ManagePanel({
  label,
  items,
  addMutation,
  onDelete,
}: {
  label: string;
  items: LabelRow[];
  addMutation: { mutate: (name: string) => void; isPending: boolean };
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm py-0.5">
            <span>{item.name}</span>
            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => onDelete(item.id)}>
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
            if (e.key === "Enter" && newName.trim()) { addMutation.mutate(newName.trim()); setNewName(""); }
          }}
        />
        <Button size="sm" disabled={!newName.trim() || addMutation.isPending} onClick={() => { addMutation.mutate(newName.trim()); setNewName(""); }}>
          Add
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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

  // Add item form
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

  // Type/Category management
  const addTypeMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/budget/types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.types() }),
  });
  const delTypeMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/budget/types/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.types() }),
  });
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/budget/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.categories() }),
  });
  const delCategoryMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/budget/categories/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget.categories() }),
  });

  // View mode
  const [viewMode, setViewMode] = useState<"grouped" | "flat">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("budget-view-mode") as "grouped" | "flat") ?? "grouped";
    }
    return "grouped";
  });
  const handleViewMode = (mode: "grouped" | "flat") => {
    setViewMode(mode);
    localStorage.setItem("budget-view-mode", mode);
  };

  // Confirm delete state
  type PendingDelete = { type: "item" | "type" | "category"; id: string; label: string } | null;
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const patchFilters = (patch: Partial<FilterState>) => setFilters((f) => ({ ...f, ...patch }));
  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  const activeFilterCount = countActiveFilters(filters);

  const [showManage, setShowManage] = useState(false);

  // Derived values
  const monthlyIncome = settings ? computeMonthlyIncome(Number(settings.netIncome), settings.salaryFrequency) : 0;
  const totalExpenses = items.reduce((s, i) => s + i.monthlyAmount, 0);
  const monthlySavings = monthlyIncome - totalExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
  const emergencyTarget = (settings?.emergencyFundMonths ?? 6) * totalExpenses;

  const typeBreakdown = typeNames
    .map((type) => {
      const typeItems = items.filter((i) => i.budgetType === type);
      const total = typeItems.reduce((s, i) => s + i.monthlyAmount, 0);
      return { type, total, pct: monthlyIncome > 0 ? total / monthlyIncome : 0 };
    })
    .filter((t) => t.total > 0);

  // Apply filters to get visible items
  const displayItems = applyFilters(items, filters, monthlyIncome);
  const displayTotal = displayItems.reduce((s, i) => s + i.monthlyAmount, 0);
  const isFiltered = activeFilterCount > 0 || filters.sortBy !== "name" || filters.sortDir !== "asc";

  // Grouped view data (from filtered set)
  const groupedItems = typeNames
    .map((type) => ({ type, items: displayItems.filter((i) => i.budgetType === type) }))
    .filter((g) => g.items.length > 0);
  const untypedItems = displayItems.filter((i) => !i.budgetType);

  // Options for filter panel
  const hasNoAccountItems = items.some((i) => !i.bankAccount);
  const bankAccountNames = bankAccounts.map((a) => a.name);

  const rowProps = {
    monthlyIncome,
    typeNames,
    categoryNames,
    bankAccounts,
    updateMutation,
    onDelete: (id: string) => {
      const item = items.find((i) => i.id === id);
      setPendingDelete({ type: "item", id, label: item?.name ?? "this item" });
    },
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
                {pct !== undefined ? `${(pct * 100).toFixed(1)}%` : <CurrencyAmount value={value} />}
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
              <Card
                key={type}
                className={`cursor-pointer transition-colors ${filters.types.includes(type) ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                onClick={() => {
                  patchFilters({ types: filters.types.includes(type) ? filters.types.filter((x) => x !== type) : [...filters.types, type] });
                  if (!showFilters) setShowFilters(true);
                }}
              >
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

      {/* View toggle + filter toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={viewMode} onValueChange={(v) => handleViewMode(v as "grouped" | "flat")}>
          <TabsList>
            <TabsTrigger value="grouped">Grouped</TabsTrigger>
            <TabsTrigger value="flat">Flat Table</TabsTrigger>
          </TabsList>
        </Tabs>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border transition-colors ${
            showFilters || activeFilterCount > 0
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 bg-primary-foreground text-primary text-xs rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={patchFilters}
          onClear={clearFilters}
          typeNames={typeNames}
          categoryNames={categoryNames}
          bankAccountNames={bankAccountNames}
          hasNoAccountItems={hasNoAccountItems}
        />
      )}

      {/* Results count */}
      {isFiltered && !isLoading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{displayItems.length}</span> of {items.length} items
            {activeFilterCount > 0 && (
              <> · <span className="font-medium text-foreground"><CurrencyAmount value={displayTotal} /></span>/mo filtered</>
            )}
          </span>
          {activeFilterCount > 0 && (
            <button className="text-xs hover:text-foreground underline" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

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
                {displayItems.length > 0 && (
                  <TotalRow
                    total={displayTotal}
                    monthlyIncome={monthlyIncome}
                    showType={false}
                    label={isFiltered ? `Total (${displayItems.length} items)` : "Total"}
                  />
                )}
                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                      {items.length === 0 ? "No budget items yet" : "No items match the current filters"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <TableHead showType={true} />
              <tbody>
                {displayItems.map((item) => (
                  <ItemRow key={item.id} item={item} showType={true} {...rowProps} />
                ))}
                {displayItems.length > 0 && (
                  <TotalRow
                    total={displayTotal}
                    monthlyIncome={monthlyIncome}
                    showType={true}
                    label={isFiltered ? `Total (${displayItems.length} items)` : "Total"}
                  />
                )}
                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">
                      {items.length === 0 ? "No budget items yet" : "No items match the current filters"}
                    </td>
                  </tr>
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
                onDelete={(id) => {
                  const t = budgetTypes.find((x) => x.id === id);
                  setPendingDelete({ type: "type", id, label: t?.name ?? "this type" });
                }}
              />
              <ManagePanel
                label="Expense Categories"
                items={budgetCategories}
                addMutation={{ mutate: addCategoryMutation.mutate, isPending: addCategoryMutation.isPending }}
                onDelete={(id) => {
                  const c = budgetCategories.find((x) => x.id === id);
                  setPendingDelete({ type: "category", id, label: c?.name ?? "this category" });
                }}
              />
            </div>
          </CardContent>
        )}
      </Card>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === "item") delMutation.mutate(pendingDelete.id);
          else if (pendingDelete.type === "type") delTypeMutation.mutate(pendingDelete.id);
          else delCategoryMutation.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
        title={
          pendingDelete?.type === "item"
            ? `Delete "${pendingDelete.label}"?`
            : pendingDelete?.type === "type"
            ? `Delete type "${pendingDelete?.label}"?`
            : `Delete category "${pendingDelete?.label}"?`
        }
        isPending={delMutation.isPending || delTypeMutation.isPending || delCategoryMutation.isPending}
      />
    </div>
  );
}
