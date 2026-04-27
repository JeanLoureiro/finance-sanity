import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GlossaryTerm = {
  term: string;
  definition: string;
  example?: string;
};

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "FIFO (First In First Out)",
    definition: "A method for calculating capital gains tax that assumes you sell the oldest shares first when you dispose of an asset.",
    example: "If you bought 10 shares in Jan at $100 and 10 more in Jun at $150, then sold 5 shares in Dec, FIFO assumes you sold 5 of the January shares.",
  },
  {
    term: "Capital Gains Tax (CGT)",
    definition: "Tax you pay on the profit when you sell an asset (like shares or property) for more than you paid for it.",
    example: "If you buy shares for $1,000 and sell them for $1,500, you have a $500 capital gain that may be taxable.",
  },
  {
    term: "Tax Bracket",
    definition: "The percentage of tax you pay on your income. In Australia, this increases as your income rises (progressive tax system).",
    example: "If your tax bracket is 0.35 (35%), you pay $35 in tax for every $100 earned in that bracket.",
  },
  {
    term: "Brokerage Fee",
    definition: "The fee charged by your broker when you buy or sell shares or other investments.",
    example: "A 0.1% brokerage fee means you pay $10 to buy or sell $10,000 worth of shares.",
  },
  {
    term: "Asset Allocation",
    definition: "How you divide your investments across different asset types (ETFs, stocks, cash, crypto, etc.) to balance risk and returns.",
    example: "A 60/30/10 allocation might mean 60% ETFs, 30% stocks, and 10% cash.",
  },
  {
    term: "Emergency Fund",
    definition: "Money set aside to cover unexpected expenses or loss of income. Usually measured in months of living expenses.",
    example: "A 6-month emergency fund means having enough cash to cover 6 months of your regular expenses.",
  },
  {
    term: "Net Worth",
    definition: "Your total assets (what you own) minus your total liabilities (what you owe).",
    example: "If you have $100,000 in assets and $30,000 in debt, your net worth is $70,000.",
  },
  {
    term: "FIRE (Financial Independence, Retire Early)",
    definition: "A movement focused on saving and investing aggressively to retire much earlier than traditional retirement age.",
    example: "Someone pursuing FIRE might save 50%+ of their income to retire in their 40s instead of 60s.",
  },
  {
    term: "Safe Withdrawal Rate (SWR)",
    definition: "The percentage of your investment portfolio you can withdraw each year in retirement without running out of money. The traditional rule is 4%.",
    example: "With a $1 million portfolio and 4% SWR, you could withdraw $40,000 per year.",
  },
  {
    term: "Superannuation (Super)",
    definition: "Australia's retirement savings system where employers contribute a percentage of your salary into a super fund that you can access at preservation age.",
    example: "If you earn $100,000 and super contribution is 11.5%, your employer adds $11,500 to your super each year.",
  },
  {
    term: "Preservation Age",
    definition: "The minimum age you can access your superannuation in Australia, typically between 55-60 depending on when you were born.",
    example: "If your preservation age is 60, you cannot withdraw super funds before turning 60 (with some exceptions).",
  },
  {
    term: "ETF (Exchange Traded Fund)",
    definition: "A basket of investments (usually shares) that trades on the stock exchange like a single stock. Provides instant diversification.",
    example: "An ASX 200 ETF holds shares in Australia's top 200 companies, so buying one unit gives you exposure to all 200.",
  },
  {
    term: "Dividend",
    definition: "A portion of a company's profits paid out to shareholders, usually quarterly or semi-annually.",
    example: "If you own 100 shares and the company pays a $0.50 dividend per share, you receive $50.",
  },
  {
    term: "Inflation Rate",
    definition: "The rate at which prices for goods and services increase over time, reducing the purchasing power of money.",
    example: "With 3% inflation, something that costs $100 today will cost $103 next year.",
  },
  {
    term: "UK Shared Pool",
    definition: "A capital gains tax calculation method that averages the cost of all shares of the same type, rather than tracking individual purchase lots.",
    example: "If you bought 10 shares at $100 and 10 at $150, the pooled cost is $125 per share regardless of which you sell.",
  },
  {
    term: "Short-Term vs Long-Term Capital Gains",
    definition: "In Australia, assets held for more than 12 months qualify for a 50% CGT discount (long-term), while those held less than 12 months don't (short-term).",
    example: "A $1,000 gain on shares held 18 months is taxed on only $500 (50% discount), but the full $1,000 if held 10 months.",
  },
];

export default function GlossaryPage() {
  return (
    <div className="pb-14">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Learn</p>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Glossary</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Common financial terms explained in plain English
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {glossaryTerms.map((item) => (
          <Card key={item.term}>
            <CardHeader>
              <CardTitle className="text-base">{item.term}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.definition}</p>
              {item.example && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
                  <p className="text-xs text-muted-foreground italic">{item.example}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
