import { useState, useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { InputPanel } from "#/components/simulator/InputPanel";
import { ResultPanel } from "#/components/results/ResultPanel";
import { SavePlanBar } from "#/components/plans/SavePlanBar";
import { calculateLoan } from "#/server/calculate";
import { usePlans } from "#/hooks/use-plans";
import { decodeParams } from "#/lib/url-params";
import { DEFAULT_LOAN_INPUT } from "#/lib/types";
import type { LoanInput, LoanResult } from "#/lib/types";

export const Route = createFileRoute("/")({
  component: SimulatorPage,
  validateSearch: (search: Record<string, unknown>) => search,
});

function SimulatorPage() {
  const searchParams = Route.useSearch();
  const { save } = usePlans();

  const [input, setInput] = useState<LoanInput>(() => {
    const queryString = new URLSearchParams(
      Object.entries(searchParams).map(([k, v]) => [k, String(v)]),
    ).toString();
    if (queryString) {
      return decodeParams(queryString);
    }
    return DEFAULT_LOAN_INPUT;
  });

  const [result, setResult] = useState<LoanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-calculate if URL params were provided
  useEffect(() => {
    const queryString = new URLSearchParams(
      Object.entries(searchParams).map(([k, v]) => [k, String(v)]),
    ).toString();
    if (queryString) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await calculateLoan({ data: input });
      setResult(res);
    } catch (err) {
      console.error("Calculation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (name: string) => {
    if (result) {
      save(name, input, result);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8 pt-6 print:max-w-none print:px-0 print:pt-0">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="print:hidden">
          <InputPanel
            input={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
        <div>
          <ResultPanel result={result} />
        </div>
      </div>

      <div className="mt-4 print:hidden">
        <SavePlanBar input={input} result={result} onSave={handleSave} />
      </div>

      {/* Print-only input summary */}
      <div className="hidden print:block print:mb-4">
        <h2 className="mb-2 text-lg font-bold">入力条件</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-1 font-medium">物件価格</td>
              <td className="py-1 text-right">{input.propertyPrice.toLocaleString()}万円</td>
              <td className="py-1 pl-4 font-medium">頭金</td>
              <td className="py-1 text-right">{input.downPayment.toLocaleString()}万円</td>
            </tr>
            <tr className="border-b">
              <td className="py-1 font-medium">金利</td>
              <td className="py-1 text-right">{input.interestRate}%</td>
              <td className="py-1 pl-4 font-medium">返済期間</td>
              <td className="py-1 text-right">{input.loanTermYears}年</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
