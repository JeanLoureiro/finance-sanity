import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from "@react-email/components";
import type { SnapshotEmailSections } from "@/lib/snapshotEmailSections";

interface SnapshotEmailProps {
  snapshotDate: Date;
  netWorth: number;
  totalAssets: number;
  liabilitiesTotal: number;
  ownerEmail: string;
  sections: SnapshotEmailSections;
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatUnits(units: number): string {
  return units.toLocaleString("en-AU", { maximumFractionDigits: 4 });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={sectionTitle}>{title}</Text>
  );
}

function DataRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Row style={dataRow}>
      <Column style={dataLeftCell}>
        <Text style={bold ? dataLabelBold : dataLabel}>{label}</Text>
      </Column>
      <Column style={dataRightCell}>
        <Text style={bold ? dataValueBold : dataValue}>{value}</Text>
      </Column>
    </Row>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SnapshotEmail({
  snapshotDate = new Date("2026-04-14"),
  netWorth = 312_450,
  totalAssets = 395_200,
  liabilitiesTotal = 82_750,
  ownerEmail = "user@example.com",
  sections = {
    cash: {
      accounts: [
        { name: "Everyday Account", balance: 8_200 },
        { name: "High Interest Savings", balance: 41_800 },
      ],
      total: 50_000,
    },
    etfs: {
      holdings: [
        { ticker: "VAS", name: "Vanguard Australian Shares", netUnits: 320, costBasis: 28_160 },
        { ticker: "VGS", name: "Vanguard Intl Shares", netUnits: 210, costBasis: 19_740 },
      ],
      total: 47_900,
    },
    stocks: {
      holdings: [
        { ticker: "CBA", name: "Commonwealth Bank", netUnits: 40, costBasis: 4_720 },
      ],
      total: 4_720,
    },
    managedFunds: {
      holdings: [
        { ticker: "VDHG", name: "Vanguard Diversified High Growth", netUnits: 150, costBasis: 12_300 },
      ],
      total: 12_300,
    },
    crypto: {
      holdings: [
        { ticker: "BTC", name: "Bitcoin", netUnits: 0.15, costBasis: 9_500 },
        { ticker: "ETH", name: "Ethereum", netUnits: 2.4, costBasis: 4_200 },
      ],
      total: 13_700,
    },
    otherAssets: {
      assets: [{ description: "Vintage watch collection", value: 6_500 }],
      total: 6_500,
    },
    super: {
      accounts: [{ name: "AustralianSuper", provider: "AustralianSuper", balance: 87_080 }],
      total: 87_080,
    },
    property: {
      properties: [
        { name: "123 Main St, Sydney", currentValue: 920_000, mortgageBalance: 612_000, equity: 308_000 },
      ],
    },
    loans: {
      loans: [{ name: "Car Loan", currentBalance: 18_500, annualRate: 0.0699, regularPayment: 650 }],
      total: 18_500,
    },
    budget: { monthlyIncome: 7_200, monthlySpend: 4_850, monthlySavings: 2_350, savingsRate: 0.3264 },
    sideIncome: { fyTotal: 14_200, fyLabel: "FY2025–26" },
    dividends: { fyTotal: 3_840, reinvested: 1_150, cashReceived: 2_690, fyLabel: "FY2025–26" },
  },
}: SnapshotEmailProps) {
  const dateValue =
    snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate ?? Date.now());
  const formattedDate = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateValue);

  return (
    <Html>
      <Head />
      <Preview>Net Worth Snapshot: {formatAUD(netWorth ?? 0)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Financial Sanity</Heading>
          <Text style={subtitle}>Net Worth Snapshot — {formattedDate}</Text>

          {/* Summary */}
          <Section style={summaryBox}>
            <Text style={netWorthLabel}>Net Worth</Text>
            <Text style={netWorthValue}>{formatAUD(netWorth)}</Text>
            <Row>
              <Column>
                <Text style={summaryItem}>
                  <span style={summaryItemLabel}>Total Assets</span>
                  <br />
                  <span style={summaryItemValue}>{formatAUD(totalAssets)}</span>
                </Text>
              </Column>
              <Column>
                <Text style={summaryItem}>
                  <span style={summaryItemLabel}>Total Liabilities</span>
                  <br />
                  <span style={summaryItemValue}>{formatAUD(liabilitiesTotal)}</span>
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Cash */}
          {sections?.cash && (
            <Section style={sectionContainer}>
              <SectionTitle title="Cash" />
              {sections.cash.accounts.map((account) => (
                <DataRow key={account.name} label={account.name} value={formatAUD(account.balance)} />
              ))}
              <DataRow label="Total" value={formatAUD(sections.cash.total)} bold />
            </Section>
          )}

          {/* ETFs */}
          {sections?.etfs && sections.etfs.holdings.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="ETFs (cost basis)" />
              {sections.etfs.holdings.map((holding) => (
                <DataRow
                  key={holding.ticker}
                  label={`${holding.ticker}${holding.name ? ` — ${holding.name}` : ""} (${formatUnits(holding.netUnits)} units)`}
                  value={formatAUD(holding.costBasis)}
                />
              ))}
              <DataRow label="Total" value={formatAUD(sections.etfs.total)} bold />
            </Section>
          )}

          {/* Stocks */}
          {sections?.stocks && sections.stocks.holdings.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="Stocks (cost basis)" />
              {sections.stocks.holdings.map((holding) => (
                <DataRow
                  key={holding.ticker}
                  label={`${holding.ticker}${holding.name ? ` — ${holding.name}` : ""} (${formatUnits(holding.netUnits)} units)`}
                  value={formatAUD(holding.costBasis)}
                />
              ))}
              <DataRow label="Total" value={formatAUD(sections.stocks.total)} bold />
            </Section>
          )}

          {/* Managed Funds */}
          {sections?.managedFunds && sections.managedFunds.holdings.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="Managed Funds (cost basis)" />
              {sections.managedFunds.holdings.map((holding) => (
                <DataRow
                  key={holding.ticker}
                  label={`${holding.ticker}${holding.name ? ` — ${holding.name}` : ""} (${formatUnits(holding.netUnits)} units)`}
                  value={formatAUD(holding.costBasis)}
                />
              ))}
              <DataRow label="Total" value={formatAUD(sections.managedFunds.total)} bold />
            </Section>
          )}

          {/* Crypto */}
          {sections?.crypto && sections.crypto.holdings.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="Crypto (cost basis)" />
              {sections.crypto.holdings.map((holding) => (
                <DataRow
                  key={holding.ticker}
                  label={`${holding.ticker}${holding.name ? ` — ${holding.name}` : ""} (${formatUnits(holding.netUnits)} units)`}
                  value={formatAUD(holding.costBasis)}
                />
              ))}
              <DataRow label="Total" value={formatAUD(sections.crypto.total)} bold />
            </Section>
          )}

          {/* Other Assets */}
          {sections?.otherAssets && sections.otherAssets.assets.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="Other Assets" />
              {sections.otherAssets.assets.map((asset) => (
                <DataRow key={asset.description} label={asset.description} value={formatAUD(asset.value)} />
              ))}
              <DataRow label="Total" value={formatAUD(sections.otherAssets.total)} bold />
            </Section>
          )}

          {/* Super */}
          {sections?.super && (
            <Section style={sectionContainer}>
              <SectionTitle title="Superannuation" />
              {sections.super.accounts.map((account) => (
                <DataRow
                  key={account.name}
                  label={`${account.name}${account.provider ? ` (${account.provider})` : ""}`}
                  value={formatAUD(account.balance)}
                />
              ))}
              <DataRow label="Total" value={formatAUD(sections.super.total)} bold />
            </Section>
          )}

          {/* Property */}
          {sections?.property && sections.property.properties.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="Property" />
              {sections.property.properties.map((property, index) => (
                <>
                  {index > 0 && <Hr style={divider} />}
                  <DataRow key={`${property.name}-name`} label={property.name} value="" bold />
                  <DataRow key={`${property.name}-value`} label="Current Value" value={formatAUD(property.currentValue)} />
                  <DataRow key={`${property.name}-mortgage`} label="Mortgage Balance" value={formatAUD(property.mortgageBalance)} />
                  <DataRow key={`${property.name}-equity`} label="Equity" value={formatAUD(property.equity)} bold />
                </>
              ))}
            </Section>
          )}

          {/* Loans */}
          {sections?.loans && sections.loans.loans.length > 0 && (
            <Section style={sectionContainer}>
              <SectionTitle title="Loans" />
              {sections.loans.loans.map((loan, index) => (
                <>
                  {index > 0 && <Hr style={divider} />}
                  <DataRow key={`${loan.name}-name`} label={loan.name} value="" bold />
                  <DataRow key={`${loan.name}-balance`} label="Current Balance" value={formatAUD(loan.currentBalance)} />
                  <DataRow key={`${loan.name}-rate`} label="Annual Rate" value={formatPct(loan.annualRate)} />
                  <DataRow key={`${loan.name}-payment`} label="Regular Payment" value={formatAUD(loan.regularPayment)} />
                </>
              ))}
              <DataRow label="Total Outstanding" value={formatAUD(sections.loans.total)} bold />
            </Section>
          )}

          {/* Budget */}
          {sections?.budget && (
            <Section style={sectionContainer}>
              <SectionTitle title="Budget" />
              <DataRow label="Monthly Income" value={formatAUD(sections.budget.monthlyIncome)} />
              <DataRow label="Monthly Spend" value={formatAUD(sections.budget.monthlySpend)} />
              <DataRow label="Monthly Savings" value={formatAUD(sections.budget.monthlySavings)} bold />
              <DataRow label="Savings Rate" value={formatPct(sections.budget.savingsRate)} bold />
            </Section>
          )}

          {/* Side Income */}
          {sections?.sideIncome && (
            <Section style={sectionContainer}>
              <SectionTitle title={`Side Income — ${sections.sideIncome.fyLabel}`} />
              <DataRow label="Total" value={formatAUD(sections.sideIncome.fyTotal)} bold />
            </Section>
          )}

          {/* Dividends */}
          {sections?.dividends && (
            <Section style={sectionContainer}>
              <SectionTitle title={`Dividends — ${sections.dividends.fyLabel}`} />
              <DataRow label="Total Received" value={formatAUD(sections.dividends.fyTotal)} />
              <DataRow label="Reinvested (DRP)" value={formatAUD(sections.dividends.reinvested)} />
              <DataRow label="Cash Received" value={formatAUD(sections.dividends.cashReceived)} bold />
            </Section>
          )}

          {/* Footer */}
          <Text style={footer}>
            This snapshot was automatically recorded for <strong>{ownerEmail}</strong>.
          </Text>
          <Text style={footer}>
            Investment values are shown at cost basis — live prices are not available
            at snapshot time.
          </Text>
          <Text style={footer}>
            To change which sections appear in this email, visit Settings → Snapshot Email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 8px",
  padding: "0 40px",
};

const subtitle = {
  color: "#666",
  fontSize: "14px",
  margin: "0 0 24px",
  padding: "0 40px",
};

const summaryBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  margin: "0 0 24px",
  padding: "24px",
};

const netWorthLabel = {
  color: "#166534",
  fontSize: "13px",
  fontWeight: "600" as const,
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const netWorthValue = {
  color: "#15803d",
  fontSize: "36px",
  fontWeight: "bold" as const,
  margin: "0 0 16px",
};

const summaryItem = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const summaryItemLabel = {
  color: "#666",
  fontSize: "12px",
};

const summaryItemValue = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600" as const,
};

const sectionContainer = {
  marginBottom: "20px",
};

const sectionTitle = {
  color: "#111",
  fontSize: "15px",
  fontWeight: "700" as const,
  margin: "0 0 8px",
  borderBottom: "2px solid #e5e7eb",
  paddingBottom: "6px",
  paddingLeft: "40px",
  paddingRight: "40px",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "4px 0px",
};

const dataRow = {
  borderBottom: "1px solid #f3f4f6",
};

// Padding lives on the <td> so it's respected in all email clients.
const dataLeftCell = {
  paddingLeft: "40px",
};

const dataRightCell = {
  textAlign: "right" as const,
  paddingRight: "40px",
  whiteSpace: "nowrap" as const,
};

const dataLabel = {
  color: "#555",
  fontSize: "13px",
  margin: "6px 0",
};

const dataLabelBold = {
  color: "#111",
  fontSize: "13px",
  fontWeight: "600" as const,
  margin: "6px 0",
};

const dataValue = {
  color: "#333",
  fontSize: "13px",
  margin: "6px 0",
};

const dataValueBold = {
  color: "#111",
  fontSize: "13px",
  fontWeight: "700" as const,
  margin: "6px 0",
};


const footer = {
  color: "#8898aa",
  fontSize: "11px",
  lineHeight: "16px",
  padding: "0 40px",
  marginTop: "6px",
};
