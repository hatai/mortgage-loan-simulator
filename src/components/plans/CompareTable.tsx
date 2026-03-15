import type { SavedPlan } from "#/lib/types";

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

const INTEREST_TYPE_LABELS = { fixed: "固定", variable: "変動", flat35: "フラット35" } as const;
const METHOD_LABELS = { equal_payment: "元利均等", equal_principal: "元金均等" } as const;

interface CompareTableProps {
  plans: SavedPlan[];
}

interface Row {
  label: string;
  values: string[];
}

export function CompareTable({ plans }: CompareTableProps) {
  if (plans.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">比較するプランを選択してください</p>;
  }

  const rows: Row[] = [
    { label: "物件価格", values: plans.map((p) => `${p.input.propertyPrice.toLocaleString()}万円`) },
    { label: "頭金", values: plans.map((p) => `${p.input.downPayment.toLocaleString()}万円`) },
    {
      label: "借入額",
      values: plans.map(
        (p) => `${(p.input.propertyPrice - p.input.downPayment).toLocaleString()}万円`,
      ),
    },
    {
      label: "金利タイプ",
      values: plans.map((p) => INTEREST_TYPE_LABELS[p.input.interestType]),
    },
    { label: "金利", values: plans.map((p) => `${p.input.interestRate}%`) },
    { label: "返済期間", values: plans.map((p) => `${p.input.loanTermYears}年`) },
    {
      label: "返済方式",
      values: plans.map((p) => METHOD_LABELS[p.input.repaymentMethod]),
    },
    {
      label: "月々ローン返済額",
      values: plans.map((p) => formatYen(p.result.monthlyLoanPayment)),
    },
    {
      label: "月々総支払額",
      values: plans.map((p) => formatYen(p.result.totalMonthlyPayment)),
    },
    { label: "総返済額", values: plans.map((p) => formatManYen(p.result.totalRepayment)) },
    { label: "利息総額", values: plans.map((p) => formatManYen(p.result.totalInterest)) },
    {
      label: "目安年収(25%)",
      values: plans.map((p) => formatManYen(p.result.requiredIncome[25] ?? 0)),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground" />
            {plans.map((p) => (
              <th key={p.id} className="px-3 py-2 text-right font-semibold">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium text-muted-foreground">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className="px-3 py-2 text-right">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
