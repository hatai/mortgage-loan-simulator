import type { LoanResult } from "#/lib/types";

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface ClosingCostsSectionProps {
  result: LoanResult;
}

export function ClosingCostsSection({ result }: ClosingCostsSectionProps) {
  const { closingCosts } = result;
  const { items, total, totalWithDownPayment } = closingCosts;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <details>
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none group">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">諸費用の内訳</h3>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              合計 {formatManYen(total)}
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
          {/* 諸費用テーブル */}
          <div className="overflow-x-auto rounded-lg border border-gray-100 mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">項目</th>
                  <th className="text-left px-3 py-2 font-medium">説明</th>
                  <th className="text-right px-3 py-2 font-medium">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.name} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {item.description}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {formatYen(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-3 py-2 font-semibold text-gray-800" colSpan={2}>
                    諸費用合計
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {formatManYen(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 必要自己資金 */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">必要自己資金</p>
              <p className="text-xs text-blue-600 mt-0.5">頭金 + 諸費用の合計</p>
            </div>
            <p className="text-xl font-bold text-blue-900">{formatManYen(totalWithDownPayment)}</p>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            ※ 諸費用は物件価格・ローン金額・地域等によって異なります。目安としてご参照ください。
          </p>
        </div>
      </details>
    </div>
  );
}
