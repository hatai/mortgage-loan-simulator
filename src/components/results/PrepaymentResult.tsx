import type { LoanResult } from "#/lib/types";

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface PrepaymentResultProps {
  result: LoanResult;
}

export function PrepaymentResult({ result }: PrepaymentResultProps) {
  const { prepayment, totalRepayment } = result;

  if (!prepayment) return null;

  const originalTotal = totalRepayment;
  const newTotal = prepayment.newTotalRepayment;
  const saved = prepayment.totalSaved;
  const shortenedMonths = prepayment.shortenedMonths;
  const newMonthlyPayment = prepayment.newMonthlyPayment;

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">繰り上げ返済効果</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-gray-100">
              <th className="text-left pb-2 font-medium">項目</th>
              <th className="text-right pb-2 font-medium">繰り上げなし</th>
              <th className="text-right pb-2 font-medium text-muted-foreground">繰り上げあり</th>
              <th className="text-right pb-2 font-medium text-muted-foreground">差額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr>
              <td className="py-2.5 text-muted-foreground">総返済額</td>
              <td className="py-2.5 text-right font-medium text-foreground">
                {formatManYen(originalTotal)}
              </td>
              <td className="py-2.5 text-right font-medium text-foreground">
                {formatManYen(newTotal)}
              </td>
              <td className="py-2.5 text-right font-bold text-foreground">-{formatManYen(saved)}</td>
            </tr>
            {newMonthlyPayment !== undefined && (
              <tr>
                <td className="py-2.5 text-muted-foreground">月々返済額</td>
                <td className="py-2.5 text-right font-medium text-foreground">—</td>
                <td className="py-2.5 text-right font-medium text-foreground">
                  {formatYen(newMonthlyPayment)}
                </td>
                <td className="py-2.5 text-right text-muted-foreground">軽減</td>
              </tr>
            )}
            {shortenedMonths !== undefined && shortenedMonths > 0 && (
              <tr>
                <td className="py-2.5 text-muted-foreground">返済期間短縮</td>
                <td className="py-2.5 text-right font-medium text-foreground">—</td>
                <td className="py-2.5 text-right font-medium text-foreground">
                  {Math.floor(shortenedMonths / 12)}年{shortenedMonths % 12}ヶ月短縮
                </td>
                <td className="py-2.5 text-right text-foreground font-semibold">
                  -{shortenedMonths}ヶ月
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ハイライト */}
      <div className="mt-4 rounded-lg bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-foreground font-medium">繰り上げ返済による節約効果</span>
        <span className="text-xl font-bold text-foreground">{formatManYen(saved)}</span>
      </div>
    </div>
  );
}
