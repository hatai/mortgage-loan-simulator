import type { LoanResult } from "#/lib/types";

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface TaxDeductionSectionProps {
  result: LoanResult;
}

export function TaxDeductionSection({ result }: TaxDeductionSectionProps) {
  const { taxDeduction } = result;
  const { yearlyDeductions, totalDeduction, borrowingLimit, effectiveTotalRepayment } =
    taxDeduction;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
      <details>
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none group">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">住宅ローン控除（年次一覧）</h3>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              13年間合計 {formatManYen(totalDeduction)}
            </span>
          </div>
          <svg
            className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <div className="px-5 pb-5">
          {/* 概要 */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">借入限度額</p>
              <p className="text-base font-bold text-gray-900">{formatManYen(borrowingLimit)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">控除後実質総返済額</p>
              <p className="text-base font-bold text-gray-900">
                {formatManYen(effectiveTotalRepayment)}
              </p>
            </div>
          </div>

          {/* 年次テーブル */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">年次</th>
                  <th className="text-right px-3 py-2 font-medium">年末残高</th>
                  <th className="text-right px-3 py-2 font-medium">控除額（年）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {yearlyDeductions.map(({ year, amount, balance }) => (
                  <tr key={year} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-600">{year}年目</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatManYen(balance)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">
                      {formatYen(amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td className="px-3 py-2 font-semibold text-gray-800" colSpan={2}>
                    控除総額
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {formatManYen(totalDeduction)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            ※
            住宅ローン控除は所得税・住民税から控除されます。実際の控除額は納税額によって変動します。
          </p>
        </div>
      </details>
    </div>
  );
}
