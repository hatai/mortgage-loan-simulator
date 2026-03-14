import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LoanResult } from "#/lib/types";
import { scheduleToYearlySummary } from "#/lib/loan-calculator";

function formatManYen(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
}

interface RepaymentScheduleChartProps {
  result: LoanResult;
}

export function RepaymentScheduleChart({ result }: RepaymentScheduleChartProps) {
  const yearlySummaries = scheduleToYearlySummary(result.schedule);

  const data = yearlySummaries.map((s) => ({
    year: `${s.year}年`,
    元金: Math.round(s.totalPrincipal / 10000),
    利息: Math.round(s.totalInterest / 10000),
    残高: Math.round(s.endBalance / 10000),
  }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-semibold text-gray-700 mb-1">{label}</p>
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

  // 5年ごとのラベルのみ表示
  const tickFormatter = (value: string) => {
    const year = parseInt(value);
    return year % 5 === 0 || year === 1 ? value : "";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">返済スケジュール（年次推移）</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11 }}
            tickFormatter={tickFormatter}
            interval={0}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}万`} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area
            type="monotone"
            dataKey="元金"
            stackId="1"
            stroke="#3b82f6"
            fill="#bfdbfe"
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="利息"
            stackId="1"
            stroke="#8b5cf6"
            fill="#ddd6fe"
            fillOpacity={0.8}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* 残高推移を補足 */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
        <span>ローン残高は</span>
        <span className="font-semibold text-gray-700">
          {formatManYen(result.schedule[0]?.balance + (result.schedule[0]?.principal ?? 0))}
        </span>
        <span>から開始し、完済まで逓減します。</span>
      </div>
    </div>
  );
}
