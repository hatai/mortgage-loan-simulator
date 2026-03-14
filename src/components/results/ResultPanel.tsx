import type { LoanResult } from "#/lib/types";
import { SummaryCard } from "./SummaryCard";
import { PaymentBreakdownChart } from "./PaymentBreakdownChart";
import { RepaymentScheduleChart } from "./RepaymentScheduleChart";
import { VariableRateChart } from "./VariableRateChart";
import { IncomeGuideline } from "./IncomeGuideline";
import { PrepaymentResult } from "./PrepaymentResult";
import { TaxDeductionSection } from "./TaxDeductionSection";
import { ClosingCostsSection } from "./ClosingCostsSection";
import { RentComparisonChart } from "./RentComparisonChart";

interface ResultPanelProps {
  result: LoanResult | null;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border border-gray-100 bg-white shadow-sm px-6 py-12">
      <h2 className="text-lg font-semibold text-gray-600 mb-2">シミュレーション結果</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        左のフォームで条件を入力して「シミュレーション実行」ボタンを押すと、ここに結果が表示されます。
      </p>
    </div>
  );
}

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* メインサマリー */}
      <SummaryCard result={result} />

      {/* 月々支払い内訳チャート */}
      <PaymentBreakdownChart result={result} />

      {/* 返済スケジュール折れ線 */}
      <RepaymentScheduleChart result={result} />

      {/* 変動金利シナリオ（変動金利選択時のみ） */}
      {result.scenarios && <VariableRateChart result={result} />}

      {/* 返済比率別の年収目安 */}
      <IncomeGuideline result={result} />

      {/* 繰り上げ返済効果（設定時のみ） */}
      {result.prepayment && <PrepaymentResult result={result} />}

      {/* 賃貸vs購入（家賃入力時のみ） */}
      {result.rentComparison && <RentComparisonChart result={result} />}

      {/* 住宅ローン控除（折りたたみ） */}
      <TaxDeductionSection result={result} />

      {/* 諸費用内訳（折りたたみ） */}
      <ClosingCostsSection result={result} />
    </div>
  );
}
