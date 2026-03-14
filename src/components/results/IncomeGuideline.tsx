import type { LoanResult } from "#/lib/types";
import { GlossaryTooltip } from "#/components/shared/Tooltip";

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface IncomeGuidelineProps {
  result: LoanResult;
}

const TIERS = [
  {
    ratio: 20,
    label: "安心",
    description: "余裕をもった返済",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-100",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    valueClass: "text-emerald-700",
    barClass: "bg-emerald-500",
  },
  {
    ratio: 25,
    label: "適正",
    description: "標準的な返済比率",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-100",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-100",
    valueClass: "text-amber-700",
    barClass: "bg-amber-500",
  },
  {
    ratio: 30,
    label: "注意",
    description: "やや負担が大きい",
    bgClass: "bg-red-50",
    borderClass: "border-red-100",
    badgeClass: "bg-red-50 text-red-700 border border-red-100",
    valueClass: "text-red-700",
    barClass: "bg-red-500",
  },
] as const;

export function IncomeGuideline({ result }: IncomeGuidelineProps) {
  const { requiredIncome } = result;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        <GlossaryTooltip termKey="repayment_ratio">返済比率</GlossaryTooltip>別の目安年収
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        月々の総支払額を各返済比率で割り戻した目安年収です。
      </p>

      <div className="space-y-3">
        {TIERS.map(
          ({
            ratio,
            label,
            description,
            bgClass,
            borderClass,
            badgeClass,
            valueClass,
            barClass,
          }) => {
            const income = requiredIncome[ratio] ?? 0;
            // barの幅は20%=60%, 25%=75%, 30%=90%
            const barWidth = ratio === 20 ? "60%" : ratio === 25 ? "75%" : "90%";

            return (
              <div key={ratio} className={`rounded-lg border p-4 ${bgClass} ${borderClass}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
                    >
                      {label}
                    </span>
                    <span className="text-xs text-gray-500">
                      <GlossaryTooltip termKey="repayment_ratio">返済比率</GlossaryTooltip> {ratio}% — {description}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${valueClass}`}>{formatManYen(income)}</span>
                </div>
                {/* プログレスバー（視覚的な相対感） */}
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barClass} transition-all`}
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
            );
          },
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        ※ 目安年収 ＝ 月々総支払額 × 12ヶ月 ÷ 返済比率
      </p>
    </div>
  );
}
