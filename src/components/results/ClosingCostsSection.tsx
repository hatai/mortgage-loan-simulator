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
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <details>
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none group">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">諸費用の内訳</h3>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              合計 {formatManYen(total)}
            </span>
          </div>
          <svg
            className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <div className="px-5 pb-5">
          {/* 諸費用テーブル */}
          <div className="overflow-x-auto rounded-lg border border-border mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">項目</th>
                  <th className="text-left px-3 py-2 font-medium">説明</th>
                  <th className="text-right px-3 py-2 font-medium">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.name} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {item.description}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-foreground whitespace-nowrap">
                      {formatYen(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t border-border">
                <tr>
                  <td className="px-3 py-2 font-semibold text-foreground" colSpan={2}>
                    諸費用合計
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">
                    {formatManYen(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 必要自己資金 */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">必要自己資金</p>
              <p className="text-xs text-muted-foreground mt-0.5">頭金 + 諸費用の合計</p>
            </div>
            <p className="text-xl font-bold text-foreground">{formatManYen(totalWithDownPayment)}</p>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            ※ 諸費用は物件価格・ローン金額・地域等によって異なります。目安としてご参照ください。
          </p>
        </div>
      </details>
    </div>
  );
}
