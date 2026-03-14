import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LoanResult } from "#/lib/types";

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface RentComparisonChartProps {
  result: LoanResult;
}

export function RentComparisonChart({ result }: RentComparisonChartProps) {
  const { rentComparison } = result;

  if (!rentComparison) return null;

  const { rentTotal, purchaseTotal, difference, breakEvenYear } = rentComparison;

  const data = [
    {
      name: "総コスト比較",
      賃貸: Math.round(rentTotal / 10000),
      購入: Math.round(purchaseTotal / 10000),
    },
  ];

  const isPurchaseCheaper = difference > 0;

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold">{entry.value.toLocaleString("ja-JP")}万円</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">賃貸 vs 購入 総コスト比較</h3>
      <p className="text-xs text-muted-foreground mb-4">
        ローン完済までの累計コストを比較（購入は住宅ローン控除後の実質額）
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}万`} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="賃貸" fill="#6b7280" radius={[4, 4, 0, 0]} maxBarSize={80} />
          <Bar dataKey="購入" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={80} />
        </BarChart>
      </ResponsiveContainer>

      {/* 差額ハイライト */}
      <div
        className={`mt-4 rounded-lg px-4 py-3 flex items-center justify-between ${
          isPurchaseCheaper
            ? "bg-blue-50 border border-blue-100"
            : "bg-orange-50 border border-orange-100"
        }`}
      >
        <div>
          <p
            className={`text-sm font-semibold ${isPurchaseCheaper ? "text-blue-900" : "text-orange-900"}`}
          >
            {isPurchaseCheaper ? "購入の方がお得" : "賃貸の方がお得"}
          </p>
          {breakEvenYear !== undefined && isPurchaseCheaper && (
            <p className="text-xs text-blue-600 mt-0.5">
              {breakEvenYear}年目で購入コストが賃貸を下回ります
            </p>
          )}
        </div>
        <p
          className={`text-xl font-bold ${isPurchaseCheaper ? "text-blue-700" : "text-orange-700"}`}
        >
          {formatManYen(Math.abs(difference))}
        </p>
      </div>

      {/* 数値サマリー */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">賃貸 累計総額</p>
          <p className="text-base font-bold text-gray-700">{formatManYen(rentTotal)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">購入 実質総額</p>
          <p className="text-base font-bold text-blue-700">{formatManYen(purchaseTotal)}</p>
        </div>
      </div>
    </div>
  );
}
