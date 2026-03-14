import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePlans } from "#/hooks/use-plans";
import { PlanCard } from "#/components/plans/PlanCard";
import { CompareTable } from "#/components/plans/CompareTable";

export const Route = createFileRoute("/compare")({ component: ComparePage });

function ComparePage() {
  const { plans } = usePlans();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selectedPlans = plans.filter((p) => selectedIds.includes(p.id));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-6">
      <h1 className="mb-6 text-2xl font-bold">プラン比較</h1>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            比較するプランがありません
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            まずシミュレーション結果を保存してください
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            比較するプランを最大3つ選択してください（{selectedIds.length}/3）
          </p>

          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={() => {}}
                onSelect={toggleSelect}
                selected={selectedIds.includes(plan.id)}
              />
            ))}
          </div>

          {selectedPlans.length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold">比較結果</h2>
              <CompareTable plans={selectedPlans} />
            </section>
          )}
        </>
      )}
    </main>
  );
}
