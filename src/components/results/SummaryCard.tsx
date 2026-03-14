import type { LoanResult } from "#/lib/types";

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface SummaryCardProps {
  result: LoanResult;
}

export function SummaryCard({ result }: SummaryCardProps) {
  const {
    monthlyLoanPayment,
    totalMonthlyPayment,
    totalRepayment,
    totalInterest,
    requiredIncome,
    taxDeduction,
  } = result;

  const maintenanceFee = totalMonthlyPayment - monthlyLoanPayment;

  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-border bg-card">
      {/* メインサマリー */}
      <div className="px-6 py-5">
        <p className="text-sm text-muted-foreground mb-1">月々の総支払額</p>
        <p className="text-3xl font-bold text-foreground tracking-tight">
          {formatYen(totalMonthlyPayment)}
        </p>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ローン返済額</span>
            <span className="font-semibold text-foreground">{formatYen(monthlyLoanPayment)}</span>
          </div>
          {maintenanceFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">維持費（管理・修繕・固定資産税）</span>
              <span className="font-semibold text-foreground">{formatYen(maintenanceFee)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3カード */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">総返済額</p>
          <p className="text-lg font-bold text-foreground">{formatManYen(totalRepayment)}</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">利息総額</p>
          <p className="text-lg font-bold text-foreground">{formatManYen(totalInterest)}</p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">目安年収（25%）</p>
          <p className="text-lg font-bold text-foreground">{formatManYen(requiredIncome[25] ?? 0)}</p>
        </div>
      </div>

      {/* 控除総額 */}
      {taxDeduction.totalDeduction > 0 && (
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 flex items-center justify-between">
          <span className="text-sm text-amber-800 dark:text-amber-200">住宅ローン控除総額（13年合計）</span>
          <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
            -{formatManYen(taxDeduction.totalDeduction)}
          </span>
        </div>
      )}
    </div>
  );
}
