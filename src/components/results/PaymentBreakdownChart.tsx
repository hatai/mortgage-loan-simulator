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

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

interface PaymentBreakdownChartProps {
  result: LoanResult;
}

export function PaymentBreakdownChart({ result }: PaymentBreakdownChartProps) {
  const { monthlyLoanPayment, totalMonthlyPayment, schedule } = result;

  // 最初の月のデータから元金/利息を取得
  const firstMonth = schedule[0];
  const maintenanceFee = totalMonthlyPayment - monthlyLoanPayment;

  // 月次維持費の内訳は総維持費から推定（管理修繕+税金）
  // propertyTaxは年間なので月次換算（totalMonthlyPayment - monthlyLoanPaymentで取得済み）
  const data = [
    {
      name: "月々支払い内訳",
      元金: firstMonth?.principal ?? 0,
      利息: firstMonth?.interest ?? 0,
      維持費: maintenanceFee > 0 ? maintenanceFee : 0,
    },
  ];

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
              <span className="font-semibold">{formatYen(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">月々支払い内訳</h3>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
          />
          <YAxis type="category" dataKey="name" tick={false} width={0} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="元金" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="利息" stackId="a" fill="#8b5cf6" />
          <Bar dataKey="維持費" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* 数値サマリー */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { label: "元金", value: firstMonth?.principal ?? 0, color: "#3b82f6" },
          { label: "利息", value: firstMonth?.interest ?? 0, color: "#8b5cf6" },
          { label: "維持費", value: maintenanceFee, color: "#f59e0b" },
        ].map(
          ({ label, value, color }) =>
            value > 0 && (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-semibold text-gray-800">{formatYen(value)}</span>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
