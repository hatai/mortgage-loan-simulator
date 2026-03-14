import { createFileRoute } from "@tanstack/react-router";
import { usePlans } from "#/hooks/use-plans";
import { PlanCard } from "#/components/plans/PlanCard";

export const Route = createFileRoute("/plans")({ component: PlansPage });

function PlansPage() {
  const { plans, remove } = usePlans();

  return (
    <main className="mx-auto max-w-4xl px-4 pb-8 pt-6">
      <h1 className="mb-6 text-2xl font-bold">保存済みプラン</h1>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            保存済みのプランはありません
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            シミュレーション結果を保存すると、ここに表示されます
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onDelete={remove} />
          ))}
        </div>
      )}
    </main>
  );
}
