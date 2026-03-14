import type { LoanResult } from "#/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface VariableRateChartProps {
  result: LoanResult;
}

function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

const SCENARIO_COLORS: Record<string, string> = {
  楽観: "#22c55e",
  基準: "#3b82f6",
  悲観: "#ef4444",
};

export function VariableRateChart({ result }: VariableRateChartProps) {
  const { scenarios } = result;
  if (!scenarios || scenarios.length === 0) return null;

  // Build chart data keyed by year
  const yearSet = new Set<number>();
  for (const scenario of scenarios) {
    for (const summary of scenario.yearlySummary) {
      yearSet.add(summary.year);
    }
  }
  const years = Array.from(yearSet).sort((a, b) => a - b);

  const chartData = years.map((year) => {
    const point: Record<string, number> = { year };
    for (const scenario of scenarios) {
      const summary = scenario.yearlySummary.find((s) => s.year === year);
      if (summary) {
        point[scenario.name] = summary.averagePayment;
      }
    }
    return point;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">変動金利シナリオ別の月々返済額</h3>
      <p className="text-xs text-muted-foreground mb-4">
        楽観・基準・悲観の3シナリオで将来の返済額変化をシミュレーションしています。
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tickFormatter={(v) => `${v}年`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `${Math.round(v / 10000)}万`}
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatYen(value), name]}
            labelFormatter={(label) => `${label}年目`}
          />
          <Legend />
          {scenarios.map((scenario) => (
            <Line
              key={scenario.name}
              type="monotone"
              dataKey={scenario.name}
              stroke={SCENARIO_COLORS[scenario.name] ?? "#8884d8"}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
